import { json, supabase } from "./_supabase.js";

const DEFAULT_CONTACT = {
  address: "ĐH FPT, TP. Hà Nội",
  email: "hotro@makemine.vn",
  tiktok: "makemine",
  links: [],
};

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  try {
    const rows = await supabase("site_settings?key=eq.contact&select=value");
    const value = rows[0]?.value || {};
    const contact = {
      address: String(value.address ?? DEFAULT_CONTACT.address),
      email: String(value.email ?? DEFAULT_CONTACT.email),
      tiktok: String(value.tiktok ?? DEFAULT_CONTACT.tiktok),
      links: (Array.isArray(value.links) ? value.links : [])
        .slice(0, 10)
        .map((item) => ({ label: String(item?.label || "").trim().slice(0, 40), url: String(item?.url || "").trim().slice(0, 500) }))
        .filter((item) => item.label && (/^https:\/\//i.test(item.url) || /^mailto:[^\s@?]+@[^\s@?.]+\.[^\s@?]+(?:\?.*)?$/i.test(item.url))),
    };
    if (contact.email && !contact.links.some((link) => link.url.toLowerCase() === `mailto:${contact.email}`.toLowerCase())) {
      contact.links.push({ label: "Email", url: `mailto:${contact.email}` });
    }
    if (contact.tiktok && !contact.links.some((link) => link.label.toLowerCase() === "tiktok")) {
      contact.links.push({ label: "TikTok", url: `https://www.tiktok.com/@${encodeURIComponent(contact.tiktok.replace(/^@/, ""))}` });
    }
    return json(res, 200, { contact });
  } catch (error) {
    return json(res, error.status || 500, { error: "Không thể tải thông tin liên hệ." });
  }
}