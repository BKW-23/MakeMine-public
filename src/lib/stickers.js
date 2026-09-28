export const DEFAULT_STICKERS = [
  { id: "none", label: "Không sticker", emoji: "—", image: null, icon: null, sort_order: -100 },
  { id: "bow", label: "Nơ xinh xinh", emoji: "🎀", image: "/stickers/bow.jpg", icon: null, sort_order: 0 },
  { id: "heart", label: "Tim tí hon", emoji: "♡", image: "/stickers/heart.jpg", icon: null, sort_order: 10 },
  { id: "hello-kitty", label: "Kitty miu miu", emoji: "♡", image: "/stickers/hello-kitty.jpg", icon: null, sort_order: 20 },
  { id: "star", label: "Sao lấp lánh", emoji: "★", image: "/stickers/star.jpg", icon: null, sort_order: 30 },
  { id: "bear", label: "Gấu mũm mĩm", emoji: "🐻", image: "/stickers/bear.jpg", icon: "/stickers/bear-icon.png", sort_order: 40 },
  { id: "sparkle", label: "Lấp la lấp lánh", emoji: "✦", image: "/stickers/sparkle.jpg", icon: null, sort_order: 50 },
];

export let STICKERS = DEFAULT_STICKERS.map((item) => ({ ...item }));

export const hydrateStickerCatalog = (items = []) => {
  const map = new Map(DEFAULT_STICKERS.map((item) => [item.id, { ...item }]));
  const normalizedItems = Array.isArray(items) ? items : [];

  normalizedItems
    .filter((item) => item && (item.id || item.slug || item.label))
    .forEach((item, index) => {
      const id = String(item.slug || item.id || `custom-sticker-${index}`);
      map.set(id, {
        id,
        slug: String(item.slug || id),
        label: String(item.label || "Sticker"),
        emoji: item.emoji || "✨",
        image: item.image_url || item.image || null,
        icon: item.icon_url || item.icon || null,
        sort_order: Number(item.sort_order ?? index),
      });
    });

  STICKERS = Array.from(map.values())
    .filter((item) => item && item.label)
    .sort((a, b) => (Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)) || 0);

  return STICKERS;
};

export const stickerLabel = (id) =>
  STICKERS.find((sticker) => sticker.id === id || sticker.slug === id)?.label || id;
