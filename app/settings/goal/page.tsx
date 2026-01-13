"use client";

import React, { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import type { UserSettings, WeeklyRule } from "@/lib/types";

const FAKE_UID = "demo-user"; // 後でAuth uidに差し替え

export default function GoalSettingsPage() {
  const uid = FAKE_UID;
  const [goalText, setGoalText] = useState<string>("");
  const [weeklyRules, setWeeklyRules] = useState<WeeklyRule[]>([]);
  const [preference, setPreference] = useState<UserSettings["preference"]>("normal");
  const [loading, setLoading] = useState(true);
  const skipInitialSave = useRef(true);
  const saveTimer = useRef<number | null>(null);

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
        setGoalText(settings?.goalText ?? "");
        setPreference(settings?.preference ?? "normal");
        setWeeklyRules(settings?.weeklyRules ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  async function saveSettings(nextGoal: string) {
    await fetch("/api/settings/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        goalText: nextGoal,
        preference,
        weeklyRules: weeklyRules.length ? weeklyRules : Array.from({ length: 7 }).map((_, i) => ({
          dayOfWeek: i,
          patternId: null,
        })),
      }),
    });
  }

  useEffect(() => {
    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }
    if (loading) return;
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }
    saveTimer.current = window.setTimeout(() => {
      void saveSettings(goalText);
    }, 500);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [goalText, loading]);

  return (
    <div className="page">
      <PageHeader title="目標" showBack />
      <section className="card">
        <div className="section-title">目標（自由記述）</div>
        <div className="page-subtitle">例：週3回継続 / 体重-2kg / レッグプレスを伸ばしたい</div>
        <textarea
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
          placeholder="例：週3回継続、脚の筋力UP、ストレッチ習慣"
          className="textarea"
        />
      </section>
    </div>
  );
}
