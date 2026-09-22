// Local project imagery; keep the hero asset independent from the old provider CDN.
export const heroImage = "/hero-image.png";

export const productImages = {};

export function imageFor(product) {
  if (!product) return null;
  if (product.slug && productImages[product.slug]) return productImages[product.slug];
  return product.image_url || null;
}

export const CATEGORIES = ["móc khoá", "gương", "lược", "kẹp tóc", "khác"];

export const formatVND = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n || 0);