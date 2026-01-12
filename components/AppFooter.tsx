"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppFooter() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const isRecord = pathname === "/";
  const isSettings = pathname?.startsWith("/settings");

  const linkBase = "flex flex-col items-center gap-1 text-xs font-semibold";
  const activeClass = "text-orange-500";
  const inactiveClass = "text-slate-500";

  return (
    <footer className="sticky bottom-0 z-10 border-t border-slate-200 bg-white">
      <nav className="mx-auto grid max-w-[760px] grid-cols-3 gap-2 px-4 py-2" aria-label="フッターナビ">
        <Link className={`${linkBase} ${isDashboard ? activeClass : inactiveClass}`} href="/dashboard">
          <span className="material-symbols-outlined" aria-hidden="true">
            home
          </span>
          <span>ダッシュボード</span>
        </Link>
        <Link className={`${linkBase} ${isRecord ? activeClass : inactiveClass}`} href="/">
          <span className="material-symbols-outlined" aria-hidden="true">
            edit_calendar
          </span>
          <span>記録</span>
        </Link>
        <Link className={`${linkBase} ${isSettings ? activeClass : inactiveClass}`} href="/settings">
          <span className="material-symbols-outlined" aria-hidden="true">
            settings
          </span>
          <span>設定</span>
        </Link>
      </nav>
    </footer>
  );
}
