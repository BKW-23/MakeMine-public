import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Package, Loader2, Send } from "lucide-react";
import { formatVND } from "@/lib/productImages";
import { useAuth } from "@/lib/AuthContext";
import { BKW } from "@/api/bkwClient";
import { stickerLabel } from "@/lib/stickers";

const STATUS = {
  pending: { label: "Chờ shop xác nhận", color: "text-amber-600 bg-amber-100/70" },
  processing: { label: "Đang chuẩn bị", color: "text-primary bg-primary/10" },
  paid: { label: "Đã thanh toán", color: "text-primary bg-primary/10" },
  shipped: { label: "Đang giao", color: "text-sky-600 bg-sky-100/70" },
  delivered: { label: "Đã giao", color: "text-emerald-600 bg-emerald-100/70" },
  cancelled: { label: "Đã huỷ", color: "text-destructive bg-destructive/10" },
};
const FLOW = ["pending", "processing", "shipped", "delivered"];

function OrderChangeRequest({ order, onChanged }) {
  const [type, setType] = useState("edit");
  const [message, setMessage] = useState("");
  const [customerRequest, setCustomerRequest] = useState(order.customer_request || {});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const canRequest = ["pending", "processing"].includes(order.status);

  useEffect(() => setCustomerRequest(order.customer_request || {}), [order.customer_request]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await BKW.entities.Order.requestChange({
        order_code: order.order_code,
        customer_phone: order.customer_phone,
        type,
        message,
      });
      setCustomerRequest(result.customer_request);
      setMessage("");
      onChanged(result.customer_request);
    } catch (requestError) {
      setError(requestError.message || "Không gửi được yêu cầu. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canRequest) return null;

  return (
    <div className="mt-4 rounded-xl border border-border bg-background/50 p-4">
      <h3 className="text-sm font-semibold">Cần thay đổi đơn?</h3>
      {customerRequest.status === "pending" ? (
        <p className="mt-1 text-sm text-muted-foreground">Shop đang xử lý yêu cầu {customerRequest.type === "cancel" ? "hủy đơn" : "chỉnh sửa đơn"} của bạn.</p>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <div className="inline-flex rounded-lg border border-border p-1" role="group" aria-label="Loại yêu cầu đơn hàng">
            <button type="button" onClick={() => setType("edit")} aria-pressed={type === "edit"} className={`rounded-md px-3 py-2 text-xs ${type === "edit" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Chỉnh sửa</button>
            <button type="button" onClick={() => setType("cancel")} aria-pressed={type === "cancel"} className={`rounded-md px-3 py-2 text-xs ${type === "cancel" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Hủy đơn</button>
          </div>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={500}
            required={type === "edit"}
            rows={2}
            placeholder={type === "edit" ? "Mô tả nội dung bạn muốn chỉnh sửa..." : "Lý do hủy đơn (không bắt buộc)"}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <p className="text-xs text-muted-foreground">Yêu cầu chưa tự thay đổi đơn; shop sẽ xác nhận với bạn. Chỉ gửi được trước khi đơn chuyển sang giao hàng.</p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={submitting} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </form>
      )}
    </div>
  );
}

function ReceiptConfirmation({ order, onConfirmed }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  if (order.status !== "delivered") return null;

  const confirmReceived = async () => {
    if (!window.confirm("Xác nhận bạn đã nhận được đơn hàng này?")) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await BKW.entities.Order.requestChange({
        type: "received",
        order_code: order.order_code,
        customer_phone: order.customer_phone,
      });
      onConfirmed(result.customer_received_at);
    } catch (requestError) {
      setError(requestError.message || "Không xác nhận được. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-emerald-600/25 bg-emerald-600/5 p-4">
      {order.customer_received_at ? (
        <p className="text-sm font-medium text-emerald-700">Bạn đã xác nhận nhận hàng · {new Date(order.customer_received_at).toLocaleString("vi-VN")}</p>
      ) : (
        <>
          <p className="text-sm font-medium">Bạn đã nhận được đơn hàng?</p>
          <p className="mt-1 text-xs text-muted-foreground">Xác nhận để shop biết đơn đã giao thành công.</p>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <button type="button" onClick={confirmReceived} disabled={submitting} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Đang xác nhận..." : "Xác nhận đã nhận hàng"}
          </button>
        </>
      )}
    </div>
  );
}

export default function OrderTracking() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("id") || "");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { isAuthenticated } = useAuth();
  const [historyLoading, setHistoryLoading] = useState(false);

  const search = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const q = query.trim();
      const response = await fetch(`/api/orders-lookup?q=${encodeURIComponent(q)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Lookup failed");
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.get("id")) search();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setHistoryLoading(true);
    BKW.entities.Order.history()
      .then((data) => {
        setOrders(data);
      })
      .catch(() => setOrders([]))
      .finally(() => setHistoryLoading(false));
  }, [isAuthenticated]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-bold mb-2">Theo dõi đơn hàng</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {isAuthenticated ? "Lịch sử đơn hàng của tài khoản và tra cứu đơn bằng mã hoặc số điện thoại." : "Nhập mã đơn hàng hoặc số điện thoại đã đặt."}
      </p>

      <form onSubmit={search} className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mã đơn hoặc SĐT..."
            className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-3 text-sm outline-none focus:border-primary min-h-12"
          />
        </div>
        <button type="submit" className="rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 min-h-12">Tra cứu</button>
      </form>

      {isAuthenticated && historyLoading && <div className="mb-6 h-24 rounded-2xl shimmer border border-border" />}

      {isAuthenticated && !historyLoading && !searched && orders.length === 0 && (
        <div className="mb-6 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
          Bạn chưa có đơn hàng nào trong tài khoản.
        </div>
      )}

      {loading && <div className="h-40 rounded-2xl shimmer border border-border" />}

      {!loading && searched && orders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Không tìm thấy đơn hàng nào khớp.
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((o) => {
            const st = STATUS[o.status] || STATUS.pending;
            const progressStatus = o.status === "paid" ? "processing" : o.status;
            const stepIdx = FLOW.indexOf(progressStatus);
            return (
              <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">{o.order_code || o.id}</div>
                    <div className="font-semibold mt-0.5">{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{o.customer_phone}</div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${st.color}`}>{st.label}</span>
                </div>

                {o.status !== "cancelled" && stepIdx >= 0 && (
                  <div className="mt-5 flex items-center">
                    {FLOW.map((s, i) => (
                      <div key={s} className="flex flex-1 items-center last:flex-none">
                        <div className={`grid h-7 w-7 place-items-center rounded-full text-xs ${i <= stepIdx ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                          {i < stepIdx ? "✓" : i + 1}
                        </div>
                        {i < FLOW.length - 1 && <div className={`h-0.5 flex-1 ${i < stepIdx ? "bg-primary" : "bg-border"}`} />}
                      </div>
                    ))}
                  </div>
                )}
                {o.status !== "cancelled" && (
                  <div className="mt-3 flex gap-3 text-[10px] text-muted-foreground">
                    {FLOW.map((s) => <div key={s} className="flex-1 first:text-left text-center">{STATUS[s].label}</div>)}
                  </div>
                )}

                <div className="mt-3 text-xs text-muted-foreground">
                  Thanh toán: {o.payment_status === "cod" ? "COD · thanh toán khi nhận hàng" : o.payment_status === "paid" ? "Đã thanh toán" : o.payment_status === "failed" ? "Thanh toán thất bại" : "Chưa thanh toán"}
                </div>
                {o.customer_received_at && <div className="mt-2 text-xs font-medium text-emerald-700">Khách đã xác nhận nhận hàng · {new Date(o.customer_received_at).toLocaleString("vi-VN")}</div>}

                <div className="mt-5 border-t border-border pt-4 space-y-2">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>
                        {it.name} ×{it.quantity}
                        {it.customization?.name && <span className="text-muted-foreground font-mono"> · "{it.customization.name}"</span>}
                        {it.customization?.sticker && it.customization.sticker !== "none" && <span className="text-muted-foreground"> · sticker {stickerLabel(it.customization.sticker)}</span>}
                        {it.customization?.shopSelectedGreeting ? <span className="text-muted-foreground"> · thiệp: shop chọn lời chúc</span> : it.customization?.message ? <span className="text-muted-foreground"> · thiệp: {it.customization.message}</span> : null}
                      </span>
                      <span className="text-muted-foreground">{formatVND(it.unit_price * it.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-2 border-t border-border">
                    <span>Tổng</span><span className="text-primary">{formatVND(o.total)}</span>
                  </div>
                </div>
                <OrderChangeRequest
                  order={o}
                  onChanged={(customerRequest) => setOrders((current) => current.map((item) => item.id === o.id ? { ...item, customer_request: customerRequest } : item))}
                />
                <ReceiptConfirmation
                  order={o}
                  onConfirmed={(customerReceivedAt) => setOrders((current) => current.map((item) => item.id === o.id ? { ...item, customer_received_at: customerReceivedAt } : item))}
                />
              </div>
            );
          })}
        </div>
      )}

      {!searched && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground flex flex-col items-center gap-3">
          <Package className="h-10 w-10" />
          Nhập mã đơn hoặc SĐT để xem trạng thái đơn hàng.
        </div>
      )}
    </div>
  );
}