import React from "react";
import { Link } from "react-router-dom";
import { imageFor, formatVND } from "@/lib/productImages";

export default function ProductCard({ product, reason = null }) {
  const img = imageFor(product);
  return (
    <Link
      to={`/san-pham/${product.slug || product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_18px_50px_-24px_rgba(255,122,162,0.28)] transition-all duration-300 hover:border-primary/40 hover:shadow-[0_22px_56px_-24px_rgba(244,114,182,0.45)]"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full shimmer" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-accent-foreground backdrop-blur">
          {product.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        {product.short_description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{product.short_description}</p>
        )}
        {reason && (
          <p className="text-xs text-primary/90 bg-primary/5 border border-primary/20 rounded-lg px-2 py-1.5">
            {reason}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold text-primary">{formatVND(product.base_price)}</span>
          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Xem →</span>
        </div>
      </div>
    </Link>
  );
}