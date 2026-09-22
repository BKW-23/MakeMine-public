import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, X, Send, Loader2, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { imageFor, formatVND } from "@/lib/productImages";

const QUICK = [
  { occasion: "Sinh nhật", recipient: "Bạn gái", budget: "" },
  { occasion: "20/10", recipient: "Mẹ", budget: "100" },
  { occasion: "Ra trường", recipient: "Bạn thân", budget: "80" },
  { occasion: "Kỷ niệm", recipient: "Người yêu", budget: "150" },
];

export default function GiftAssistant() {
  const [open, setOpen] = useState(false);
  const [occasion, setOccasion] = useState("");
  const [recipient, setRecipient] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [products, setProducts] = useState({});
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("makemine:open-assistant", handler);
    return () => window.removeEventListener("makemine:open-assistant", handler);
  }, []);

  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!expandedSuggestion) return undefined;
    const handleOutsideClick = (event) => {
      if (!event.target.closest?.("[data-gift-suggestion]")) setExpandedSuggestion(null);
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [expandedSuggestion]);

  const submit = async (e, preset) => {
    if (e) e.preventDefault();
    const o = preset?.occasion ?? occasion;
    const r = preset?.recipient ?? recipient;
    const b = preset?.budget ?? budget;
    if (!o && !r) {
      setError("Hãy nhập dịp tặng hoặc người nhận để AI gợi ý.");
      return;
    }
    setLoading(true);
    setError("");
    setResults([]);
    setExpandedSuggestion(null);
    try {
      const res = await base44.functions.invoke("giftSuggestion", {
        occasion: o,
        recipient: r,
        budget: b ? Number(b) : null,
      });
      const data = res.data || res;
      const sugg = data.suggestions || [];
      setResults(sugg);
      if (sugg.length) {
        const ids = sugg.map((s) => s.product_id);
        const all = await base44.entities.Product.list("-created_date", 60);
        const map = {};
        all.forEach((p) => {
          if (ids.includes(p.id)) map[p.id] = p;
        });
        setProducts(map);
      }
    } catch (err) {
      setError("Không lấy được gợi ý lúc này, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 pulse-ring hover:scale-105 transition-transform min-h-12"
        aria-label="Trợ lý gợi ý quà tặng"
      >
        <Wand2 className="h-5 w-5" />
        <span className="hidden sm:inline">Gợi ý quà tặng</span>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            className={`relative h-full w-full glass border-l border-border shadow-2xl flex flex-col transition-[max-width] duration-300 ${expandedSuggestion ? "lg:max-w-2xl" : "max-w-md"}`}
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-semibold leading-tight">Trợ lý quà tặng</div>
                  <div className="text-xs text-muted-foreground">AI gợi ý theo dịp & người nhận</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-secondary" aria-label="Đóng">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Dịp tặng</label>
                  <input
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="Sinh nhật, 20/10, ra trường..."
                    className="mt-1 w-full rounded-lg border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 min-h-12"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Người nhận</label>
                  <input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Bạn gái, mẹ, thầy cô..."
                    className="mt-1 w-full rounded-lg border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 min-h-12"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Ngân sách (k VND, tuỳ chọn)</label>
                  <input
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    inputMode="numeric"
                    placeholder="vd: 100"
                    className="mt-1 w-full rounded-lg border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 min-h-12"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 min-h-12"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {loading ? "Đang gợi ý..." : "Gợi ý quà tặng"}
                </button>
              </form>

              <div className="flex flex-wrap gap-2">
                {QUICK.map((q, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      setOccasion(q.occasion);
                      setRecipient(q.recipient);
                      setBudget(q.budget);
                      submit(e, q);
                    }}
                    className="rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {q.occasion} · {q.recipient}
                  </button>
                ))}
              </div>

              {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>}
              {loading && (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-28 rounded-xl shimmer border border-border" />
                  ))}
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {results.length} gợi ý phù hợp
                  </div>
                  {results.map((s, i) => {
                    const p = products[s.product_id];
                    if (!p) return null;
                    const isExpanded = expandedSuggestion === s.product_id;
                    return (
                      <div
                        key={s.product_id}
                        data-gift-suggestion
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (isExpanded) {
                            setOpen(false);
                            navigate(`/san-pham/${p.slug || p.id}`);
                          } else {
                            setExpandedSuggestion(s.product_id);
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.currentTarget.click();
                          }
                        }}
                        className={`flex cursor-pointer gap-3 rounded-xl border bg-card p-3 transition-all hover:border-primary/40 ${isExpanded ? "border-primary shadow-[0_12px_32px_-16px_hsl(var(--primary)/0.7)] ring-2 ring-primary/20" : "border-border"}`}
                      >
                        <div className={`${isExpanded ? "h-24 w-24" : "h-20 w-20"} shrink-0 overflow-hidden rounded-lg bg-secondary transition-all`}>
                          {imageFor(p) && <img src={imageFor(p)} alt={p.name} className="h-full w-full object-cover" />}
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="text-sm font-medium leading-tight">{p.name}</div>
                          <div className="text-xs text-primary font-semibold mt-0.5">{formatVND(p.base_price)}</div>
                          <div className={`text-xs text-muted-foreground mt-1 ${isExpanded ? "leading-5" : "line-clamp-2"}`}>{s.ly_do}</div>
                          <span className="mt-1 text-xs text-primary">{isExpanded ? "Mở sản phẩm →" : "Chạm để xem rõ hơn"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && !error && results.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Mô tả dịp tặng & người nhận — AI sẽ chọn 3–5 quà phù hợp nhất kèm lý do.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}