import { json, requireUser, supabase, normalizeStickerImageUrl } from "../../_supabase.js";

export default async function handler(req, res) {
  try {
    await requireUser(req, true);
    const id = encodeURIComponent(req.query.id);

    if (req.method === "GET") {
      const rows = await supabase(`stickers?id=eq.${id}&select=*`);
      return json(res, 200, rows[0] || null);
    }

    if (req.method === "PATCH") {
      const body = req.body || {};
      const update = {};
      if (body.label !== undefined) update.label = String(body.label).slice(0, 120);
      if (body.slug !== undefined) update.slug = String(body.slug).slice(0, 120);
      if (body.emoji !== undefined) update.emoji = String(body.emoji).slice(0, 20);
      if (body.image_url !== undefined) update.image_url = normalizeStickerImageUrl(body.image_url);
      if (body.icon_url !== undefined) update.icon_url = normalizeStickerImageUrl(body.icon_url);
      if (body.active !== undefined) update.active = Boolean(body.active);
      if (body.sort_order !== undefined) update.sort_order = Number(body.sort_order);
      const rows = await supabase(`stickers?id=eq.${id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(update),
      });
      return json(res, 200, rows[0]);
    }

    if (req.method !== "DELETE") return json(res, 405, { error: "Method not allowed" });
    await supabase(`stickers?id=eq.${id}`, { method: "DELETE" });
    res.status(204).end();
  } catch (error) {
    json(res, error.status || 500, { error: error.message });
  }
}
