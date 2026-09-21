import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Wand2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ProductCard from "@/components/ProductCard";
import { heroImage, CATEGORIES } from "@/lib/productImages";

const openAssistant = () => window.dispatchEvent(new Event("makemine:open-assistant"));

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    event.currentTarget.style.setProperty("--pointer-x", `${x}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${y}px`);
  };

  useEffect(() => {
    base44.entities.Product.list("-created_date", 60).then((all) => {
      const f = all.filter((p) => p.featured);
      setFeatured(f.length ? f : all.slice(0, 6));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/75 to-background" />
        </div>
        <div className="pastel-blobs opacity-70">
          <div className="absolute -left-10 top-10 h-56 w-56 rounded-full bg-[#FFD1E8]" />
          <div className="absolute right-10 top-1/4 h-64 w-64 rounded-full bg-[#F8DDEB]" />
          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-[#F6E6F3]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/75 px-4 py-1.5 text-xs font-medium text-slate-800 backdrop-blur dark:border-primary/40 dark:bg-slate-900/70 dark:text-slate-100">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Co-Creation Lab · Khắc tên theo ý bạn
          </div>
          <h1 className="mt-6 font-display text-5xl md:text-7xl font-bold tracking-tight text-glow">
            MAKE IT <span className="text-foreground font-script">YOURS</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base md:text-lg text-muted-foreground">
            Móc khoá, gương, lược, kẹp tóc — cá nhân hoá trong vài giây. Không biết chọn gì? Để AI gợi ý quà tặng phù hợp nhất.
          </p>

          <div className="mx-auto mt-8 max-w-xl">
            <button
              onClick={openAssistant}
              onPointerMove={handlePointerMove}
              onPointerLeave={(event) => {
                event.currentTarget.style.setProperty("--pointer-x", "50%");
                event.currentTarget.style.setProperty("--pointer-y", "50%");
              }}
              className="assistant-hero-card group flex w-full items-center gap-3 rounded-3xl px-5 py-4 text-left backdrop-blur transition-colors min-h-12">
              <span className="assistant-hero-icon grid h-10 w-10 place-items-center rounded-2xl text-white shadow-lg">
                <Wand2 className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="assistant-title block text-sm font-semibold">Hỏi trợ lý quà tặng</span>
                <span className="assistant-subtitle block text-xs">Dịp gì? Tặng ai? Ngân sách bao nhiêu?</span>
              </span>
              <ArrowRight className="assistant-arrow h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
            {CATEGORIES.map((c) =>
            <Link key={c} to={`/san-pham?category=${encodeURIComponent(c)}`} className="category-pill rounded-full px-3.5 py-1.5 capitalize backdrop-blur transition-colors">
                {c}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold">Sản phẩm nổi bật</h2>
            <p className="mt-1 text-sm text-muted-foreground">Những món được cá nhân hoá nhiều nhất tuần qua.</p>
          </div>
          <Link to="/san-pham" className="text-sm font-medium text-primary hover:underline">Xem tất cả →</Link>
        </div>
        {loading ?
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) =>
          <div key={i} className="aspect-[3/4] rounded-3xl shimmer border border-border" />
          )}
          </div> :

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        }
      </section>

      {/* AI BANNER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-primary/25 bg-card/90 p-8 md:p-12 shadow-[0_24px_60px_-24px_rgba(244,114,182,0.35)] backdrop-blur-sm">
          <div className="pastel-blobs opacity-80">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#f8d6e8]/90" />
            <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-[#f3d9f4]/80" />
          </div>
          <div className="relative max-w-lg">
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground">Không biết chọn quà gì?</h3>
            <p className="mt-3 text-muted-foreground">
              Trợ lý AI của MakeMine sẽ hỏi bạn dịp tặng, người nhận và ngân sách — rồi chọn 3–5 sản phẩm phù hợp nhất, kèm lý do vì sao hợp.
            </p>
            <button onClick={openAssistant} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_-10px_rgba(244,114,182,0.4)] hover:brightness-105 min-h-12">
              <Wand2 className="h-4 w-4" /> Bắt đầu gợi ý
            </button>
          </div>
        </div>
      </section>
    </div>);

}