import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Package } from "lucide-react";
import { formatVND } from "@/lib/productImages";
import { useAuth } from "@/lib/AuthContext";
import { BKW } from "@/api/bkwClient";
import { stickerLabel } from "@/lib/stickers";

const STATUS = {
  pending: { label: "Chờ xác nhận", color: "text-amber-600 bg-amber-100/70" },
  paid: { label: "Đã thanh toán", color: "text-primary bg-primary/10" },
  shipped: { label: "Đang giao", color: "text-sky-600 bg-sky-100/70" },
  delivered: { label: "Đã giao", color: "text-emerald-600 bg-emerald-100/70" },
  cancelled: { label: "Đã huỷ", color: "text-destructive bg-destructive/10" },
};
const FLOW = ["pending", "paid", "shipped", "delivered"];

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
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.get("id")) search();
    // eslint-disable-next-line
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
            const stepIdx = FLOW.indexOf(o.status);
            return (
              <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">{o.id}</div>
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
                <div className="mt-3 flex gap-3 text-[10px] text-muted-foreground">
                  {FLOW.map((s) => <div key={s} className="flex-1 first:text-left text-center">{STATUS[s].label}</div>)}
                </div>

                <div className="mt-5 border-t border-border pt-4 space-y-2">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>
                        {it.name} ×{it.quantity}
                        {it.customization?.name && <span className="text-muted-foreground font-mono"> · "{it.customization.name}"</span>}
                        {it.customization?.sticker && it.customization.sticker !== "none" && <span className="text-muted-foreground"> · sticker {stickerLabel(it.customization.sticker)}</span>}
                        {it.customization?.engravingType && <span className="text-muted-foreground"> · {it.customization.engravingType === "raised" ? "khắc nổi" : "khắc chìm"}</span>}
                      </span>
                      <span className="text-muted-foreground">{formatVND(it.unit_price * it.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-2 border-t border-border">
                    <span>Tổng</span><span className="text-primary">{formatVND(o.total)}</span>
                  </div>
                </div>
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