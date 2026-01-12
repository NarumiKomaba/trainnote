"use client";

import Link from "next/link";

const SETTINGS_LINKS = [
  { title: "パターン管理", description: "トレーニング構成の管理", href: "/patterns" },
  { title: "機材管理", description: "使える機材の登録", href: "/equipment" },
];

export default function SettingsPage() {
  return (
    <div className="page">
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white">
        {SETTINGS_LINKS.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between px-4 py-4 text-sm ${
              index < SETTINGS_LINKS.length - 1 ? "border-b border-slate-200" : ""
            }`}
          >
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-slate-700">{item.title}</span>
              <span className="text-xs text-slate-500">{item.description}</span>
            </div>
            <span className="material-symbols-outlined text-slate-400" aria-hidden="true">
              chevron_right
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
