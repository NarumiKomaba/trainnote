"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
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
    <div className="page">
      <PageHeader
        title="今日のトレーニング"
        subtitle="提案内容をチェックして、完了したら保存します。"
        meta={<span className="badge">{dateKey}</span>}
        actions={
          <button className="button button--ghost" onClick={loadPlan} disabled={loading}>
            {loading ? "生成中..." : "提案を更新"}
          </button>
        }
      />

      {message ? <div className="notice">{message}</div> : null}

      <section className="card">
        {plan ? (
          <div className="stack">
            <div className="row space-between">
              <div>
                <div className="section-title">{plan.theme}</div>
                <div className="page-subtitle">今日のメニュー</div>
              </div>
              <div className="badge">
                進捗 {doneCount}/{allCount}
              </div>
            </div>

            <div className="stack">
              {items.map((it, idx) => (
                <div key={idx} className="workout-item">
                  <label className="row">
                    <input
                      type="checkbox"
                      checked={it.done}
                      onChange={(e) => updateItem(idx, { done: e.target.checked })}
                    />
                    <span className="workout-title">{it.name}</span>
                  </label>

                  <div className="workout-fields">
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
                      onChange={(v) => updateItem(idx, { durationMin: v === "" ? null : Number(v) })}
                    />
                  </div>

                  {it.reason ? <div className="page-subtitle">理由: {it.reason}</div> : null}
                  {it.note ? <div className="page-subtitle">メモ: {it.note}</div> : null}
                </div>
              ))}
              {items.length === 0 ? <div className="page-subtitle">今日は休養日か、メニューが空です。</div> : null}
            </div>

            <div className="row">
              <button className="button button--primary" onClick={save} disabled={saving || !plan}>
                {saving ? "保存中..." : "完了して保存"}
              </button>
            </div>
          </div>
        ) : (
          <div className="page-subtitle">{loading ? "生成中..." : "未読み込み"}</div>
        )}
      </section>
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
    <label className="stack gap-xs">
      <span className="label">{label}</span>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
      />
    </label>
  );
}
