"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
    <div className="page">
      <PageHeader
        title="設定"
        subtitle="曜日ごとのパターン割り当てと提案方針を調整します。"
        actions={
          <button className="button button--primary" onClick={saveSettings} disabled={loading || saving}>
            {saving ? "保存中..." : "保存"}
          </button>
        }
      />

      {msg ? <div className="notice">{msg}</div> : null}

      <section className="card">
        <div className="section-title">パターン・機材の管理</div>
        <div className="page-subtitle">作成・編集は各画面から行います。</div>
        <div className="settings-links">
          <Link className="settings-link-card" href="/patterns">
            <span className="settings-link-icon" aria-hidden="true">
              📋
            </span>
            <div className="stack gap-xs">
              <span className="settings-link-title">パターン</span>
              <span className="page-subtitle">トレーニング構成を管理</span>
            </div>
          </Link>
          <Link className="settings-link-card" href="/equipment">
            <span className="settings-link-icon" aria-hidden="true">
              🏋️
            </span>
            <div className="stack gap-xs">
              <span className="settings-link-title">機材</span>
              <span className="page-subtitle">使える機材を登録</span>
            </div>
          </Link>
        </div>
      </section>

      <section className="card">
        <div className="section-title">提案の強度</div>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <RadioChip label="ゆるめ" checked={preference === "easy"} onClick={() => setPreference("easy")} hint="疲労少なめ / 継続優先" />
          <RadioChip label="標準" checked={preference === "normal"} onClick={() => setPreference("normal")} hint="基本はこれ" />
          <RadioChip label="厳しめ" checked={preference === "hard"} onClick={() => setPreference("hard")} hint="伸ばしたい時" />
        </div>
      </section>

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

      <section className="card">
        <div className="row space-between">
          <div className="section-title">曜日ごとのパターン</div>
          <Link className="icon-button" href="/patterns" aria-label="パターンを編集">
            <span className="material-symbols-outlined" aria-hidden="true">
              edit
            </span>
          </Link>
        </div>
        <div className="page-subtitle">パターンは「パターン」画面で作成 → ここで割り当てます。</div>

        {loading ? (
          <div className="page-subtitle">読み込み中...</div>
        ) : (
          <div className="stack">
            {weeklyRules
              .slice()
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
              .map((r) => (
                <div key={r.dayOfWeek} className="row space-between" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--border)" }}>
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

        {patterns.length === 0 && !loading ? (
          <div className="notice warning">パターンがまだありません。先にパターン画面で作成してください。</div>
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
    <button type="button" onClick={onClick} className={`chip${checked ? " chip--active" : ""}`}>
      <div style={{ fontWeight: 700 }}>{label}</div>
      <div className="page-subtitle" style={{ marginTop: 2 }}>
        {hint}
      </div>
    </button>
  );
}
