import { json, requireUser, supabase } from "../../_supabase.js";

export default async function handler(req, res) {
  try {
    await requireUser(req, true);
    const id = encodeURIComponent(req.query.id);

    if (req.method === "GET") {
      const rows = await supabase(`products?id=eq.${id}&select=*`);
      return json(res, 200, rows[0] || null);
    }

    if (req.method === "PATCH") {
      const body = req.body || {};
      const update = {};
      if (body.name) update.name = String(body.name).slice(0, 120);
      if (body.slug) update.slug = String(body.slug).slice(0, 120);
      if (body.category) update.category = String(body.category).slice(0, 40);
      if (body.base_price !== undefined) update.base_price = Number(body.base_price);
      if (body.short_description !== undefined) update.short_description = String(body.short_description || "").slice(0, 500);
      if (body.image_url !== undefined) update.image_url = String(body.image_url || "").slice(0, 500);
      if (body.customizable !== undefined) update.customizable = Boolean(body.customizable);
      if (Array.isArray(body.colors)) update.colors = body.colors.slice(0, 20);
      if (Array.isArray(body.fonts)) update.fonts = body.fonts.slice(0, 20);
      if (body.featured !== undefined) update.featured = Boolean(body.featured);
      if (body.stock !== undefined) update.stock = Number(body.stock);
      const rows = await supabase(`products?id=eq.${id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(update),
      });
      return json(res, 200, rows[0]);
    }

    if (req.method !== "DELETE") return json(res, 405, { error: "Method not allowed" });
    await supabase(`products?id=eq.${id}`, { method: "DELETE" });
    res.status(204).end();
  } catch (error) {
    json(res, error.status || 500, { error: error.message });
  }
}
