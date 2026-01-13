"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import type { UserSettings } from "@/lib/types";

const FAKE_UID = "demo-user"; // 後でAuth uidに差し替え

const SETTINGS_SECTIONS = [
  {
    title: "基本設定",
    items: [
      { label: "提案の強度", href: "/settings/preference", valueKey: "preference" },
      { label: "目標", href: "/settings/goal", valueKey: "goalText" },
    ],
  },
  {
    title: "トレーニング",
    items: [
      { label: "曜日ごとのパターン", href: "/settings/weekly" },
      { label: "パターン管理", href: "/patterns" },
      { label: "機材管理", href: "/equipment" },
    ],
  },
];

export default function SettingsPage() {
  const uid = FAKE_UID;

  const [preference, setPreference] = useState<UserSettings["preference"]>("normal");
  const [goalText, setGoalText] = useState<string>("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const sRes = await fetch("/api/settings/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        });

        const sJson = await sRes.json();

        if (!sRes.ok) throw new Error(sJson?.error ?? "Failed to load settings");

        const settings: UserSettings | null = sJson.settings ?? null;

        setPreference(settings?.preference ?? "normal");
        setGoalText(settings?.goalText ?? "");
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  if (loading) {
    return (
      <div className="page">
        <PageHeader title="設定" />
        <div className="page-subtitle">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title="設定" />

      {SETTINGS_SECTIONS.map((section) => (
        <section key={section.title} className="card">
          <div className="section-title">{section.title}</div>
          <div className="stack gap-xs">
            {section.items.map((item) => {
              const value =
                item.valueKey === "preference"
                  ? preference === "easy"
                    ? "ゆるめ"
                    : preference === "hard"
                      ? "厳しめ"
                      : "標準"
                  : item.valueKey === "goalText"
                    ? goalText || "未設定"
                    : "";
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="row space-between"
                  style={{ padding: "10px 0", borderBottom: "1px solid #eef0f5" }}
                >
                  <div className="stack gap-xs">
                    <span className="section-title">{item.label}</span>
                    {item.valueKey ? <span className="page-subtitle">{value}</span> : null}
                  </div>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    chevron_right
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
