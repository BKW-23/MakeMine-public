import { checkRateLimit, getClientIp, json, supabase } from "./_supabase.js";

export default async function handler(req, res) {
  if (!(req.method === "GET" || req.method === "POST")) return json(res, 405, { error: "Method not allowed" });

  const clientIp = getClientIp(req);
  if (!(await checkRateLimit(`order-lookup:${clientIp}`, 20, 60_000))) {
    return json(res, 429, { error: "Too many lookup requests. Please wait a moment." });
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const orderCode = String(body.order_code || "").trim().slice(0, 40);
      const customerPhone = String(body.customer_phone || "").trim().slice(0, 30);
      if (body.type === "received") {
        if (!orderCode || !customerPhone) {
          return json(res, 400, { error: "Vui lòng nhập mã đơn và số điện thoại." });
        }
        const order = await supabase("rpc/confirm_order_received", {
          method: "POST",
          body: JSON.stringify({ p_order_code: orderCode, p_customer_phone: customerPhone }),
        });
        return json(res, 200, { order_code: orderCode, customer_received_at: order.customer_received_at });
      }
      const type = body.type === "cancel" ? "cancel" : body.type === "edit" ? "edit" : "";
      const message = String(body.message || "").trim().slice(0, 500);
      if (!orderCode || !customerPhone || !type || (type === "edit" && !message)) {
        return json(res, 400, { error: "Vui lòng nhập mã đơn, số điện thoại và nội dung yêu cầu." });
      }
      const order = await supabase("rpc/submit_order_customer_request", {
        method: "POST",
        body: JSON.stringify({ p_order_code: orderCode, p_customer_phone: customerPhone, p_type: type, p_message: message }),
      });
      return json(res, 200, { order_code: orderCode, customer_request: order.customer_request });
    } catch (error) {
      const message = error.message || "Không thể gửi yêu cầu.";
      const status = /Order not found/i.test(message) ? 404 : /no longer editable|already pending/i.test(message) ? 409 : error.status || 500;
      const localizedMessage = /Order not found/i.test(message)
        ? "Không tìm thấy đơn phù hợp với mã đơn và số điện thoại."
        : /no longer editable/i.test(message)
          ? "Đơn đã chuyển sang giao hàng nên không thể gửi yêu cầu chỉnh sửa/hủy."
          : /already pending/i.test(message)
            ? "Đơn này đã có yêu cầu đang chờ shop xử lý."
            : error.status === 500
              ? "Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau."
              : message;
      return json(res, status, { error: localizedMessage });
    }
  }

  const query = String(req.query.q || req.query.order_code || "").trim().slice(0, 80);
  const phone = String(req.query.phone || "").trim().slice(0, 30);

  if (!query && !phone) {
    return json(res, 400, { error: "Search query required" });
  }

  try {
    const orderCode = query.replace(/[%_]/g, "");
    const customerPhone = phone.replace(/[%_]/g, "");
    const orderFilter = orderCode ? `order_code.eq.${encodeURIComponent(orderCode)}` : "";
    const idFilter = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderCode)
      ? `id.eq.${encodeURIComponent(orderCode)}`
      : "";
    const phoneFilter = customerPhone ? `customer_phone.eq.${encodeURIComponent(customerPhone)}` : "";
    const filters = [orderFilter, idFilter, phoneFilter].filter(Boolean).join(",");

    if (!filters) {
      return json(res, 400, { error: "Search query required" });
    }

    const rows = await supabase(`orders?or=(${filters})&select=id,order_code,customer_name,customer_phone,address,items,total,status,payment_status,customer_request,customer_received_at,status_history,created_at&limit=5`);
    json(res, 200, rows);
  } catch (error) {
    json(res, error.status || 500, { error: error.message });
  }
}
