import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Loader2, Package, ClipboardList, Pencil } from "lucide-react";
import { imageFor, formatVND, CATEGORIES } from "@/lib/productImages";

const STATUS = ["pending", "paid", "shipped", "delivered", "cancelled"];

export default function Admin() {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Product.list("-created_date", 60),
      base44.entities.Order.list("-created_date", 60),
    ]).then(([p, o]) => {
      setProducts(p);
      setOrders(o);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateOrderStatus = async (id, status) => {
    await base44.entities.Order.update(id, { status });
    load();
  };

  const deleteProduct = async (id) => {
    if (!confirm("Xoá sản phẩm này?")) return;
    await base44.entities.Product.delete(id);
    load();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-bold mb-6">Quản trị</h1>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("products")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === "products" ? "bg-primary text-primary-foreground" : "border border-border hover:border-primary/40"}`}>
          <Package className="h-4 w-4" /> Sản phẩm ({products.length})
        </button>
        <button onClick={() => setTab("orders")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === "orders" ? "bg-primary text-primary-foreground" : "border border-border hover:border-primary/40"}`}>
          <ClipboardList className="h-4 w-4" /> Đơn hàng ({orders.length})
        </button>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl shimmer border border-border" />
      ) : tab === "products" ? (
        <div>
          <div className="mb-4">
            <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_-10px_rgba(255,122,162,0.6)] hover:brightness-105 min-h-12">
              <Plus className="h-4 w-4" /> {showForm ? "Đóng" : "Thêm sản phẩm"}
            </button>
          </div>
          {showForm && <ProductForm onSaved={() => { setShowForm(false); setEditingId(null); load(); }} editingId={editingId} onCancel={() => { setShowForm(false); setEditingId(null); }} />}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {imageFor(p) && <img src={imageFor(p)} alt={p.name} className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{p.category}</div>
                  <div className="text-sm font-semibold text-primary">{formatVND(p.base_price)}</div>
                </div>
                <div className="flex flex-col gap-2 self-start">
                  <button onClick={() => { setEditingId(p.id); setShowForm(true); }} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"><Pencil className="h-3 w-3" /> Sửa</button>
                  <button onClick={() => deleteProduct(p.id)} className="text-xs text-muted-foreground hover:text-destructive">Xoá</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.length === 0 && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">Chưa có đơn hàng nào.</div>}
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">{o.id}</div>
                  <div className="font-medium">{o.customer_name} · {o.customer_phone}</div>
                  <div className="text-xs text-muted-foreground">{o.address}</div>
                  {o.items && Array.isArray(o.items) && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {o.items.map((item, index) => (
                        <div key={`${o.id}-${index}`}>
                          {item.name || "Sản phẩm"} · qty {item.quantity || 1}
                          {item.customization?.name && ` · khắc: ${item.customization.name}`}
                          {item.customization?.message && ` · lời chúc: ${item.customization.message}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary">{formatVND(o.total)}</div>
                  <div className="text-xs text-muted-foreground">{o.items?.length || 0} sản phẩm</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {STATUS.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateOrderStatus(o.id, s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${o.status === s ? "bg-primary text-primary-foreground" : "border border-border hover:border-primary/40"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductForm({ onSaved, editingId, onCancel }) {
  const [form, setForm] = useState({
    name: "", slug: "", category: "móc khoá", base_price: "", short_description: "",
    customizable: true, colors: "Mint, Lilac, Trắng", fonts: "Sans, Script, Mono", featured: false,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!editingId) return;
    base44.entities.Product.get(editingId).then((product) => {
      if (!product) return;
      setForm({
        name: product.name || "",
        slug: product.slug || "",
        category: product.category || "móc khoá",
        base_price: String(product.base_price || ""),
        short_description: product.short_description || "",
        customizable: Boolean(product.customizable),
        colors: Array.isArray(product.colors) ? product.colors.join(", ") : "",
        fonts: Array.isArray(product.fonts) ? product.fonts.join(", ") : "",
        featured: Boolean(product.featured),
      });
    }).catch(() => {});
  }, [editingId]);

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || !form.base_price) { setErr("Nhập tên và giá."); return; }
    setSaving(true);
    setErr("");
    try {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/\s+/g, "-"),
        category: form.category,
        base_price: Number(form.base_price),
        short_description: form.short_description,
        customizable: form.customizable,
        colors: form.colors.split(",").map((s) => s.trim()).filter(Boolean),
        fonts: form.fonts.split(",").map((s) => s.trim()).filter(Boolean),
        featured: form.featured,
      };

      if (editingId) {
        await base44.entities.Product.update(editingId, payload);
      } else {
        await base44.entities.Product.create(payload);
      }

      onSaved();
    } catch (e) {
      setErr("Không lưu được sản phẩm.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="mb-6 rounded-3xl border border-border bg-card p-5 grid gap-3 sm:grid-cols-2 shadow-[0_18px_50px_-24px_rgba(255,122,162,0.25)]">
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tên sản phẩm *" className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary min-h-12" />
      <input value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} type="number" placeholder="Giá (VND) *" className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary min-h-12" />
      <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary min-h-12">
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} placeholder="Mô tả ngắn" className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary min-h-12" />
      <input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="Màu (cách nhau dấu phẩy)" className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary min-h-12" />
      <input value={form.fonts} onChange={(e) => setForm({ ...form, fonts: e.target.value })} placeholder="Font (cách nhau dấu phẩy)" className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary min-h-12" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.customizable} onChange={(e) => setForm({ ...form, customizable: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" /> Có khắc tên</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" /> Nổi bật</label>
      {err && <div className="text-sm text-destructive sm:col-span-2">{err}</div>}
      <div className="sm:col-span-2 flex items-center gap-3">
        <button disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_-10px_rgba(255,122,162,0.6)] hover:brightness-105 disabled:opacity-60 min-h-12">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {editingId ? "Cập nhật sản phẩm" : "Lưu sản phẩm"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-full border border-border px-4 py-3 text-sm font-medium text-muted-foreground">Huỷ</button>
        )}
      </div>
    </form>
  );
}