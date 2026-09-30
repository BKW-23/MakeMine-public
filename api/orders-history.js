import { json, requireUser, supabase } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
  try {
    const user = await requireUser(req);
    const orders = await supabase(
      `orders?user_id=eq.${encodeURIComponent(user.id)}&select=id,order_code,customer_name,customer_phone,address,items,total,status,payment_status,customer_request,customer_received_at,status_history,created_at&order=created_at.desc`,
    );
    json(res, 200, orders);
  } catch (error) {
    json(res, error.status || 500, { error: error.message });
  }
}
