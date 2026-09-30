import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Package, Search, Send } from "lucide-react";
import { BKW } from "@/api/bkwClient";
import { useAuth } from "@/lib/AuthContext";
import { formatVND } from "@/lib/productImages";
import { stickerLabel } from "@/lib/stickers";

const STATUS = {
  pending: { label: "Chờ shop xác nhận", color: "text-amber-600 bg-amber-100/70" },
  processing: { label: "Đang chuẩn bị", color: "text-primary bg-primary/10" },
  paid: { label: "Đã thanh toán", color: "text-primary bg-primary/10" },
  shipped: { label: "Đang giao", color: "text-sky-600 bg-sky-100/70" },
  delivered: { label: "Đã giao", color: "text-emerald-600 bg-emerald-100/70" },
  cancelled: { label: "Đã hủy", color: "text-destructive bg-destructive/10" },
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

export default function OrderTracking() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("id") || "");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { isAuthenticated } = useAuth();
  const [historyLoading, setHistoryLoading] = useState(false);

  const search = async (event) => {
    event?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const response = await fetch(`/api/orders-lookup?q=${encodeURIComponent(query.trim())}`);
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
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setHistoryLoading(false));
  }, [isAuthenticated]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-display text-3xl font-bold">Theo dõi đơn hàng</h1>
      <p className="mb-6 text-sm text-muted-foreground">{isAuthenticated ? "Lịch sử đơn hàng của tài khoản và tra cứu đơn bằng mã hoặc số điện thoại." : "Nhập mã đơn hoặc số điện thoại đã đặt."}</p>
      <form onSubmit={search} className="mb-8 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mã đơn hoặc SĐT..." className="min-h-12 w-full rounded-lg border border-input bg-background py-3 pl-10 pr-3 text-sm outline-none focus:border-primary" />
        </div>
        <button type="submit" className="min-h-12 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">Tra cứu</button>
      </form>

      {isAuthenticated && historyLoading && <div className="mb-6 h-24 rounded-2xl border border-border shimmer" />}
      {isAuthenticated && !historyLoading && !searched && orders.length === 0 && <div className="mb-6 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Bạn chưa có đơn hàng nào trong tài khoản.</div>}
      {loading && <div className="h-40 rounded-2xl border border-border shimmer" />}
      {!loading && searched && orders.length === 0 && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">Không tìm thấy đơn hàng nào khớp.</div>}

      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = STATUS[order.status] || STATUS.pending;
            const progressStatus = order.status === "paid" ? "processing" : order.status;
            const step = FLOW.indexOf(progressStatus);
            return (
              <article key={order.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">{order.order_code || order.id}</div>
                    <div className="mt-0.5 font-semibold">{order.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>{status.label}</span>
                </div>
                {order.status !== "cancelled" && step >= 0 && (
                  <div className="mt-5 flex items-center">
                    {FLOW.map((item, index) => <div key={item} className="flex flex-1 items-center last:flex-none"><div className={`grid h-7 w-7 place-items-center rounded-full text-xs ${index <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{index < step ? "✓" : index + 1}</div>{index < FLOW.length - 1 && <div className={`h-0.5 flex-1 ${index < step ? "bg-primary" : "bg-border"}`} />}</div>)}
                  </div>
                )}
                {order.status !== "cancelled" && <div className="mt-3 flex gap-3 text-[10px] text-muted-foreground">{FLOW.map((item) => <div key={item} className="flex-1 text-center first:text-left">{STATUS[item].label}</div>)}</div>}
                <div className="mt-3 text-xs text-muted-foreground">Thanh toán: {order.payment_status === "cod" ? "COD · thanh toán khi nhận hàng" : order.payment_status === "paid" ? "Đã thanh toán" : order.payment_status === "failed" ? "Thanh toán thất bại" : "Chưa thanh toán"}</div>
                <div className="mt-5 space-y-2 border-t border-border pt-4">
                  {order.items.map((item, index) => <div key={`${order.id}-${index}`} className="flex justify-between gap-3 text-sm"><span>{item.name} ×{item.quantity}{item.customization?.name && <span className="font-mono text-muted-foreground"> · “{item.customization.name}”</span>}{item.customization?.sticker && item.customization.sticker !== "none" && <span className="text-muted-foreground"> · sticker {stickerLabel(item.customization.sticker)}</span>}</span><span className="shrink-0 text-muted-foreground">{formatVND(item.unit_price * item.quantity)}</span></div>)}
                  <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Tổng</span><span className="text-primary">{formatVND(order.total)}</span></div>
                </div>
                <OrderChangeRequest order={order} onChanged={(customerRequest) => setOrders((current) => current.map((item) => item.id === order.id ? { ...item, customer_request: customerRequest } : item))} />
              </article>
            );
          })}
        </div>
      )}
      {!searched && <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground"><Package className="h-10 w-10" />Nhập mã đơn hoặc SĐT để xem trạng thái đơn hàng.</div>}
    </div>
  );
}