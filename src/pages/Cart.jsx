import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, Loader2, Check } from "lucide-react";
import { BKW } from "@/api/bkwClient";
import { useCart } from "@/lib/cart";
import { formatVND } from "@/lib/productImages";
import { stickerLabel } from "@/lib/stickers";

export default function Cart() {
  const { items, removeItem, updateQty, total, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [confirmed, setConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      setError("Vui lòng nhập tên và số điện thoại.");
      return;
    }
    if (!confirmed) {
      setError("Vui lòng xác nhận đã xem trước mẫu khắc.");
      return;
    }
    if (!termsAccepted) {
      setError("Vui lòng đọc và đồng ý với điều khoản sử dụng.");
      return;
    }
    setPlacing(true);
    setError("");
    try {
      const orderItems = items.map((i) => ({
        product_id: i.product_id,
        name: i.name,
        quantity: i.qty,
        unit_price: i.unit_price,
        customization: i.customization,
      }));
      const res = await BKW.entities.Order.create({
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email,
        address: form.address,
        items: orderItems,
        total,
        status: "pending",
        preview_confirmed: confirmed,
      });
      setOrderId(res.id);
      clear();
    } catch (err) {
      setError("Không tạo được đơn hàng, vui lòng thử lại.");
    } finally {
      setPlacing(false);
    }
  };

  if (orderId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold">Đặt hàng thành công!</h1>
        <p className="mt-2 text-muted-foreground">Mã đơn hàng của bạn:</p>
        <div className="mt-3 inline-block rounded-lg border border-border bg-card px-5 py-2 font-mono text-primary">{orderId}</div>
        <p className="mt-4 text-sm text-muted-foreground">Chúng tôi sẽ liên hệ xác nhận & thu tiền khi giao (COD).</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={`/don-hang?id=${orderId}`} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_-10px_rgba(255,122,162,0.6)] hover:brightness-105">Theo dõi đơn</Link>
          <Link to="/san-pham" className="rounded-full border border-border px-5 py-3 text-sm hover:border-primary/40">Tiếp tục mua</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary text-muted-foreground">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold">Giỏ hàng trống</h1>
        <p className="mt-2 text-muted-foreground">Thêm vài món quà cá nhân hoá vào giỏ nhé.</p>
        <Link to="/san-pham" className="mt-6 inline-block rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_-10px_rgba(255,122,162,0.6)] hover:brightness-105">Khám phá sản phẩm</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-bold mb-8">Giỏ hàng & thanh toán</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((i) => (
            <div key={i.key} className="flex gap-4 rounded-3xl border border-border bg-card p-4 shadow-[0_18px_50px_-24px_rgba(255,122,162,0.25)]">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1">
                <div className="font-medium">{i.name}</div>
                {i.customization?.name && (
                  <div className="mt-1 text-xs text-muted-foreground font-mono">
                    Khắc: "{i.customization.name}" · {i.customization.color} · {i.customization.font}
                  </div>
                )}
                {(i.customization?.sticker !== "none" || i.customization?.engravingType) && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {i.customization?.sticker && i.customization.sticker !== "none" && `Sticker: ${stickerLabel(i.customization.sticker)}`}
                    {i.customization?.sticker !== "none" && i.customization?.engravingType && " · "}
                    {i.customization?.engravingType && `Kiểu khắc: ${i.customization.engravingType === "raised" ? "khắc nổi" : "khắc chìm"}`}
                  </div>
                )}
                {i.customization?.message && (
                  <div className="mt-1 text-xs italic text-foreground/80">Lời chúc: "{i.customization.message}"</div>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-border">
                    <button onClick={() => updateQty(i.key, i.qty - 1)} className="grid h-9 w-9 place-items-center hover:bg-secondary"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-9 text-center text-sm">{i.qty}</span>
                    <button onClick={() => updateQty(i.key, i.qty + 1)} className="grid h-9 w-9 place-items-center hover:bg-secondary"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary">{formatVND(i.unit_price * i.qty)}</span>
                    <button onClick={() => removeItem(i.key)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout */}
        <div className="lg:col-span-1">
          <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-5 space-y-4 sticky top-20 shadow-[0_18px_50px_-24px_rgba(255,122,162,0.25)]">
            <h2 className="font-semibold">Thông tin nhận hàng</h2>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Họ tên *" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary min-h-12" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Số điện thoại *" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary min-h-12" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email (tuỳ chọn)" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary min-h-12" />
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Địa chỉ giao hàng" rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />

            <div className="border-t border-border pt-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tạm tính</span><span>{formatVND(total)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Phí ship</span><span className="text-primary">Tính khi giao</span></div>
              <div className="mt-2 flex justify-between font-semibold text-lg"><span>Tổng</span><span className="text-primary">{formatVND(total)}</span></div>
            </div>

            <label className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${confirmed ? "border-primary bg-primary/5" : "border-dashed border-border pulse-ring"}`}>
              <input type="checkbox" checked={confirmed} onChange={(e) => { setConfirmed(e.target.checked); setError(""); }} className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" />
              <span className="text-xs text-muted-foreground">Tôi đã xem trước mẫu khắc tên và xác nhận thông tin cá nhân hoá chính xác.</span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => { setTermsAccepted(e.target.checked); setError(""); }} className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" />
              <span className="text-xs text-muted-foreground">Tôi đồng ý với <Link to="/dieu-khoan" className="font-medium text-primary hover:underline">Điều khoản sử dụng</Link> và hướng dẫn mua hàng.</span>
            </label>

            {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>}

            <button type="submit" disabled={placing}               className="w-full flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_-10px_rgba(255,122,162,0.6)] hover:brightness-105 disabled:opacity-60 min-h-12">
              {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {placing ? "Đang đặt..." : "Đặt hàng (COD)"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}