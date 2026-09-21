import React, { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { History, LogIn, LogOut, ShoppingBag, Menu, MoonStar, SunMedium, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import GiftAssistant from "@/components/GiftAssistant";
import { useAuth } from "@/lib/AuthContext";

const NAV = [
  { to: "/", label: "Trang chủ" },
  { to: "/san-pham", label: "Sản phẩm" },
  { to: "/don-hang", label: "Đơn hàng" },
  { to: "/huong-dan", label: "Hướng dẫn" },
  { to: "/dieu-khoan", label: "Điều khoản" },
  { to: "/admin", label: "Quản trị" },
];

export default function Layout() {
  const { count } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const accountRef = useRef(null);
  const navRef = useRef(null);
  const activeNavRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("makemine-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextDark = savedTheme ? savedTheme === "dark" : prefersDark;
    setIsDark(nextDark);
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    localStorage.setItem("makemine-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    const activeLink = activeNavRef.current;
    if (!nav || !activeLink) return;

    const navRect = nav.getBoundingClientRect();
    const activeRect = activeLink.getBoundingClientRect();
    const left = activeRect.left - navRect.left;
    nav.style.setProperty("--nav-pill-left", `${left}px`);
    nav.style.setProperty("--nav-pill-width", `${activeRect.width}px`);
  }, [location.pathname, isDark]);

  const metadata = user?.user_metadata || {};
  const displayName = metadata.full_name || metadata.name || user?.email?.split("@")[0] || "Tài khoản";
  const avatarUrl = metadata.avatar_url || metadata.picture || "";
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="glass-header sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="group flex items-center gap-2.5 py-2">
              <div className="relative flex items-center justify-center">
                <span className="brand-mark relative grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-gradient-to-tr from-cyan-400 via-sky-300 to-indigo-200 shadow-md shadow-cyan-300/40 transition-transform duration-300 group-hover:scale-105">
                  <img src="/favicon.png" alt="Make Mine logo" className="h-full w-full object-cover" />
                </span>
              </div>

              <div className="flex flex-col">
                <span className="flex items-center text-[1.45rem] font-black leading-none tracking-[-0.04em]">
                  <span className="brand-make">Make</span>
                  <span className="brand-mine">Mine</span>
                </span>
                <span className="-mt-1 hidden text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:block dark:text-slate-500">
                  Beauty &amp; Accessories
                </span>
              </div>
            </Link>

            <nav ref={navRef} className="nav-shell hidden md:flex items-center gap-1 relative">
              <span className="nav-pill" aria-hidden="true" />
              {NAV.map((n) => {
                const active = location.pathname === n.to || (n.to !== "/" && location.pathname.startsWith(n.to));
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    ref={active ? activeNavRef : null}
                    className={`nav-link-item relative z-10 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDark((value) => !value)}
                className={`theme-toggle-button ${isDark ? "is-dark" : ""}`}
                aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
              >
                <span className="theme-toggle-sun-glow" aria-hidden="true" />

                <span className="theme-toggle-stars" aria-hidden="true">
                  <svg className="theme-star-svg star-svg-a" viewBox="0 0 24 24">
                    <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
                  </svg>
                  <svg className="theme-star-svg star-svg-b" viewBox="0 0 24 24">
                    <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
                  </svg>
                  <span className="theme-shooting-star" aria-hidden="true" />
                </span>

                <span className="theme-clouds" aria-hidden="true">
                  <svg className="theme-cloud-svg" viewBox="0 0 100 60" fill="currentColor">
                    <path d="M20 50 A15 15 0 0 1 35 25 A22 22 0 0 1 70 20 A18 18 0 0 1 92 40 A12 12 0 0 1 85 55 Z" />
                  </svg>
                </span>

                <span className="theme-toggle-knob">
                  <span className="theme-toggle-core" />
                  <span className="theme-moon-crater crater-1" />
                  <span className="theme-moon-crater crater-2" />
                  <span className="theme-moon-crater crater-3" />
                </span>
              </button>
              <Link
                to="/gio-hang"
                className="cart-button relative grid h-10 w-10 place-items-center rounded-xl bg-secondary/80 text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                aria-label="Giỏ hàng"
              >
                <ShoppingBag className="h-5 w-5" />
                {count > 0 && (
                  <span className="cart-badge absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[8px] font-bold text-primary-foreground">
                    {count}
                  </span>
                )}
              </Link>
              {isAuthenticated ? (
                <div ref={accountRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setAccountOpen((value) => !value)}
                    className="account-button flex h-10 items-center gap-2 rounded-xl bg-secondary/80 px-2 text-left hover:bg-primary/10 transition-colors"
                    aria-expanded={accountOpen}
                    aria-label="Tài khoản"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {initials}
                      </span>
                    )}
                    <span className="hidden max-w-28 truncate text-xs font-semibold sm:block">{displayName}</span>
                  </button>
                  {accountOpen && (
                    <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border bg-card p-3 shadow-lg">
                      <div className="flex items-center gap-3 border-b border-border pb-3">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                            {initials}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{displayName}</p>
                          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <Link
                        to="/don-hang"
                        onClick={() => setAccountOpen(false)}
                        className="mt-3 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <History className="h-4 w-4" /> Lịch sử đơn hàng
                      </Link>
                      <button
                        type="button"
                        onClick={logout}
                        className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <LogOut className="h-4 w-4" /> Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold hover:bg-primary/10 sm:flex"
                >
                  <LogIn className="h-4 w-4" /> Đăng nhập
                </Link>
              )}
              <button
                className="md:hidden grid h-10 w-10 place-items-center rounded-lg bg-secondary"
                onClick={() => setOpen((v) => !v)}
                aria-label="Menu"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
        {open && (
          <nav className="md:hidden border-t border-border px-4 py-3 flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-border mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid gap-8 md:grid-cols-3">
          <div>
            <div className="font-display text-lg font-bold">
              Make<span className="text-primary">Mine</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              Quà tặng cá nhân hoá — móc khoá, gương, lược, kẹp tóc khắc tên. Co-creation lab cho người trẻ.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Khám phá</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/san-pham" className="hover:text-primary">Sản phẩm</Link></li>
              <li><Link to="/don-hang" className="hover:text-primary">Theo dõi đơn hàng</Link></li>
              <li><Link to="/huong-dan" className="hover:text-primary">Hướng dẫn mua hàng</Link></li>
              <li><Link to="/dieu-khoan" className="hover:text-primary">Điều khoản sử dụng</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Liên hệ</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>ĐH FPT, TP. Hà Nội</li>
              <li>hotro@makemine.vn</li>
              <li>TikTok: @makemine</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MakeMine. Co-create your gift.
        </div>
      </footer>

      <GiftAssistant />
    </div>
  );
}