import { checkRateLimit, generateOrderCode, getBearer, getClientIp, json, requireUser, supabase } from "./_supabase.js";

const cleanText = (value, max) => String(value || "").trim().slice(0, max);

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const clientIp = getClientIp(req);
  if (!checkRateLimit(`orders:${clientIp}`, 12, 60_000)) {
    return json(res, 429, { error: "Too many requests. Please wait a moment and try again." });
  }

  try {
    const body = req.body || {};
    const name = cleanText(body.customer_name, 120);
    const phone = cleanText(body.customer_phone, 30);
    const address = cleanText(body.address, 300);
    const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
    if (!name || !phone || !address || !items.length) {
      return json(res, 400, { error: "Missing order details" });
    }

    const productIds = [...new Set(items.map((item) => String(item?.product_id || "")).filter(Boolean))];
    if (!productIds.length) {
      return json(res, 400, { error: "No valid products were provided" });
    }

    const products = await supabase(`products?id=in.(${productIds.map((id) => encodeURIComponent(id)).join(",")})&select=id,name,base_price,stock`);
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
        customization: item?.customization && typeof item.customization === "object" ? item.customization : {},
      };
    });

    const total = normalizedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const providedTotal = Number(body.total);
    if (Number.isFinite(providedTotal) && Math.abs(providedTotal - total) > 0.01) {
      return json(res, 400, { error: "Order total does not match server-side price calculation" });
    }

    const orderCode = generateOrderCode();
    let userId = null;
    if (getBearer(req)) {
      userId = (await requireUser(req)).id;
    }

    const created = await supabase("orders", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        order_code: orderCode,
        customer_name: name,
        customer_phone: phone,
        customer_email: cleanText(body.customer_email, 160) || null,
        address,
        items: normalizedItems,
        total,
        preview_confirmed: Boolean(body.preview_confirmed),
        user_id: userId,
      }),
    });

    const stockUpdates = Object.entries(
      normalizedItems.reduce((result, item) => {
        const productId = String(item.product_id);
        result[productId] = (result[productId] || 0) + item.quantity;
        return result;
      }, {})
    );

    await Promise.all(
      stockUpdates.map(async ([productId, quantity]) => {
        const currentProduct = byId.get(String(productId));
        if (!currentProduct) return;
        await supabase(`products?id=eq.${encodeURIComponent(String(productId))}`, {
          method: "PATCH",
          body: JSON.stringify({ stock: Math.max(0, Number(currentProduct.stock) - Number(quantity)) }),
        });
      })
    );

    json(res, 201, created[0]);
  } catch (error) {
    json(res, error.status || 500, { error: error.message });
  }
}
