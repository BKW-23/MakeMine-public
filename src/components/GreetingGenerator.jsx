import React, { useEffect, useState } from "react";
import { Wand2, Loader2, Check, Pencil, RefreshCw } from "lucide-react";
import { BKW } from "@/api/bkwClient";

const emptyForm = {
  recipient: "",
  relationship: "",
  occasion: "",
  hobbies: "",
  keywords: "",
};

export default function GreetingGenerator({ productName, onConfirm, initialForm = {}, onFormChange, theme = "light" }) {
  const isDark = theme === "dark";
  const [form, setForm] = useState({ ...emptyForm, ...initialForm });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [greetings, setGreetings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const nextForm = { ...emptyForm, ...initialForm };
    setForm((currentForm) => {
      const currentKey = JSON.stringify(currentForm);
      const nextKey = JSON.stringify(nextForm);
      return currentKey === nextKey ? currentForm : nextForm;
    });
  }, [initialForm]);

  const updateForm = (updates) => {
    const nextForm = { ...form, ...updates };
    setForm(nextForm);
    onFormChange?.(nextForm);
  };

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

  const frameClasses = isDark
    ? "border border-slate-700 bg-[#111827]/90 shadow-[0_18px_45px_-25px_rgba(15,23,42,0.9)]"
    : "border border-pink-200 bg-[#fff6fb] shadow-[0_12px_30px_-18px_rgba(244,114,182,0.45)]";
  const headingClasses = isDark ? "text-slate-100" : "text-[#3b2f36]";
  const badgeClasses = isDark ? "bg-[#312e81]/30 text-pink-300" : "bg-[#f9d9e7] text-[#d9468d]";
  const inputClasses = isDark
    ? "rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-pink-400 min-h-11"
    : "rounded-xl border border-[#f2bfd1] bg-white px-3 py-2.5 text-sm text-[#3b2f36] outline-none placeholder:text-[#8c7280] focus:border-[#f472b6] min-h-11";
  const optionClasses = isDark
    ? "border border-slate-700 bg-slate-900/70 text-slate-100 hover:border-pink-400"
    : "border border-[#f2bfd1] bg-white text-[#3b2f36] hover:border-[#f472b6]";
  const selectedOptionClasses = isDark
    ? "border border-pink-400 bg-pink-500/10 text-pink-100"
    : "border border-[#f472b6] bg-[#fdf2f8] text-[#3b2f36]";
  const textAreaClasses = isDark
    ? "w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-pink-400"
    : "w-full rounded-lg border border-[#f2bfd1] bg-white px-3 py-2 text-sm text-[#3b2f36] outline-none placeholder:text-[#8c7280] focus:border-[#f472b6]";
  const actionButtonClasses = isDark
    ? "flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-pink-400 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-10px_rgba(244,114,182,0.8)] hover:brightness-105 disabled:opacity-60 min-h-12"
    : "flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f472b6] to-[#ec4899] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-10px_rgba(244,114,182,0.8)] hover:brightness-105 disabled:opacity-60 min-h-12";
  const secondaryBoxClasses = isDark
    ? "rounded-xl border border-slate-700 bg-slate-900/70 p-3 space-y-2"
    : "rounded-xl border border-[#f2bfd1] bg-[#fff7fb] p-3 space-y-2";
  const mutedTextClasses = isDark ? "text-slate-300" : "text-[#7a5a68]";
  const accentTextClasses = isDark ? "text-pink-300" : "text-[#d9468d]";
  const confirmBoxClasses = isDark ? "rounded-xl border border-slate-700 bg-slate-900/70 p-3" : "rounded-xl border border-[#f2bfd1] bg-[#fff7fb] p-3";

  return (
    <div className={`space-y-4 rounded-2xl p-4 ${frameClasses}`}>
      <div className={`flex items-center gap-2 text-sm font-semibold ${headingClasses}`}>
        <span className={`grid h-6 w-6 place-items-center rounded text-xs font-mono ${badgeClasses}`}>02</span>
        AI tạo lời chúc
      </div>

      {!confirmed && (
        <form onSubmit={generate} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.recipient} onChange={(e) => updateForm({ recipient: e.target.value })} placeholder="Người nhận" className={inputClasses} />
            <input value={form.relationship} onChange={(e) => updateForm({ relationship: e.target.value })} placeholder="Mối quan hệ (bạn thân, người yêu...)" className={inputClasses} />
          </div>
          <input value={form.occasion} onChange={(e) => updateForm({ occasion: e.target.value })} placeholder="Dịp tặng (sinh nhật, kỷ niệm...)" className={`w-full ${inputClasses}`} />
          <input value={form.hobbies} onChange={(e) => updateForm({ hobbies: e.target.value })} placeholder="Sở thích người nhận" className={`w-full ${inputClasses}`} />
          <input value={form.keywords} onChange={(e) => updateForm({ keywords: e.target.value })} placeholder="Từ khoá tuỳ chọn (ngọt ngào, hài hước...)" className={`w-full ${inputClasses}`} />

          {error && <div className={`rounded-lg px-3 py-2 text-sm ${isDark ? "bg-rose-500/10 text-pink-200" : "bg-rose-100 text-[#b42358]"}`}>{error}</div>}

          <button type="submit" disabled={loading} className={actionButtonClasses}>
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
          <div className={`text-xs font-medium font-mono ${mutedTextClasses}`}>CHỌN 1 LỜI CHÚC</div>
          {greetings.map((g, i) => (
            <button
              key={i}
              onClick={() => pick(g)}
              className={`w-full text-left rounded-xl border p-3 text-sm transition-colors ${selected === g ? selectedOptionClasses : optionClasses}`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {selected && !confirmed && (
        <div className={secondaryBoxClasses}>
          <div className={`flex items-center gap-1.5 text-xs font-medium ${accentTextClasses}`}>
            <Pencil className="h-3.5 w-3.5" /> Chỉnh sửa nếu muốn
          </div>
          <textarea
            value={editing}
            onChange={(e) => setEditing(e.target.value.slice(0, 120))}
            rows={2}
            className={textAreaClasses}
          />
          <div className="flex justify-between gap-2">
            <button onClick={() => { setSelected(null); setEditing(""); }} className={`text-xs flex items-center gap-1 ${mutedTextClasses} hover:${isDark ? "text-slate-100" : "text-[#3b2f36]"}`}>
              <RefreshCw className="h-3.5 w-3.5" /> Chọn lại
            </button>
            <button onClick={confirm} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500 to-pink-400 px-4 py-2 text-xs font-semibold text-white hover:brightness-105 min-h-10">
              <Check className="h-3.5 w-3.5" /> Xác nhận lời chúc
            </button>
          </div>
        </div>
      )}

      {confirmed && (
        <div className={confirmBoxClasses}>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-r from-pink-500 to-pink-400 text-white"><Check className="h-3 w-3" /></span>
            <div>
              <div className={`text-xs font-medium mb-0.5 ${accentTextClasses}`}>Lời chúc đã chọn</div>
              <div className={`text-sm italic ${isDark ? "text-slate-100" : "text-[#3b2f36]"}`}>"{editing}"</div>
            </div>
          </div>
          <button onClick={() => { setConfirmed(false); setSelected(null); }} className={`mt-2 text-xs ${mutedTextClasses} hover:${isDark ? "text-pink-300" : "text-[#d9468d]"}`}>Đổi lời chúc khác</button>
        </div>
      )}
    </div>
  );
}