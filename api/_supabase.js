import crypto from "node:crypto";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rateLimitBuckets = new Map();

const localCheckRateLimit = (key, limit = 10, windowMs = 60_000) => {
  const bucket = rateLimitBuckets.get(key) || [];
  const now = Date.now();
  const recent = bucket.filter((time) => now - time < windowMs);
  recent.push(now);

  rateLimitBuckets.set(key, recent);
  return recent.length <= limit;
};

const remoteCheckRateLimit = async (key, limit = 10, windowMs = 60_000) => {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) return null;

  const normalizedKey = `makemine:${String(key || "default").replace(/[^a-zA-Z0-9:_-]/g, "_")}`;
  try {
    const response = await fetch(`${redisUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([["INCR", normalizedKey]]),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return null;

    const rawValue = Array.isArray(data)
      ? Number(data?.[0]?.result ?? data?.[0]?.[1] ?? data?.result ?? 0)
      : Number(data?.result ?? 0);

    if (!Number.isFinite(rawValue)) return null;

    if (rawValue === 1) {
      await fetch(`${redisUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([["EXPIRE", normalizedKey, Math.ceil(windowMs / 1000)]]),
      }).catch(() => {});
    }

    return rawValue <= limit;
  } catch {
    return null;
  }
};

export const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"] || req.headers["x-vercel-forwarded-for"] || req.headers["x-real-ip"] || "";
  const firstValue = String(forwarded).split(",")[0]?.trim();
  return firstValue || req.socket?.remoteAddress || "unknown";
};

export const checkRateLimit = async (key, limit = 10, windowMs = 60_000) => {
  const remoteResult = await remoteCheckRateLimit(key, limit, windowMs);
  if (remoteResult !== null) return remoteResult;
  return localCheckRateLimit(key, limit, windowMs);
};

export const generateOrderCode = () => {
  const value = crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `MM-${String(value).replace(/-/g, "").slice(0, 12).toUpperCase()}`;
};

export const buildStockUsageMap = (items = []) => {
  const usage = {};
  for (const item of Array.isArray(items) ? items : []) {
    const productId = String(item?.product_id || "");
    const quantity = Number(item?.quantity || 0);
    if (!productId || !Number.isFinite(quantity) || quantity < 1) continue;
    usage[productId] = (usage[productId] || 0) + quantity;
  }
  return usage;
};

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#039;");

export const buildOrderConfirmationEmail = ({ customer_name, customer_email, order_code, total }) => {
  const email = String(customer_email || "").trim();
  const code = String(order_code || "MM-ORDER").trim().toUpperCase();
  const name = String(customer_name || "Khách hàng").trim() || "Khách hàng";
  const amount = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(total || 0));
  const safeName = escapeHtml(name);
  return {
    to: email,
    subject: `Xác nhận đơn hàng ${code}`,
    text: `Xin chào ${name},\n\nĐơn hàng ${code} của bạn đã được xác nhận với tổng giá trị ${amount}.\n\nCảm ơn bạn đã đặt hàng tại MakeMine.`,
    html: `<p>Xin chào <strong>${safeName}</strong>,</p><p>Đơn hàng <strong>${escapeHtml(code)}</strong> của bạn đã được xác nhận.</p><p><strong>Tổng giá trị:</strong> ${amount}</p><p>Cảm ơn bạn đã đặt hàng tại MakeMine.</p>`,
  };
};

export const sendOrderConfirmationEmail = async (payload = {}) => {
  const emailPayload = buildOrderConfirmationEmail(payload);
  if (!emailPayload.to) return null;

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.info(`[email] skipped order confirmation for ${emailPayload.to}`);
    return emailPayload;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "noreply@makemine.vn",
      to: emailPayload.to,
      subject: emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || "Unable to send confirmation email");
    error.status = response.status;
    throw error;
  }

  return data;
};

export const supabase = async (path, options = {}) => {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || data?.hint || "Database request failed");
    error.status = response.status;
    throw error;
  }
  return data;
};

export const recordApiUsage = async (provider, success = true) => {
  if (!provider) return;
  await supabase("rpc/increment_api_usage", {
    method: "POST",
    body: JSON.stringify({ p_provider: provider, p_success: Boolean(success) }),
  }).catch(() => {});
};

export const getBearer = (req) => {
  const value = req.headers.authorization || "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
};

export const requireUser = async (req, admin = false) => {
  const token = getBearer(req);
  if (!token) {
    const error = new Error("Authentication required");
    error.status = 401;
    throw error;
  }
  const authResponse = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!authResponse.ok) {
    const error = new Error("Invalid session");
    error.status = 401;
    throw error;
  }
  const user = await authResponse.json();
  const profiles = await supabase(`profiles?id=eq.${encodeURIComponent(user.id)}&select=role`);
  const role = profiles[0]?.role || "user";
  if (admin && role !== "admin") {
    const error = new Error("Admin access required");
    error.status = 403;
    throw error;
  }
  return { ...user, role };
};

export const json = (res, status, body) => {
  res.status(status).setHeader("Content-Type", "application/json").send(body);
};
