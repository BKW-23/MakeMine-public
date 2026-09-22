import React, { useState } from "react";
import { Wand2, Loader2, Check, Pencil, RefreshCw } from "lucide-react";
import { BKW } from "@/api/bkwClient";

export default function GreetingGenerator({ productName, onConfirm }) {
  const [form, setForm] = useState({ recipient: "", relationship: "", occasion: "", hobbies: "", keywords: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [greetings, setGreetings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const generate = async (e) => {
    e.preventDefault();
    if (!form.recipient && !form.relationship && !form.occasion) {
      setError("Nhập ít nhất người nhận, mối quan hệ hoặc dịp tặng.");
      return;
    }
    setLoading(true);
    setError("");
    setGreetings([]);
    setSelected(null);
    setConfirmed(false);
    try {
      const res = await BKW.functions.invoke("generateGreeting", { ...form, productName });
      setGreetings(res.data.greetings || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Không tạo được lời chúc, thử lại nhé.");
    } finally {
      setLoading(false);
    }
  };

  const pick = (g) => {
    setSelected(g);
    setEditing(g);
    setConfirmed(false);
  };

  const confirm = () => {
    const text = editing.trim();
    if (!text) return;
    setConfirmed(true);
    onConfirm?.(text);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="grid h-6 w-6 place-items-center rounded bg-primary/15 text-primary text-xs font-mono">02</span>
        AI tạo lời chúc
      </div>

      {!confirmed && (
        <form onSubmit={generate} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder="Người nhận" className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-primary min-h-11" />
            <input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="Mối quan hệ (bạn thân, người yêu...)" className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-primary min-h-11" />
          </div>
          <input value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} placeholder="Dịp tặng (sinh nhật, kỷ niệm...)" className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-primary min-h-11" />
          <input value={form.hobbies} onChange={(e) => setForm({ ...form, hobbies: e.target.value })} placeholder="Sở thích người nhận" className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-primary min-h-11" />
          <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="Từ khoá tuỳ chọn (ngọt ngào, hài hước...)" className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-primary min-h-11" />

          {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>}

          <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_-10px_rgba(255,122,162,0.6)] hover:brightness-105 disabled:opacity-60 min-h-12">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {loading ? "Đang tạo..." : "Tạo lời chúc"}
          </button>
        </form>
      )}

      {loading && greetings.length === 0 && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl shimmer border border-border" />
          ))}
        </div>
      )}

      {!loading && greetings.length > 0 && !confirmed && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground font-mono">CHỌN 1 LỜI CHÚC</div>
          {greetings.map((g, i) => (
            <button
              key={i}
              onClick={() => pick(g)}
              className={`w-full text-left rounded-xl border p-3 text-sm transition-colors ${selected === g ? "border-primary bg-primary/10 text-foreground" : "border-border hover:border-primary/40"}`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {selected && !confirmed && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Pencil className="h-3.5 w-3.5" /> Chỉnh sửa nếu muốn
          </div>
          <textarea
            value={editing}
            onChange={(e) => setEditing(e.target.value.slice(0, 120))}
            rows={2}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-primary"
          />
          <div className="flex justify-between gap-2">
            <button onClick={() => { setSelected(null); setEditing(""); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" /> Chọn lại
            </button>
            <button onClick={confirm} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:brightness-105 min-h-10">
              <Check className="h-3.5 w-3.5" /> Xác nhận lời chúc
            </button>
          </div>
        </div>
      )}

      {confirmed && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span>
            <div>
              <div className="text-xs font-medium text-primary mb-0.5">Lời chúc đã chọn</div>
              <div className="text-sm text-foreground italic">"{editing}"</div>
            </div>
          </div>
          <button onClick={() => { setConfirmed(false); setSelected(null); }} className="mt-2 text-xs text-muted-foreground hover:text-primary">Đổi lời chúc khác</button>
        </div>
      )}
    </div>
  );
}