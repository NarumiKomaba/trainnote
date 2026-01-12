"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/patterns", label: "パターン" },
  { href: "/equipment", label: "機材" },
  { href: "/settings", label: "設定" },
];

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="app-header">
      <div className="app-header__content">
        <div className="app-header__top">
          <div>
            <div className="app-header__title">TrainNote</div>
            <div className="app-header__subtitle">スマホでサッと記録、迷わない動線に</div>
          </div>
          <Link className="button button--outline" href="/patterns/new">
            ＋ 新規パターン
          </Link>
        </div>
        <nav className="app-nav" aria-label="メインナビゲーション">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                className={`app-nav__link${isActive ? " app-nav__link--active" : ""}`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
