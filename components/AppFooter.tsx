"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppFooter() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const isRecord = pathname === "/";
  const isSettings = pathname?.startsWith("/settings");

  const linkBase = "flex flex-col items-center gap-1 text-xs font-semibold";
  const activeColor = "#ea580c"; // orange-600
  const inactiveColor = "#94a3b8"; // slate-400

  const renderItem = (href: string, label: string, iconName: string, isActive: boolean) => (
    <Link
      href={href}
      className={linkBase}
      style={{ color: isActive ? activeColor : inactiveColor }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
          fontSize: "24px",
          color: isActive ? activeColor : inactiveColor
        }}
        aria-hidden="true"
      >
        {iconName}
      </span>
      <span style={{ fontWeight: isActive ? "700" : "600" }}>{label}</span>
    </Link>
  );

  return (
    <footer className="sticky bottom-0 z-20 border-t border-slate-200 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <nav className="mx-auto grid max-w-[760px] grid-cols-3 gap-2 px-4 py-2" aria-label="フッターナビ">
        {renderItem("/dashboard", "ダッシュボード", "dashboard", isDashboard ?? false)}
        {renderItem("/", "記録", "edit_calendar", isRecord)}
        {renderItem("/settings", "設定", "settings", isSettings ?? false)}
      </nav>
    </footer>
  );
}
