import { json, supabase } from "./_supabase.js";

const DEFAULT_CONTACT = {
  address: "ĐH FPT, TP. Hà Nội",
  email: "hotro@makemine.vn",
  tiktok: "makemine",
  links: [],
};

const validContactUrl = (value) => /^https:\/\//i.test(value || "")
  || /^mailto:[^\s@?]+@[^\s@?.]+\.[^\s@?]+(?:\?.*)?$/i.test(value || "");

const normalizeEntries = (value) => {
  if (Array.isArray(value.entries)) {
    return value.entries.slice(0, 20).map((entry) => ({
      type: entry?.type === "link" ? "link" : "text",
      label: String(entry?.label || "").trim().slice(0, 40),
      value: String(entry?.value || "").trim().slice(0, 500),
    })).filter((entry) => entry.value && (entry.type === "text" || (entry.label && validContactUrl(entry.value))));
  }

  const address = String(value.address ?? DEFAULT_CONTACT.address).trim();
  const email = String(value.email ?? DEFAULT_CONTACT.email).trim();
  const tiktok = String(value.tiktok ?? DEFAULT_CONTACT.tiktok).trim().replace(/^@/, "");
  const entries = [];
  if (address) entries.push({ type: "text", label: "", value: address });
  if (email) entries.push({ type: "link", label: "Email", value: `mailto:${email}` });
  if (tiktok) entries.push({ type: "link", label: "TikTok", value: `https://www.tiktok.com/@${encodeURIComponent(tiktok)}` });
  for (const link of Array.isArray(value.links) ? value.links.slice(0, 20) : []) {
    const entry = { type: "link", label: String(link?.label || "").trim().slice(0, 40), value: String(link?.url || "").trim().slice(0, 500) };
    if (entry.label && validContactUrl(entry.value) && !entries.some((existing) => existing.value.toLowerCase() === entry.value.toLowerCase())) entries.push(entry);
  }
  return entries.slice(0, 20);
};

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  try {
    const rows = await supabase("site_settings?key=eq.contact&select=value");
    const value = rows[0]?.value || {};
    const contact = { entries: normalizeEntries({ ...DEFAULT_CONTACT, ...value }) };
    return json(res, 200, { contact });
  } catch (error) {
    return json(res, error.status || 500, { error: "Không thể tải thông tin liên hệ." });
  }
}