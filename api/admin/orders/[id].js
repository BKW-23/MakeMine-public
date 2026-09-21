import { json, requireUser, supabase } from "../../_supabase.js";

export default async function handler(req, res) {
  try {
    await requireUser(req, true);
    const id = encodeURIComponent(req.query.id);
    if (req.method !== "PATCH") return json(res, 405, { error: "Method not allowed" });

    const body = req.body || {};
    const updates = {};

    if (body.status) {
      const status = String(body.status);
      if (!["pending", "paid", "shipped", "delivered", "cancelled"].includes(status)) {
        return json(res, 400, { error: "Invalid status" });
      }
      updates.status = status;
    }

    if (body.payment_status) {
      const paymentStatus = String(body.payment_status);
      if (!["pending", "paid", "cod", "failed"].includes(paymentStatus)) {
        return json(res, 400, { error: "Invalid payment status" });
      }
      updates.payment_status = paymentStatus;
    }

    if (typeof body.order_notes === "string") {
      updates.order_notes = body.order_notes.slice(0, 500);
    }

    if (Array.isArray(body.status_history)) {
      updates.status_history = body.status_history.slice(0, 50);
    }

    const rows = await supabase(`orders?id=eq.${id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(updates),
    });
    json(res, 200, rows[0]);
  } catch (error) {
    json(res, error.status || 500, { error: error.message });
  }
}
