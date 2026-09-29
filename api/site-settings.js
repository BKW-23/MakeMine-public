import { json, supabase } from "./_supabase.js";

const DEFAULT_CONTACT = {
  address: "ĐH FPT, TP. Hà Nội",
  email: "hotro@makemine.vn",
  tiktok: "makemine",
};

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  try {
    const rows = await supabase("site_settings?key=eq.contact&select=value");
    const value = rows[0]?.value || {};
    const contact = Object.fromEntries(
      Object.keys(DEFAULT_CONTACT).map((key) => [key, String(value[key] ?? DEFAULT_CONTACT[key])])
    );
    return json(res, 200, { contact });
  } catch (error) {
    return json(res, error.status || 500, { error: "Không thể tải thông tin liên hệ." });
  }
}