import React, { useEffect, useMemo, useState } from "react";
import { Copy, HelpCircle, RotateCcw, SlidersHorizontal, Sparkles, Trash2, X } from "lucide-react";
import { STICKERS } from "@/lib/stickers";
import ModelPreview from "@/components/ModelPreview";
import GreetingGenerator from "@/components/GreetingGenerator";

const TINTS = [
  { id: "original", label: "Gốc", hex: null },
  { id: "pearl", label: "Trắng ngọc trai", hex: "#ffffff" },
  { id: "silver", label: "Bạc ánh trăng", hex: "#cbd5e1" },
  { id: "gold", label: "Vàng nắng", hex: "#facc15" },
  { id: "pink", label: "Hồng kẹo", hex: "#f472b6" },
  { id: "blue", label: "Xanh mây", hex: "#7dd3fc" },
];

const ENGRAVING_COLORS = [
  { id: "Hồng đào", hex: "#E887A5" },
  { id: "Tím lavender", hex: "#9D83C7" },
  { id: "Trắng ngọc trai", hex: "#F4F0E8" },
  { id: "Xanh bạc hà", hex: "#83C9B1" },
  { id: "Đen huyền", hex: "#302B35" },
];
const ENGRAVING_TYPES = [
  { id: "raised", label: "Khắc nổi" },
  { id: "engraved", label: "Khắc chìm" },
];

const CROP_POSITIONS = {
  bow: "48% 42%",
  heart: "55% 55%",
  "hello-kitty": "45% 48%",
  star: "52% 48%",
  bear: "48% 52%",
  sparkle: "50% 42%",
};

const stickerCropStyle = (sticker) => ({
  backgroundImage: `url(${sticker.icon || sticker.image})`,
  backgroundPosition: CROP_POSITIONS[sticker.id] || "50% 50%",
  backgroundRepeat: "no-repeat",
  backgroundSize: sticker.icon ? "contain" : "320%",
});

export default function DesignStudioModal({
  product,
  name,
  message,
  colorHex,
  color,
  font,
  engravingType,
  includeMessage,
  showGreetingGenerator = false,
  greetingForm = {},
  onGreetingFormChange,
  initialTextSurface = null,
  initialTextScale = 1,
  initialTextRotation = 0,
  initialLayers = [],
  onClose,
  onSave,
  onTextChange,
}) {
  const availableStickers = useMemo(() => STICKERS.filter((item) => item.image), []);
  const [layers, setLayers] = useState(initialLayers);
  const [selectedId, setSelectedId] = useState(initialLayers[initialLayers.length - 1]?.id || null);
  const [tint, setTint] = useState("original");
  const [opacity, setOpacity] = useState(100);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [resetModelView, setResetModelView] = useState(null);
  const [mobilePanel, setMobilePanel] = useState("controls");
  const [mobilePanelHeight, setMobilePanelHeight] = useState(260);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.matchMedia("(max-width: 1023px)").matches : false);
  const [textSurface, setTextSurface] = useState(initialTextSurface);
  const [textSelected, setTextSelected] = useState(false);
  const [textScale, setTextScale] = useState(initialTextScale);
  const [textRotation, setTextRotation] = useState(initialTextRotation);

  const selected = layers.find((layer) => layer.id === selectedId);
  const isModelProduct = product.slug === "guong-cam-tay-lap-lanh";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const handleChange = (event) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener?.("change", handleChange);

    return () => {
      mediaQuery.removeEventListener?.("change", handleChange);
    };
  }, []);
  const selectLayer = (layerId) => {
    setSelectedId(layerId);
    if (layerId) setMobilePanel("controls");
  };

  const addSticker = (sticker) => {
    const layer = {
      id: `${sticker.id}-${Date.now()}`,
      sticker,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      opacity: 100,
    };
    setLayers((current) => [...current, layer]);
    setSelectedId(layer.id);
    setMobilePanel("controls");
    setTint("original");
  };

  const updateSelected = (changes) => {
    setLayers((current) => current.map((layer) => (
      layer.id === selectedId ? { ...layer, ...changes } : layer
    )));
  };

  const updateSurfaceLayer = (layerId, surface) => {
    setLayers((current) => current.map((layer) => (
      layer.id === layerId ? { ...layer, surface } : layer
    )));
  };

  const reset = () => {
    setLayers([]);
    setSelectedId(null);
    setTint("original");
    setOpacity(100);
    setScale(1);
    setRotation(0);
    setTextScale(1);
    setTextRotation(0);
    setMobilePanel(null);
    resetModelView?.();
    onTextChange?.({
      name: "",
      message: "",
      color: ENGRAVING_COLORS[0].id,
      font: product.fonts?.[0] || "Sans",
      engravingType: "raised",
      includeMessage: false,
    });
    setTextSurface(null);
  };

  const closeStudio = () => {
    const selectedLayer = layers.find((layer) => layer.id === selectedId) || layers[layers.length - 1];
    onSave?.(layers, selectedLayer?.sticker?.id || "none", {
      name, message, color, font, engravingType, includeMessage, textSurface, textScale, textRotation,
    });
    onClose();
  };

  const saveDesign = () => {
    closeStudio();
  };

  const handleDrag = (event, layer) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startLayer = { ...layer };
    const workspaceRect = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!workspaceRect) return;
    const move = (moveEvent) => {
      updateSelected({
        x: Math.min(92, Math.max(8, startLayer.x + ((moveEvent.clientX - startX) / workspaceRect.width) * 100)),
        y: Math.min(92, Math.max(8, startLayer.y + ((moveEvent.clientY - startY) / workspaceRect.height) * 100)),
      });
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  const handleResize = (event, layer) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startScale = layer.scale;
    const move = (moveEvent) => {
      const distance = Math.max(moveEvent.clientX - startX, moveEvent.clientY - startY);
      const nextScale = Math.min(2.5, Math.max(0.45, startScale + distance / 180));
      setScale(nextScale);
      updateSelected({ scale: nextScale });
    };

    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  const startMobilePanelDrag = (event) => {
    if (!isMobile || mobilePanel !== "controls") return;
    event.preventDefault();
    event.stopPropagation();
    const startY = event.clientY;
    const startHeight = mobilePanelHeight;
    const maxHeight = Math.min(Math.max(window.innerHeight * 0.5, 280), window.innerHeight - 80);

    const move = (moveEvent) => {
      const delta = startY - moveEvent.clientY;
      const nextHeight = Math.min(Math.max(startHeight - delta, 180), maxHeight);
      setMobilePanelHeight(nextHeight);
    };

    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };


  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-slate-950 text-slate-100" onPointerDown={() => setShowInstructions(false)}>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-3 sm:h-16 sm:px-4">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 sm:h-9 sm:w-9">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-bold">
              <span className="truncate">MakeMine Design Studio</span>
              <span className="rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] text-pink-300">Xinh xắn 1.0</span>
            </div>
            <p className="hidden text-[11px] text-slate-400 sm:block">Phối sticker và tạo mẫu quà riêng của bạn</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-2 text-xs text-slate-300 hover:bg-slate-800 sm:px-3">
            <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button type="button" onClick={saveDesign} className="inline-flex items-center gap-1.5 rounded-lg bg-pink-500 px-2.5 py-2 text-xs font-semibold text-white hover:bg-pink-400 sm:px-3">
            <span className="hidden sm:inline">Lưu thiết kế</span><span className="sm:hidden">Lưu</span>
          </button>
          <button type="button" onClick={closeStudio} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800" aria-label="Đóng studio">
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-950 p-2 lg:hidden">
          <button type="button" onClick={() => setMobilePanel("stickers")} className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-pink-400 hover:text-pink-300">
            <Sparkles className="mr-1.5 inline h-3.5 w-3.5" /> Kho sticker
          </button>
          <button type="button" onClick={() => setMobilePanel("controls")} className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-pink-400 hover:text-pink-300">
            <SlidersHorizontal className="mr-1.5 inline h-3.5 w-3.5" /> Tùy chỉnh
          </button>
        </div>
        <aside className={`z-30 flex max-h-36 w-full shrink-0 flex-col border-b border-slate-800 bg-slate-950 p-3 lg:relative lg:z-auto lg:max-h-none lg:w-72 lg:border-b-0 lg:border-r ${mobilePanel === "stickers" ? "absolute left-2 right-2 top-14 max-h-[70vh] w-auto rounded-xl border lg:static lg:w-72" : "hidden lg:flex"}`}>
          <div className="mb-2 flex items-center gap-2 border-b border-pink-500 pb-2 text-sm font-semibold text-pink-300 lg:mb-3 lg:pb-3">
            <Sparkles className="h-4 w-4" /> Kho sticker
          </div>
          <p className="mb-2 text-[11px] text-slate-400 lg:mb-3">Bấm vào mẫu để thêm vào thiết kế</p>
          <div className="flex min-h-0 gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-2 lg:gap-2 lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1">
            {availableStickers.map((item) => (
              <button key={item.id} type="button" onClick={() => addSticker(item)} className="group w-24 shrink-0 rounded-xl border border-slate-800 bg-slate-900 p-1.5 text-left hover:border-pink-500 lg:w-auto lg:p-2">
                <img src={item.image} alt={item.label} className="aspect-square w-full rounded-lg object-cover transition group-hover:scale-105" />
                <span className="mt-1 block truncate text-[11px] text-slate-300 group-hover:text-pink-300">{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <main
          className="checkerboard-bg relative flex min-h-[min(54vh,560px)] min-w-0 flex-1 items-center justify-center overflow-hidden p-2 sm:min-h-[min(60vh,620px)] sm:p-5 lg:min-h-0"
          onPointerDown={() => { setSelectedId(null); setTextSelected(false); setMobilePanel(null); }}
        >
          <div className="relative aspect-square h-auto w-[min(90vw,540px)] max-w-[min(78vh,700px)] overflow-hidden rounded-2xl border border-slate-700/70 bg-white shadow-2xl xs:w-[min(84vw,500px)] sm:w-[min(76vw,620px)] lg:w-full">
            {isModelProduct ? (
              <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-white to-purple-100">
                <ModelPreview
                  src="/models/guong-cam-tay-lap-lanh.glb"
                  alt={product.name}
                  layers={layers}
                  selectedId={selectedId}
                  onSelectLayer={selectLayer}
                  onMoveLayer={updateSurfaceLayer}
                  onResetView={setResetModelView}
                  text={name}
                  includeMessage={includeMessage}
                  message={message}
                  textColor={colorHex}
                  textSurface={textSurface}
                  textScale={textScale}
                  textRotation={textRotation}
                  textSelected={textSelected}
                  onSelectText={(selectedText) => { setTextSelected(selectedText); if (selectedText) setSelectedId(null); }}
                  onMoveText={(surface) => {
                    setTextSurface(surface);
                    onTextChange?.({ textSurface: surface });
                  }}
                />
              </div>
            ) : (
              <img src={product.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            {!isModelProduct && layers.map((layer) => {
              const selectedLayer = layer.id === selectedId;
              return (
                <button
                  key={layer.id}
                  type="button"
                  onPointerDown={(event) => { event.stopPropagation(); selectLayer(layer.id); handleDrag(event, layer); }}
                  className={`absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-xl p-1 ${selectedLayer ? "ring-2 ring-pink-400 ring-offset-2 ring-offset-transparent" : ""}`}
                  style={{ left: `${layer.x}%`, top: `${layer.y}%`, opacity: layer.opacity / 100, transform: `translate(-50%, -50%) scale(${layer.scale})` }}
                >
                  <span
                    role="img"
                    aria-label={layer.sticker.label}
                    className="block h-full w-full rounded-lg bg-slate-100"
                    style={{
                      ...stickerCropStyle(layer.sticker),
                      filter: tint !== "original" ? `sepia(1) saturate(3) hue-rotate(${tint === "blue" ? "145deg" : tint === "pink" ? "290deg" : "0deg"})` : "none",
                    }}
                  />
                  {selectedLayer && (
                    <>
                      <span className="pointer-events-none absolute -inset-1 rounded border-2 border-blue-500" />
                      <span className="pointer-events-none absolute -left-1 top-1/2 h-8 w-1.5 -translate-y-1/2 rounded-full bg-blue-500" />
                      <span className="pointer-events-none absolute -right-1 top-1/2 h-8 w-1.5 -translate-y-1/2 rounded-full bg-blue-500" />
                      <span
                        role="presentation"
                        onPointerDown={(event) => handleResize(event, layer)}
                        className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-white bg-blue-500 shadow"
                      />
                    </>
                  )}
                </button>
              );
            })}
          </div>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
            {showInstructions ? (
              <div
                className="w-72 rounded-xl border border-slate-700 bg-slate-950/95 p-3 text-xs text-slate-300 shadow-xl backdrop-blur"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <div className="mb-2 flex items-center gap-2 font-semibold text-pink-300">
                  <HelpCircle className="h-4 w-4" /> Cách chỉnh thiết kế
                </div>
                {isModelProduct && (
                  isMobile ? (
                    <>
                      <p>Với điện thoại: dùng 1 ngón tay để xoay; 2 ngón để kéo và zoom sản phẩm.</p>
                      <p className="mt-1">Bấm “Đưa về chính diện” để quay lại góc nhìn ban đầu.</p>
                    </>
                  ) : (
                    <>
                      <p>Với máy tính: giữ chuột trái để xoay; chuột phải để di chuyển; cuộn chuột để zoom.</p>
                      <p className="mt-1">Bấm “Đưa về chính diện” để quay lại góc nhìn ban đầu.</p>
                    </>
                  )
                )}
                <p>Chạm vào sticker để chọn; nó sẽ hiện khung chỉnh sửa.</p>
                <p className="mt-1">Kéo sticker để di chuyển trên sản phẩm.</p>
                <p className="mt-1">Bấm ra ngoài sticker để bỏ chọn.</p>
                <p className="mt-1">Dùng bảng bên phải để đổi kích thước, xoay và độ trong suốt.</p>
              </div>
            ) : (
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setShowInstructions(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/90 px-3 py-1.5 text-xs text-slate-300 shadow-xl hover:border-pink-400 hover:text-pink-300"
              >
                <HelpCircle className="h-3.5 w-3.5" /> Hướng dẫn
              </button>
            )}
          </div>
          {isModelProduct && (
            <button
              type="button"
              onClick={() => resetModelView?.()}
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/90 px-2.5 py-1.5 text-xs text-slate-300 shadow-xl backdrop-blur-md transition hover:border-pink-400 hover:text-pink-300 active:scale-95 sm:right-5 sm:top-5 sm:px-3"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="sm:hidden">Căn giữa</span>
              <span className="hidden sm:inline">Đưa về chính diện</span>
            </button>
          )}
        </main>

        <aside
          className={`z-30 flex min-h-0 w-full shrink-0 flex-col overflow-y-auto border-t border-slate-800 bg-slate-950 lg:relative lg:z-auto lg:max-h-none lg:w-72 lg:border-l lg:border-t-0 ${mobilePanel === "controls" ? "lg:static lg:w-72" : "hidden lg:flex"}`}
          style={
            isMobile && mobilePanel === "controls"
              ? {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: `${mobilePanelHeight}px`,
                  maxHeight: `${Math.min(Math.max(window.innerHeight * 0.5, 280), window.innerHeight - 80)}px`,
                  borderRadius: "1rem 1rem 0 0",
                  zIndex: 40,
                  boxShadow: "0 -10px 30px rgba(15, 23, 42, 0.45)",
                }
              : undefined
          }
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 p-3 text-xs font-semibold uppercase tracking-wider text-slate-300 sm:p-4">
            <div
              className="flex flex-1 cursor-grab items-center justify-center py-1 active:cursor-grabbing lg:hidden"
              onPointerDown={startMobilePanelDrag}
              aria-label="Kéo để thay đổi chiều cao tùy chỉnh"
              title="Kéo để mở rộng/thu gọn"
            >
              <span className="block h-1.5 w-12 rounded-full bg-slate-600" />
            </div>
            <span className="hidden items-center gap-2 lg:inline-flex"><SlidersHorizontal className="h-4 w-4 text-pink-400" /> Tùy chỉnh sticker</span>
            <button type="button" onClick={() => setMobilePanel(null)} className="hidden rounded-md px-2 py-1 text-[10px] normal-case tracking-normal text-slate-400 hover:bg-slate-800 hover:text-white lg:inline-flex">
              Ẩn
            </button>
          </div>
          <div className="shrink-0 space-y-5 border-b border-slate-800 p-4">
            <div className="space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-pink-300">Nội dung khắc</div>
              <textarea
                value={name}
                onChange={(event) => onTextChange?.({ name: event.target.value.slice(0, 20) })}
                placeholder="Tên cần khắc (tối đa 20 ký tự)"
                rows={2}
                wrap="soft"
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-400 focus:border-pink-400"
              />
              <textarea
                value={message}
                onChange={(event) => onTextChange?.({ message: event.target.value.slice(0, 80) })}
                placeholder="Lời nhắn (không bắt buộc)"
                rows={2}
                wrap="soft"
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-400 focus:border-pink-400"
              />
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={includeMessage}
                  onChange={(event) => onTextChange?.({ includeMessage: event.target.checked })}
                  className="h-4 w-4 accent-pink-500"
                />
                Khắc cả lời chúc
              </label>
              <label className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-xs text-slate-300 transition-colors ${showGreetingGenerator ? "border-pink-400/50 bg-pink-500/5" : "border-slate-700 bg-slate-900/60"}`}>
                <span>
                  <span className="block font-medium text-slate-100">AI gợi ý lời chúc</span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">Bật để tham khảo rồi chỉnh sửa theo ý bạn.</span>
                </span>
                <input
                  type="checkbox"
                  checked={showGreetingGenerator}
                  onChange={(event) => onTextChange?.({ showGreetingGenerator: event.target.checked })}
                  className="h-4 w-4 shrink-0 accent-pink-500"
                />
              </label>
              <div className={showGreetingGenerator ? "block" : "hidden"}>
                <GreetingGenerator
                  productName={product.name}
                  initialForm={greetingForm}
                  onFormChange={onGreetingFormChange}
                  theme="dark"
                  onConfirm={(nextMessage) => onTextChange?.({ message: nextMessage, includeMessage: true })}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {product.fonts?.length ? product.fonts.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onTextChange?.({ font: item })}
                    className={`rounded-lg border px-2.5 py-1.5 text-[11px] ${font === item ? "border-pink-400 bg-pink-500/10 text-pink-300" : "border-slate-700 text-slate-400 hover:border-pink-400"}`}
                  >
                    {item}
                  </button>
                )) : null}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ENGRAVING_COLORS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    title={item.id}
                    onClick={() => onTextChange?.({ color: item.id })}
                    className={`h-6 w-6 rounded-full border-2 ${color === item.id ? "border-white ring-2 ring-pink-400" : "border-slate-700"}`}
                    style={{ backgroundColor: item.hex }}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                {ENGRAVING_TYPES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTextChange?.({ engravingType: item.id })}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] ${engravingType === item.id ? "border-pink-400 bg-pink-500/10 text-pink-300" : "border-slate-700 text-slate-400 hover:border-pink-400"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[11px] text-slate-400">Màu hiệu ứng / ánh kim</p>
              <div className="grid grid-cols-3 gap-2">
                {TINTS.map((item) => <button key={item.id} type="button" title={item.label} onClick={() => setTint(item.id)} className={`h-8 rounded border text-[10px] ${tint === item.id ? "border-pink-400" : "border-slate-700"}`} style={{ background: item.hex || "#1e293b", color: item.hex ? "#334155" : "#cbd5e1" }}>{item.id === "original" ? "Gốc" : ""}</button>)}
              </div>
            </div>
            <label className="block text-[11px] text-slate-400">Độ trong suốt: {opacity}%
              <input type="range" min="10" max="100" value={opacity} onChange={(event) => { setOpacity(event.target.value); updateSelected({ opacity: event.target.value }); }} className="mt-2 w-full accent-pink-500" disabled={!selected} />
            </label>
            <label className="block text-[11px] text-slate-400">Kích thước: {scale.toFixed(1)}x
              <input type="range" min="0.5" max="2.5" step="0.1" value={textSelected ? textScale : scale} onChange={(event) => { const value = Number(event.target.value); if (textSelected) { setTextScale(value); onTextChange?.({ textScale: value }); } else { setScale(value); updateSelected({ scale: value }); } }} className="mt-2 w-full accent-pink-500" disabled={!selected && !textSelected} />
            </label>
            <label className="block text-[11px] text-slate-400">{textSelected ? "Xoay chữ" : "Xoay sticker"}: {textSelected ? textRotation : rotation}°
              <input type="range" min="-180" max="180" step="1" value={textSelected ? textRotation : rotation} onChange={(event) => { const value = Number(event.target.value); if (textSelected) { setTextRotation(value); onTextChange?.({ textRotation: value }); } else { setRotation(value); updateSelected({ rotation: value }); } }} className="mt-2 w-full accent-pink-500" disabled={!selected && !textSelected} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => selected && addSticker(selected.sticker)} className="rounded-lg border border-slate-700 p-2 text-[11px] text-slate-300 hover:bg-slate-800"><Copy className="mx-auto mb-1 h-4 w-4" />Nhân bản</button>
              <button type="button" onClick={() => { setLayers((current) => current.filter((layer) => layer.id !== selectedId)); setSelectedId(null); }} className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-[11px] text-rose-300 hover:bg-rose-500/20"><Trash2 className="mx-auto mb-1 h-4 w-4" />Xóa hình</button>
            </div>
          </div>
          <div className="min-h-[96px] min-w-0 border-t border-slate-800 p-4">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-300"><span>Danh sách layer</span><span className="text-slate-500">{layers.length} hình</span></div>
            {layers.map((layer) => (
              <button key={layer.id} type="button" onClick={() => selectLayer(layer.id)} className={`mb-1 flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs ${layer.id === selectedId ? "bg-pink-500/15 text-pink-200" : "text-slate-400 hover:bg-slate-900"}`}>
                <span className="h-8 w-8 shrink-0 rounded bg-slate-800" style={stickerCropStyle(layer.sticker)} />
                {layer.sticker.label}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
