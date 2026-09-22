import React, { useEffect, useState } from "react";
import { BKW } from "@/api/bkwClient";
import { Plus, Loader2, Package, ClipboardList, Pencil, Search, ExternalLink, Activity, CheckCircle2, CircleAlert, ChevronDown } from "lucide-react";
import { imageFor, formatVND, CATEGORIES } from "@/lib/productImages";

const STATUS = ["pending", "paid", "shipped", "delivered", "cancelled"];

export default function Admin() {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchResults, setResearchResults] = useState([]);
  const [researchQuery, setResearchQuery] = useState("");
  const [researchError, setResearchError] = useState("");
  const [apiStatus, setApiStatus] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      BKW.entities.Product.list("-created_date", 60),
      BKW.entities.Order.list("-created_date", 60),
    ]).then(([p, o]) => {
      setProducts(p);
      setOrders(o);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateOrderStatus = async (id, status) => {
    await BKW.entities.Order.update(id, { status });
    load();
  };

  const deleteProduct = async (id) => {
    if (!confirm("Xoá sản phẩm này?")) return;
    await BKW.entities.Product.delete(id);
    load();
  };

  const runCompetitorResearch = async () => {
    setResearchLoading(true);
    setResearchError("");
    try {
      const response = await BKW.functions.invoke("competitorResearch", {
        categories: ["móc khóa", "gương", "lược", "kẹp tóc"],
      });
      const data = response.data || response;
      setResearchQuery(data.query || "");
      setResearchResults(data.results || []);
    } catch (error) {
      setResearchError(error.message || "Không thể nghiên cứu giá lúc này.");
      setResearchResults([]);
    } finally {
      setResearchLoading(false);
    }
  };

  const loadApiStatus = async () => {
    setApiLoading(true);
    setApiError("");
    try {
      setApiStatus(await BKW.adminApiStatus.get());
    } catch (error) {
      setApiError(error.message || "Không thể kiểm tra API.");
    } finally {
      setApiLoading(false);
    }
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
        <button onClick={() => setTab("research")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === "research" ? "bg-primary text-primary-foreground" : "border border-border hover:border-primary/40"}`}>
          <Search className="h-4 w-4" /> Nghiên cứu
        </button>
        <button onClick={() => { setTab("api"); loadApiStatus(); }} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === "api" ? "bg-primary text-primary-foreground" : "border border-border hover:border-primary/40"}`}>
          <Activity className="h-4 w-4" /> API
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
      ) : tab === "orders" ? (
        <div className="space-y-3">
          {orders.length === 0 && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">Chưa có đơn hàng nào.</div>}
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">Mã đơn: {o.order_code || o.id}</div>
                  <div className="font-medium">{o.customer_name} · {o.customer_phone}</div>
                  <div className="text-xs text-muted-foreground">{o.address}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary">{formatVND(o.total)}</div>
                  <div className="text-xs text-muted-foreground">{o.items?.length || 0} sản phẩm</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpandedOrderId((current) => current === o.id ? null : o.id)}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary"
                aria-expanded={expandedOrderId === o.id}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${expandedOrderId === o.id ? "rotate-180" : ""}`} />
                {expandedOrderId === o.id ? "Ẩn chi tiết" : "Xem chi tiết đơn hàng"}
              </button>
              {expandedOrderId === o.id && (
                <div className="mt-4 space-y-4 border-t border-border pt-4 text-sm">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Info label="Mã đơn" value={o.order_code || o.id} mono />
                    <Info label="Ngày đặt" value={o.created_at ? new Date(o.created_at).toLocaleString("vi-VN") : "-"} />
                    <Info label="Thanh toán" value={o.payment_status || "pending"} />
                    <Info label="Đã xác nhận preview" value={o.preview_confirmed ? "Có" : "Chưa"} />
                    <Info label="Email" value={o.customer_email || "Không có"} />
                    <Info label="Phí ship" value={formatVND(o.shipping_fee || 0)} />
                    <Info label="Giảm giá" value={formatVND(o.discount || 0)} />
                    <Info label="Phí cá nhân hóa" value={formatVND(o.customization_fee || 0)} />
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/40 p-3">
                    <div className="font-semibold">Địa chỉ giao hàng</div>
                    <div className="mt-1 text-muted-foreground">{o.address || "Chưa có"}</div>
                  </div>
                  {o.order_notes && <div className="rounded-lg border border-border/70 bg-primary/5 p-3"><span className="font-semibold">Ghi chú đơn:</span> {o.order_notes}</div>}
                  <div>
                    <div className="mb-2 font-semibold">Sản phẩm và cá nhân hóa</div>
                    <div className="space-y-3">
                      {(Array.isArray(o.items) ? o.items : []).map((item, index) => {
                        const customization = item.customization || {};
                        const layers = Array.isArray(customization.designLayers) ? customization.designLayers : [];
                        const hasDesign = layers.length > 0 || customization.textSurface || customization.textScale !== undefined || customization.textRotation !== undefined;
                        return (
                          <div key={`${o.id}-detail-${index}`} className="rounded-lg border border-border/70 bg-background/40 p-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <div className="font-semibold">{item.name || "Sản phẩm"}</div>
                                <div className="text-xs text-muted-foreground">Số lượng: {item.quantity || 1} · Đơn giá: {formatVND(item.unit_price || 0)}</div>
                              </div>
                              <div className="font-semibold text-primary">{formatVND((item.unit_price || 0) * (item.quantity || 1))}</div>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <Info label="Tên khắc" value={customization.name || "Không khắc tên"} />
                              <Info label="Màu chữ" value={customization.color || "Mặc định"} />
                              <Info label="Font chữ" value={customization.font || "Mặc định"} />
                              <Info label="Kiểu khắc" value={customization.engravingType === "raised" ? "Khắc nổi" : customization.engravingType === "engraved" ? "Khắc chìm" : "Mặc định"} />
                              <Info label="Sticker" value={customization.sticker && customization.sticker !== "none" ? customization.sticker : "Không có"} />
                              <Info label="Lời chúc" value={customization.message || "Không có"} />
                            </div>
                            {hasDesign && (
                              <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3">
                                <div className="font-semibold text-primary">Thiết kế riêng</div>
                                {layers.length > 0 ? (
                                  <div className="mt-2 space-y-1 text-xs">
                                    {layers.map((layer, layerIndex) => <div key={`${o.id}-${index}-layer-${layerIndex}`}>Lớp {layerIndex + 1}: {layer.sticker?.label || layer.sticker?.id || "Sticker"} · vị trí {Math.round(layer.x || 0)}%, {Math.round(layer.y || 0)}% · tỷ lệ {layer.scale || 1} · xoay {Math.round(layer.rotation || 0)}° · opacity {layer.opacity ?? 100}%</div>)}
                                  </div>
                                ) : <div className="mt-1 text-xs text-muted-foreground">Không có sticker, chỉ có tùy chỉnh chữ.</div>}
                                <div className="mt-2 text-xs text-muted-foreground">Bề mặt chữ: {customization.textSurface ? "Đã chọn trên mẫu 3D" : "Mặc định"} · tỷ lệ {customization.textScale || 1} · xoay {customization.textRotation || 0}°</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {Array.isArray(o.status_history) && o.status_history.length > 0 && (
                    <div className="rounded-lg border border-border/70 p-3"><div className="font-semibold">Lịch sử trạng thái</div><div className="mt-2 space-y-1 text-xs text-muted-foreground">{o.status_history.map((entry, index) => <div key={`${o.id}-history-${index}`}>{entry.status || "-"} · {entry.updated_at ? new Date(entry.updated_at).toLocaleString("vi-VN") : "-"}</div>)}</div></div>
                  )}
                </div>
              )}
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
      ) : tab === "research" ? (
        <section className="space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <h2 className="font-display text-2xl font-bold">Nghiên cứu giá đối thủ</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Chạy thủ công để tham khảo thị trường. Kết quả chỉ hiển thị trong khu vực quản trị và không xuất hiện với khách hàng.
            </p>
            <button onClick={runCompetitorResearch} disabled={researchLoading} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {researchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {researchLoading ? "Đang nghiên cứu..." : "Chạy nghiên cứu giá"}
            </button>
          </div>
          {researchError && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{researchError}</div>}
          {researchQuery && <div className="text-xs text-muted-foreground">Truy vấn: {researchQuery}</div>}
          {researchResults.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {researchResults.map((result) => (
                <a key={result.url} href={result.url} target="_blank" rel="nofollow noreferrer" className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium leading-tight">{result.title}</h3>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  {result.snippet && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{result.snippet}</p>}
                </a>
              ))}
            </div>
          ) : !researchLoading && !researchError ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">Chưa có báo cáo. Chạy nghiên cứu để lấy dữ liệu tham khảo.</div>
          ) : null}
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div>
              <h2 className="font-display text-2xl font-bold">Trạng thái API</h2>
              <p className="mt-1 text-sm text-muted-foreground">Kiểm tra API nào đang được cấu hình và dùng cho chức năng nào.</p>
            </div>
            <button onClick={loadApiStatus} disabled={apiLoading} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
              <Activity className={`h-4 w-4 ${apiLoading ? "animate-pulse" : ""}`} /> Kiểm tra lại
            </button>
          </div>
          {apiError && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{apiError}</div>}
          {!apiStatus && !apiLoading && !apiError && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">Bấm kiểm tra để xem trạng thái các API.</div>}
          {apiStatus && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {apiStatus.services.map((service) => {
                  const isReady = service.status === "configured";
                  return (
                    <div key={service.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {isReady ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <CircleAlert className="h-5 w-5 text-amber-500" />}
                          <h3 className="font-semibold">{service.name}</h3>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${isReady ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                          {service.status === "configured" ? "Đã cấu hình" : service.status === "optional" ? "Tuỳ chọn" : "Thiếu"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{service.purpose}</p>
                      <p className="mt-2 text-xs text-muted-foreground">API key chỉ được đọc phía server.</p>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Usage của app</h3>
                  <span className="text-xs text-muted-foreground">30 ngày gần nhất</span>
                </div>
                {apiStatus.usage?.length ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className="text-xs text-muted-foreground">
                        <tr className="border-b border-border">
                          <th className="pb-2 font-medium">API</th>
                          <th className="pb-2 font-medium">Ngày</th>
                          <th className="pb-2 text-right font-medium">Lượt gọi</th>
                          <th className="pb-2 text-right font-medium">Lỗi</th>
                          <th className="pb-2 text-right font-medium">Dùng gần nhất</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiStatus.usage.map((entry) => (
                          <tr key={`${entry.provider}-${entry.usage_date}`} className="border-b border-border/60 last:border-0">
                            <td className="py-2 font-medium">{entry.provider}</td>
                            <td className="py-2 text-muted-foreground">{entry.usage_date}</td>
                            <td className="py-2 text-right">{entry.request_count}</td>
                            <td className={`py-2 text-right ${entry.error_count > 0 ? "text-destructive" : "text-muted-foreground"}`}>{entry.error_count}</td>
                            <td className="py-2 text-right text-xs text-muted-foreground">{entry.last_used_at ? new Date(entry.last_used_at).toLocaleString("vi-VN") : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Chưa có usage được ghi nhận. Cần chạy migration `004_api_usage.sql` để bắt đầu lưu.</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Cập nhật: {new Date(apiStatus.checked_at).toLocaleString("vi-VN")}. {apiStatus.note}</p>
            </>
          )}
        </section>
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
    BKW.entities.Product.get(editingId).then((product) => {
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
        await BKW.entities.Product.update(editingId, payload);
      } else {
        await BKW.entities.Product.create(payload);
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

function Info({ label, value, mono = false }) {
  return <div className="rounded-md border border-border/60 bg-background/30 p-2"><div className="text-[11px] text-muted-foreground">{label}</div><div className={`mt-0.5 break-words font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</div></div>;
}