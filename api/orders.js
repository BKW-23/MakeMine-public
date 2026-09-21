import {
  checkRateLimit,
  generateOrderCode,
  getBearer,
  getClientIp,
  json,
  requireUser,
  sendOrderConfirmationEmail,
  supabase,
} from "./_supabase.js";

const cleanText = (value, max) => String(value || "").trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeCustomization = (customization, product) => {
  if (!customization || typeof customization !== "object") return {};
  const allowedColors = new Set((Array.isArray(product?.colors) ? product.colors : []).map((color) => String(color).trim()));
  const allowedFonts = new Set((Array.isArray(product?.fonts) ? product.fonts : []).map((font) => String(font).trim()));
  const next = {};

  const name = cleanText(customization.name, 40);
  if (name) next.name = name;

  const color = cleanText(customization.color, 40);
  if (color && (allowedColors.size === 0 || allowedColors.has(color))) next.color = color;

  const font = cleanText(customization.font, 40);
  if (font && (allowedFonts.size === 0 || allowedFonts.has(font))) next.font = font;

  const message = cleanText(customization.message, 120);
  if (message) next.message = message;

  const sticker = cleanText(customization.sticker, 40);
  if (sticker && sticker !== "none") next.sticker = sticker;

  const engravingType = String(customization.engravingType || "").trim();
  if (["raised", "engraved"].includes(engravingType)) next.engravingType = engravingType;

  return next;
};

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const clientIp = getClientIp(req);
  if (!(await checkRateLimit(`orders:${clientIp}`, 12, 60_000))) {
    return json(res, 429, { error: "Too many requests. Please wait a moment and try again." });
  }

  try {
    const body = req.body || {};
    const name = cleanText(body.customer_name, 120);
    const phone = cleanText(body.customer_phone, 30);
    const address = cleanText(body.address, 300);
    const email = cleanText(body.customer_email, 160) || null;
    if (email && !EMAIL_RE.test(email)) {
      return json(res, 400, { error: "Invalid customer email" });
    }

    const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
    if (!name || !phone || !address || !items.length) {
      return json(res, 400, { error: "Missing order details" });
    }

    const productIds = [...new Set(items.map((item) => String(item?.product_id || "")).filter(Boolean))];
    if (!productIds.length) {
      return json(res, 400, { error: "No valid products were provided" });
    }

    const products = await supabase(`products?id=in.(${productIds.map((id) => encodeURIComponent(id)).join(",")})&select=id,name,base_price,stock,colors,fonts`);
    const byId = new Map(products.map((product) => [String(product.id), product]));

    const normalizedItems = items.map((item) => {
      const productId = String(item?.product_id || "");
      const product = byId.get(productId);
      const quantity = Number(item?.quantity);

      if (!product) {
        throw Object.assign(new Error("Invalid product"), { status: 400 });
      }

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        throw Object.assign(new Error("Invalid quantity"), { status: 400 });
      }

      if (product.stock < quantity) {
        throw Object.assign(new Error(`Out of stock: ${product.name}`), { status: 409 });
      }

      return {
        product_id: product.id,
        name: product.name,
        quantity,
        unit_price: Number(product.base_price),
        customization: normalizeCustomization(item?.customization, product),
      };
    });

    const baseTotal = normalizedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const shippingFee = 0;
    const discount = 0;
    const customizationFee = 0;
    const finalTotal = Math.max(0, baseTotal + shippingFee + customizationFee - discount);

    const providedTotal = Number(body.total);
    if (Number.isFinite(providedTotal) && Math.abs(providedTotal - finalTotal) > 0.01) {
      return json(res, 400, { error: "Order total does not match server-side price calculation" });
    }

    const orderCode = generateOrderCode();
    let userId = null;
    if (getBearer(req)) {
      userId = (await requireUser(req)).id;
    }

    const payload = {
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      address,
      items: normalizedItems,
      total: finalTotal,
      preview_confirmed: Boolean(body.preview_confirmed),
      user_id: userId,
      order_notes: cleanText(body.order_notes, 500) || null,
      shipping_fee: shippingFee,
      discount,
      customization_fee: customizationFee,
      payment_status: "cod",
    };

    const created = await supabase("rpc/create_order_with_stock_update", {
      method: "POST",
      body: JSON.stringify({
        p_customer_name: payload.customer_name,
        p_customer_phone: payload.customer_phone,
        p_customer_email: payload.customer_email,
        p_address: payload.address,
        p_items: payload.items,
        p_total: payload.total,
        p_preview_confirmed: payload.preview_confirmed,
        p_user_id: payload.user_id,
        p_order_notes: payload.order_notes,
        p_shipping_fee: payload.shipping_fee,
        p_discount: payload.discount,
        p_customization_fee: payload.customization_fee,
        p_payment_status: payload.payment_status,
      }),
    });

    if (email) {
      try {
        await sendOrderConfirmationEmail({
          customer_name: name,
          customer_email: email,
          order_code: created?.order_code || created?.orderCode || orderCode,
          total: created?.total ?? finalTotal,
        });
      } catch (error) {
        console.warn("Order confirmation email skipped:", error.message || error);
      }
    }

    return json(res, 201, created || { order_code: orderCode, customer_name: name, total: finalTotal, status: "pending" });
  } catch (error) {
    json(res, error.status || 500, { error: error.message });
  }
}
