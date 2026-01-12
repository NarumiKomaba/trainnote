"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import type { TrainingPattern, UserSettings, WeeklyRule } from "@/lib/types";

const FAKE_UID = "demo-user"; // 後でAuth uidに差し替え

const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function defaultWeeklyRules(): WeeklyRule[] {
  return Array.from({ length: 7 }).map((_, i) => ({
    dayOfWeek: i,
    patternId: null,
  }));
}

export default function WeeklyPatternPage() {
  const uid = FAKE_UID;

  const [patterns, setPatterns] = useState<TrainingPattern[]>([]);
  const [weeklyRules, setWeeklyRules] = useState<WeeklyRule[]>(defaultWeeklyRules());
  const [preference, setPreference] = useState<UserSettings["preference"]>("normal");
  const [goalText, setGoalText] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const skipInitialSave = useRef(true);
  const saveTimer = useRef<number | null>(null);

  const patternOptions = useMemo(() => {
    return [{ id: "", name: "休み（パターンなし）" }, ...patterns.map((p) => ({ id: p.id, name: p.name }))];
  }, [patterns]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const [pRes, sRes] = await Promise.all([
          fetch("/api/patterns/list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid }),
          }),
          fetch("/api/settings/get", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid }),
          }),
        ]);

        const pJson = await pRes.json();
        const sJson = await sRes.json();

        if (!pRes.ok) throw new Error(pJson?.error ?? "Failed to load patterns");
        if (!sRes.ok) throw new Error(sJson?.error ?? "Failed to load settings");

        setPatterns(pJson.patterns ?? []);

        const settings: UserSettings | null = sJson.settings ?? null;

        setPreference(settings?.preference ?? "normal");
        setGoalText(settings?.goalText ?? "");

        const base = defaultWeeklyRules();
        const incoming: WeeklyRule[] = settings?.weeklyRules ?? [];
        const merged = base.map((b) => incoming.find((r) => r.dayOfWeek === b.dayOfWeek) ?? b);
        setWeeklyRules(merged);
      } catch (e: any) {
        setMsg(e?.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  function updateRule(dow: number, patternIdRaw: string) {
    const patternId = patternIdRaw === "" ? null : patternIdRaw;
    setWeeklyRules((prev) => prev.map((r) => (r.dayOfWeek === dow ? { ...r, patternId } : r)));
  }

  async function saveSettings() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/settings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          weeklyRules,
          preference,
          goalText,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to save settings");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
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
      void saveSettings();
    }, 500);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [weeklyRules, preference, goalText, loading]);

  return (
    <div className="page">
      <PageHeader title="曜日ごとのパターン" showBack />
      <section className="card">
        <div className="section-title">曜日ごとのパターン</div>
        {loading ? (
          <div className="page-subtitle">読み込み中...</div>
        ) : (
          <div className="stack">
            {weeklyRules
              .slice()
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
              .map((r) => (
                <div key={r.dayOfWeek} className="row space-between weekly-rule-row">
                  <div className="badge">{DOW_LABELS[r.dayOfWeek]}</div>
                  <select
                    value={r.patternId ?? ""}
                    onChange={(e) => updateRule(r.dayOfWeek, e.target.value)}
                    className="select"
                    style={{ maxWidth: 260 }}
                  >
                    {patternOptions.map((p) => (
                      <option key={p.id || "rest"} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
