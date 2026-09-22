import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BKW } from "@/api/bkwClient";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES } from "@/lib/productImages";

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("new");

  const category = params.get("category") || "all";

  useEffect(() => {
    setLoading(true);
    setError("");
    BKW.entities.Product.list("-created_date", 60).then((all) => {
      setProducts(all);
      setLoading(false);
    }).catch((requestError) => {
      setError(requestError.message || "Không thể tải danh sách sản phẩm.");
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (sort === "low") list = [...list].sort((a, b) => a.base_price - b.base_price);
    else if (sort === "high") list = [...list].sort((a, b) => b.base_price - a.base_price);
    return list;
  }, [products, category, sort]);

  const setCategory = (c) => {
    if (c === "all") setParams({});
    else setParams({ category: c });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold">Sản phẩm</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tất cả quà tặng cá nhân hoá — chọn loại & sắp xếp tuỳ thích.</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("all")}
            className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${category === "all" ? "bg-primary text-primary-foreground" : "border border-border bg-secondary/50 hover:border-primary/40"}`}
          >
            Tất cả
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${category === c ? "bg-primary text-primary-foreground" : "border border-border bg-secondary/50 hover:border-primary/40"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary min-h-10"
        >
          <option value="new">Mới nhất</option>
          <option value="low">Giá thấp → cao</option>
          <option value="high">Giá cao → thấp</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl shimmer border border-border" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Chưa có sản phẩm nào trong mục này.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}