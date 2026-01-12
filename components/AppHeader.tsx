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
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">TrainNote</div>
            <div className="text-xs text-slate-500">スマホでサッと記録、迷わない動線に</div>
          </div>
          <Link
            className="rounded-full border border-slate-900 px-3 py-2 text-xs font-semibold text-slate-900"
            href="/patterns/new"
          >
            ＋ 新規パターン
          </Link>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="メインナビゲーション">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                }`}
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
