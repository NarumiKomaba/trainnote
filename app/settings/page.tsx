"use client";

import React, { useEffect, useMemo, useState } from "react";
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
    <div style={{ maxWidth: 860, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>設定</h1>
          <div style={{ opacity: 0.7, fontSize: 13 }}>曜日ごとのパターン割り当て & 提案の方針</div>
        </div>
        <button
          onClick={saveSettings}
          disabled={loading || saving}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #111",
            background: "#111",
            color: "white",
            cursor: "pointer",
          }}
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </header>

      {msg ? (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: "#f5f5f5" }}>{msg}</div>
      ) : null}

      <section style={{ marginTop: 18, padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 750 }}>提案の強度</h2>
        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <RadioChip
            label="ゆるめ"
            checked={preference === "easy"}
            onClick={() => setPreference("easy")}
            hint="疲労少なめ / 継続優先"
          />
          <RadioChip
            label="標準"
            checked={preference === "normal"}
            onClick={() => setPreference("normal")}
            hint="基本はこれ"
          />
          <RadioChip
            label="厳しめ"
            checked={preference === "hard"}
            onClick={() => setPreference("hard")}
            hint="伸ばしたい時"
          />
        </div>
      </section>

      <section style={{ marginTop: 14, padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 750 }}>目標（自由記述）</h2>
        <div style={{ marginTop: 8, opacity: 0.7, fontSize: 13 }}>
          例：週3回継続 / 体重-2kg / レッグプレスを伸ばしたい
        </div>
        <textarea
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
          placeholder="例：週3回継続、脚の筋力UP、ストレッチ習慣"
          style={{
            marginTop: 10,
            width: "100%",
            minHeight: 90,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #ddd",
            resize: "vertical",
          }}
        />
      </section>

      <section style={{ marginTop: 14, padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 750 }}>曜日ごとのパターン</h2>
        <div style={{ marginTop: 8, opacity: 0.7, fontSize: 13 }}>
          パターンは「patterns」画面で作成（名前/自由記述/使える機材）→ここで割り当て。
        </div>

        {loading ? (
          <div style={{ marginTop: 12, opacity: 0.7 }}>読み込み中...</div>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {weeklyRules
              .slice()
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
              .map((r) => (
                <div
                  key={r.dayOfWeek}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "64px 1fr",
                    gap: 10,
                    alignItems: "center",
                    padding: 12,
                    border: "1px solid #eee",
                    borderRadius: 12,
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{DOW_LABELS[r.dayOfWeek]}</div>
                  <select
                    value={r.patternId ?? ""}
                    onChange={(e) => updateRule(r.dayOfWeek, e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd" }}
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
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fff7e6" }}>
            パターンがまだありません。先に patterns 画面で作成してください。
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
      style={{
        padding: "12px 14px",
        borderRadius: 14,
        border: checked ? "2px solid #111" : "1px solid #ddd",
        background: "white",
        cursor: "pointer",
        textAlign: "left",
        minWidth: 160,
      }}
    >
      <div style={{ fontWeight: 800 }}>{label}</div>
      <div style={{ opacity: 0.7, fontSize: 12, marginTop: 2 }}>{hint}</div>
    </button>
  );
}
