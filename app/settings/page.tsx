"use client";

import React, { useEffect, useMemo, useState } from "react";
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

export default function SettingsPage() {
  const uid = FAKE_UID;

  const [patterns, setPatterns] = useState<TrainingPattern[]>([]);
  const [weeklyRules, setWeeklyRules] = useState<WeeklyRule[]>(defaultWeeklyRules());
  const [preference, setPreference] = useState<UserSettings["preference"]>("normal");
  const [goalText, setGoalText] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const patternOptions = useMemo(() => {
    return [{ id: "", name: "休み（パターンなし）" }, ...patterns.map((p) => ({ id: p.id, name: p.name }))];
  }, [patterns]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        // patterns + settings を並行取得
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

        // weeklyRules: 7日分を必ず揃える
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
      setMsg("保存しました");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-4">
      <PageHeader
        title="設定"
        subtitle="曜日ごとのパターン割り当てと提案方針を調整します。"
        actions={
          <button
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            onClick={saveSettings}
            disabled={loading || saving}
          >
            {saving ? "保存中..." : "保存"}
          </button>
        }
      />

      {msg ? <div className="rounded-xl bg-indigo-50 px-3 py-2 text-sm text-slate-700">{msg}</div> : null}

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">提案の強度</div>
        <div className="flex flex-wrap gap-2">
          <RadioChip label="ゆるめ" checked={preference === "easy"} onClick={() => setPreference("easy")} hint="疲労少なめ / 継続優先" />
          <RadioChip label="標準" checked={preference === "normal"} onClick={() => setPreference("normal")} hint="基本はこれ" />
          <RadioChip label="厳しめ" checked={preference === "hard"} onClick={() => setPreference("hard")} hint="伸ばしたい時" />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">目標（自由記述）</div>
        <div className="text-xs text-slate-500">例：週3回継続 / 体重-2kg / レッグプレスを伸ばしたい</div>
        <textarea
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
          placeholder="例：週3回継続、脚の筋力UP、ストレッチ習慣"
          className="min-h-[110px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">曜日ごとのパターン</div>
        <div className="text-xs text-slate-500">パターンは「パターン」画面で作成 → ここで割り当てます。</div>

        {loading ? (
          <div className="text-sm text-slate-500">読み込み中...</div>
        ) : (
          <div className="flex flex-col gap-2">
            {weeklyRules
              .slice()
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
              .map((r) => (
                <div key={r.dayOfWeek} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                  <div className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {DOW_LABELS[r.dayOfWeek]}
                  </div>
                  <select
                    value={r.patternId ?? ""}
                    onChange={(e) => updateRule(r.dayOfWeek, e.target.value)}
                    className="w-full max-w-[220px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
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

        {patterns.length === 0 && !loading ? (
          <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            パターンがまだありません。先にパターン画面で作成してください。
          </div>
        ) : null}
      </section>
    </div>
  );
}

function RadioChip({
  label,
  checked,
  hint,
  onClick,
}: {
  label: string;
  checked: boolean;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-1 rounded-xl border px-4 py-3 text-left ${
        checked ? "border-slate-900" : "border-slate-300"
      }`}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-slate-500">{hint}</div>
    </button>
  );
}
