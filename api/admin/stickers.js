import { json, requireUser, supabase, normalizeStickerImageUrl } from "../_supabase.js";

export default async function handler(req, res) {
  try {
    await requireUser(req, true);

    if (req.method === "GET") {
      const rows = await supabase("stickers?select=*&order=sort_order.asc,created_at.desc");
      return json(res, 200, rows);
    }

    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    const body = req.body || {};
    const slug = String(body.slug || body.label || "").trim();
    const label = String(body.label || "").trim();
    if (!label || !slug) {
      return json(res, 400, { error: "Sticker label and slug are required" });
    }

    const sanitizedBody = {
      ...body,
      slug: slug.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/\s+/g, "-").replace(/[^a-z0-9-_]+/g, "").slice(0, 120),
      label: label.slice(0, 120),
      emoji: String(body.emoji || "").slice(0, 20),
      image_url: normalizeStickerImageUrl(body.image_url),
      icon_url: normalizeStickerImageUrl(body.icon_url),
      active: Boolean(body.active !== false),
      sort_order: Number(body.sort_order ?? 0),
    };

    const rows = await supabase("stickers", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(sanitizedBody),
    });
    return json(res, 201, rows[0]);
  } catch (error) {
    json(res, error.status || 500, { error: error.message });
  }
}
