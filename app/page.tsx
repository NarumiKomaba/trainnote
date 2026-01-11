"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { DailyPlan, WorkoutResultItem } from "@/lib/types";

const FAKE_UID = "demo-user"; // 後でAuthのuidに差し替え

function todayKeyJST() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AppHomePage() {
  const uid = FAKE_UID;
  const dateKey = useMemo(() => todayKeyJST(), []);

  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [items, setItems] = useState<WorkoutResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

  async function loadPlan() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, dateKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ? JSON.stringify(data.error) : "Failed");

      setPlan(data);
      const init: WorkoutResultItem[] = (data.items ?? []).map((it: any) => ({
        ...it,
        done: false,
      }));
      setItems(init);
    } catch (e: any) {
      setMessage(e?.message ?? "Failed to load plan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doneCount = items.filter((i) => i.done).length;
  const allCount = items.length;

  function updateItem(idx: number, patch: Partial<WorkoutResultItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  async function save() {
    if (!plan) return;
    setSaving(true);
    setMessage("");
    try {
      const completed = doneCount > 0; // 完了判定は好みで調整（全doneでtrueでもOK）
      const res = await fetch("/api/save-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          dateKey,
          patternId: plan.patternId,
          items,
          completed,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ? JSON.stringify(data.error) : "Failed");
      setMessage(`保存しました（スタンプ: ${data.stampType}）`);
    } catch (e: any) {
      setMessage(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>TrainNote</h1>
          <div style={{ opacity: 0.7 }}>{dateKey}</div>
          <a href="/settings" style={{ textDecoration: "underline" }}>設定</a>
          <a href="/patterns" style={{ textDecoration: "underline" }}>パターン</a>
        </div>
        <button
          onClick={loadPlan}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "white",
            cursor: "pointer",
          }}
        >
          {loading ? "生成中..." : "今日の提案を更新"}
        </button>
      </header>

      <div style={{ marginTop: 18, padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
        {plan ? (
          <>
            <div style={{ fontSize: 18, fontWeight: 650 }}>{plan.theme}</div>
            <div style={{ marginTop: 8, opacity: 0.7 }}>
              進捗: {doneCount}/{allCount}
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {items.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 12,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={it.done}
                      onChange={(e) => updateItem(idx, { done: e.target.checked })}
                      style={{ transform: "scale(1.2)" }}
                    />
                    <span style={{ fontSize: 16, fontWeight: 650 }}>{it.name}</span>
                  </label>

                  {/* 提案値の表示＆必要時だけ変更 */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <Field
                      label="重量(kg)"
                      value={it.weight ?? ""}
                      onChange={(v) => updateItem(idx, { weight: v === "" ? null : Number(v) })}
                    />
                    <Field
                      label="回数"
                      value={it.reps ?? ""}
                      onChange={(v) => updateItem(idx, { reps: v === "" ? null : Number(v) })}
                    />
                    <Field
                      label="セット"
                      value={it.sets ?? ""}
                      onChange={(v) => updateItem(idx, { sets: v === "" ? null : Number(v) })}
                    />
                    <Field
                      label="分"
                      value={it.durationMin ?? ""}
                      onChange={(v) =>
                        updateItem(idx, { durationMin: v === "" ? null : Number(v) })
                      }
                    />
                  </div>

                  {it.reason ? (
                    <div style={{ opacity: 0.75, fontSize: 13 }}>理由: {it.reason}</div>
                  ) : null}
                  {it.note ? <div style={{ opacity: 0.75, fontSize: 13 }}>メモ: {it.note}</div> : null}
                </div>
              ))}
              {items.length === 0 ? (
                <div style={{ opacity: 0.7 }}>今日は休養日か、メニューが空です。</div>
              ) : null}
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={save}
                disabled={saving || !plan}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid #111",
                  background: "#111",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {saving ? "保存中..." : "完了して保存"}
              </button>
              {message ? <div style={{ opacity: 0.8 }}>{message}</div> : null}
            </div>
          </>
        ) : (
          <div style={{ opacity: 0.7 }}>{loading ? "生成中..." : "未読み込み"}</div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 4 }}>
      <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
        style={{
          width: 110,
          padding: "8px 10px",
          borderRadius: 10,
          border: "1px solid #ddd",
        }}
      />
    </label>
  );
}
