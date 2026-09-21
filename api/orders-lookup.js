import { checkRateLimit, getClientIp, json, supabase } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  const clientIp = getClientIp(req);
  if (!checkRateLimit(`order-lookup:${clientIp}`, 20, 60_000)) {
    return json(res, 429, { error: "Too many lookup requests. Please wait a moment." });
  }

  const query = String(req.query.q || req.query.order_code || "").trim().slice(0, 80);
  const phone = String(req.query.phone || "").trim().slice(0, 30);

  if (!query && !phone) {
    return json(res, 400, { error: "Search query required" });
  }

  try {
    const orderCode = query.replace(/[%_]/g, "");
    const customerPhone = phone.replace(/[%_]/g, "");
    const orderFilter = orderCode ? `order_code.eq.${encodeURIComponent(orderCode)}` : "";
    const phoneFilter = customerPhone ? `customer_phone.eq.${encodeURIComponent(customerPhone)}` : "";
    const filters = [orderFilter, phoneFilter].filter(Boolean).join(",");

    if (!filters) {
      return json(res, 400, { error: "Search query required" });
    }

    const rows = await supabase(`orders?or=(${filters})&select=id,order_code,customer_name,customer_phone,address,items,total,status,created_at&limit=5`);
    json(res, 200, rows);
  } catch (error) {
    json(res, error.status || 500, { error: error.message });
  }
}
