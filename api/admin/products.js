import { json, requireUser, supabase } from "../_supabase.js";

export default async function handler(req, res) {
  try {
    await requireUser(req, true);

    if (req.method === "GET") {
      const rows = await supabase("products?select=*&order=created_at.desc");
      return json(res, 200, rows);
    }

    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    const body = req.body || {};
    if (!body.name || !body.slug || !body.category || !Number.isFinite(Number(body.base_price))) {
      return json(res, 400, { error: "Invalid product" });
    }
    const rows = await supabase("products", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...body, base_price: Number(body.base_price) }),
    });
    json(res, 201, rows[0]);
  } catch (error) {
    json(res, error.status || 500, { error: error.message });
  }
}
