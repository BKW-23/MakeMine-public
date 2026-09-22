import { checkRateLimit, getClientIp, json } from "./_supabase.js";

const clean = (value, max = 120) => String(value || "").trim().slice(0, max);

const normalizeResults = (data) => {
  const candidates = Array.isArray(data) ? data : data?.results || data?.data || data?.organic_results || [];
  return candidates
    .map((item) => ({
      title: clean(item?.title || item?.name, 180),
      url: clean(item?.url || item?.link, 500),
      snippet: clean(item?.snippet || item?.description || item?.text, 260),
    }))
    .filter((item) => item.title && /^https?:\/\//i.test(item.url))
    .slice(0, 5);
};

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const clientIp = getClientIp(req);
  if (!(await checkRateLimit(`gift-trends:${clientIp}`, 8, 60_000))) {
    return json(res, 429, { error: "Too many requests. Please try again later." });
  }

  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) return json(res, 503, { error: "Tìm xu hướng web chưa được cấu hình trên server." });

  const occasion = clean(req.body?.occasion);
  const recipient = clean(req.body?.recipient);
  const budget = clean(req.body?.budget, 30);
  const query = [
    "ý tưởng quà tặng cá nhân hóa",
    occasion && `dịp ${occasion}`,
    recipient && `tặng ${recipient}`,
    budget && `ngân sách ${budget}k VND`,
  ].filter(Boolean).join(" ");

  try {
    const response = await fetch(`https://api.search.tinyfish.ai?query=${encodeURIComponent(query)}&language=vi`, {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || data?.error || "TinyFish search failed");
    json(res, 200, { query, results: normalizeResults(data) });
  } catch (error) {
    json(res, 502, { error: error.message || "Không thể tìm xu hướng web." });
  }
}