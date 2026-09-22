import { json, requireUser } from "../_supabase.js";

const configured = (name) => String(process.env[name] || "").trim() ? "configured" : "missing";

export default async function handler(req, res) {
  try {
    await requireUser(req, true);
    if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

    const services = [
      { id: "supabase", name: "Supabase", status: configured("SUPABASE_URL") === "configured" && configured("SUPABASE_SERVICE_ROLE_KEY") === "configured" ? "configured" : "missing", purpose: "Database, Auth, sản phẩm và đơn hàng" },
      { id: "gemini", name: "Google Gemini", status: configured("GEMINI_API_KEY"), purpose: "Gợi ý quà, lời chúc và preview hình ảnh" },
      { id: "tinyfish", name: "TinyFish Search", status: configured("TINYFISH_API_KEY"), purpose: "Nghiên cứu giá đối thủ trong Admin" },
      { id: "resend", name: "Resend", status: configured("RESEND_API_KEY"), purpose: "Email xác nhận đơn hàng, nếu được bật" },
      { id: "upstash", name: "Upstash Redis", status: configured("UPSTASH_REDIS_REST_URL") === "configured" && configured("UPSTASH_REDIS_REST_TOKEN") === "configured" ? "configured" : "optional", purpose: "Rate limit dùng chung giữa serverless instance" },
    ];
    json(res, 200, { checked_at: new Date().toISOString(), services, note: "Chỉ hiển thị trạng thái cấu hình, không trả về API key hoặc usage history." });
  } catch (error) {
    json(res, error.status || 500, { error: error.message });
  }
}