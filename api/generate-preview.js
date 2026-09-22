import { json, recordApiUsage } from "./_supabase.js";

const clean = (value, max = 120) => String(value || "").trim().slice(0, max);

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  const body = req.body || {};
  const productName = clean(body.productName);
  const name = clean(body.name, 20);
  const color = clean(body.color, 40);
  const font = clean(body.font, 40);
  const sticker = clean(body.sticker, 60);
  const engravingType = clean(body.engravingType, 30);
  if (!productName || !name) return json(res, 400, { error: "Vui lòng nhập tên trước khi xem thử món quà." });
  if (!process.env.GEMINI_API_KEY) return json(res, 503, { error: "AI preview chưa được cấu hình trên server." });

  const prompt = [
    "Create a polished square product mockup image for a personalized gift store.",
    `Product: ${productName}.`,
    `Engraved name: "${name}".`,
    `Color: ${color}. Font style: ${font}. Engraving: ${engravingType}. Sticker: ${sticker}.`,
    "Show one cute physical product centered on a soft pastel studio background.",
    "The engraved name must be clearly visible and spelled exactly as provided.",
    "Do not add any other text, watermark, logo, people, hands, or extra products.",
  ].join(" ");

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    });
    const data = await response.json();
    await recordApiUsage("gemini-image", response.ok);
    if (!response.ok) throw new Error(data.error?.message || "Gemini image request failed");
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((part) => part.inlineData?.data);
    if (!imagePart) throw new Error("AI không trả về dữ liệu ảnh.");
    const mimeType = imagePart.inlineData.mimeType || "image/png";
    json(res, 200, { image: `data:${mimeType};base64,${imagePart.inlineData.data}` });
  } catch (error) {
    json(res, 502, { error: error.message });
  }
}
