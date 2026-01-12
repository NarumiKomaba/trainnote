"use client";

import React, { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import type { UserSettings, WeeklyRule } from "@/lib/types";

const FAKE_UID = "demo-user"; // 後でAuth uidに差し替え

export default function PreferenceSettingsPage() {
  const uid = FAKE_UID;
  const [preference, setPreference] = useState<UserSettings["preference"]>("normal");
  const [weeklyRules, setWeeklyRules] = useState<WeeklyRule[]>([]);
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
        setPreference(settings?.preference ?? "normal");
        setWeeklyRules(settings?.weeklyRules ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  async function saveSettings(nextPreference: UserSettings["preference"]) {
    await fetch("/api/settings/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        preference: nextPreference,
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
      void saveSettings(preference);
    }, 500);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [preference, loading]);

  return (
    <div className="page">
      <PageHeader title="提案の強度" showBack />
      <section className="card">
        <div className="section-title">強度を選択</div>
        <div className="preference-slider">
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={preference === "easy" ? 0 : preference === "normal" ? 1 : 2}
            onChange={(e) => {
              const value = Number(e.target.value);
              setPreference(value === 0 ? "easy" : value === 1 ? "normal" : "hard");
            }}
          />
          <div className="preference-slider__labels">
            <span>ゆるめ</span>
            <span>標準</span>
            <span>厳しめ</span>
          </div>
        </div>
      </section>
    </div>
  );
}
