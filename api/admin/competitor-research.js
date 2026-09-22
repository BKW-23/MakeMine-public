import { checkRateLimit, getClientIp, json, requireUser } from "../_supabase.js";

const clean = (value, max = 240) => String(value || "").trim().slice(0, max);

const normalizeResults = (data) => {
  const candidates = Array.isArray(data) ? data : data?.results || data?.data || data?.organic_results || [];
  return candidates
    .map((item) => ({
      title: clean(item?.title || item?.name, 180),
      url: clean(item?.url || item?.link, 500),
      snippet: clean(item?.snippet || item?.description || item?.text, 360),
    }))
    .filter((item) => item.title && /^https?:\/\//i.test(item.url))
    .slice(0, 10);
};

export default async function handler(req, res) {
  try {
    await requireUser(req, true);
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

    const clientIp = getClientIp(req);
    if (!(await checkRateLimit(`admin-competitor-research:${clientIp}`, 3, 60 * 60_000))) {
      return json(res, 429, { error: "Chỉ được nghiên cứu tối đa 3 lần mỗi giờ." });
    }

    const apiKey = process.env.TINYFISH_API_KEY;
    if (!apiKey) return json(res, 503, { error: "TINYFISH_API_KEY chưa được cấu hình trên server." });

    const categories = Array.isArray(req.body?.categories) ? req.body.categories : ["móc khóa", "gương", "lược"];
    const query = `giá sản phẩm cá nhân hóa ${categories.slice(0, 5).map((item) => clean(item, 40)).join(" ")} Việt Nam`;
    const response = await fetch(`https://api.search.tinyfish.ai?query=${encodeURIComponent(query)}&language=vi`, {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || data?.error || "TinyFish search failed");

    json(res, 200, { query, results: normalizeResults(data), generated_at: new Date().toISOString() });
  } catch (error) {
    json(res, error.status || 502, { error: error.message || "Không thể nghiên cứu giá đối thủ." });
  }
}