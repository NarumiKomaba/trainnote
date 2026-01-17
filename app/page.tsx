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
  const [equipmentMap, setEquipmentMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [customTimeMin, setCustomTimeMin] = useState<number | "">("");

  async function loadPlan(force = false) {
    setLoading(true);
    setMessage("");
    try {
      const body: any = { uid, dateKey, force };
      if (customTimeMin) {
        body.availableTimeMin = Number(customTimeMin);
      }
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ? JSON.stringify(data.error) : "Failed");

      setPlan(data);
      const init: WorkoutResultItem[] = (data.items ?? []).map((it: any) => ({
        ...it,
        done: it.done ?? false,
      }));
      setItems(init);
      setEditingIndex(null);
    } catch (e: any) {
      setMessage(e?.message ?? "Failed to load plan");
    } finally {
      setLoading(false);
    }
  }

  async function loadEquipment() {
    setMessage("");
    try {
      const res = await fetch("/api/equipment/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load equipment");
      const nextMap: Record<string, string> = {};
      for (const equip of data.equipment ?? []) {
        if (equip?.id) {
          nextMap[equip.id] = equip.name ?? equip.id;
        }
      }
      setEquipmentMap(nextMap);
    } catch (e: any) {
      setMessage(e?.message ?? "Failed to load equipment");
    }
  }

  useEffect(() => {
    loadPlan();
    loadEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doneCount = items.filter((i) => i.done).length;
  const allCount = items.length;
  const progressPercent = allCount === 0 ? 0 : Math.round((doneCount / allCount) * 100);

  function updateItem(idx: number, patch: Partial<WorkoutResultItem>) {
    setItems((prev) => {
      const next = prev.map((it, i) => (i === idx ? { ...it, ...patch } : it));
      // 入力時に即保存
      void save(next);
      return next;
    });
  }

  async function save(nextItems: WorkoutResultItem[]) {
    if (!plan) return;
    setSaving(true);
    setMessage("");
    try {
      const completed = nextItems.some((item) => item.done); // 完了判定は好みで調整（全doneでtrueでもOK）
      const res = await fetch("/api/save-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          dateKey,
          patternId: plan.patternId,
          items: nextItems,
          completed,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ? JSON.stringify(data.error) : "Failed");
    } catch (e: any) {
      setMessage(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function toggleDone(idx: number) {
    setItems((prev) => {
      const nextItems = prev.map((it, i) => (i === idx ? { ...it, done: !it.done } : it));
      void save(nextItems);
      return nextItems;
    });
  }

  return (
    <div className="page">
      {message ? <div className="notice">{message}</div> : null}

      <section className="stack gap-xs">
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200" aria-label="進捗">
            <div className="h-full rounded-full bg-orange-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="text-sm font-semibold text-slate-500">
            {doneCount}/{allCount}
          </div>
        </div>
        <div className="regen-container">
          <div className="regen-group">
            <div className="regen-input-box">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>timer</span>
              <input
                type="number"
                placeholder="--"
                value={customTimeMin}
                onChange={(e) => setCustomTimeMin(e.target.value === "" ? "" : Number(e.target.value))}
              />
              <span>分</span>
            </div>
            <button
              type="button"
              className="regen-btn"
              onClick={() => loadPlan(true)}
              disabled={loading}
              aria-label={loading ? "再生成中" : "再生成"}
            >
              <span className="material-symbols-outlined" style={{ animation: loading ? "spin 2s linear infinite" : "none" }}>
                {loading ? "sync" : "restart_alt"}
              </span>
            </button>
          </div>
        </div>
      </section>

      <section>
        {plan ? (
          <div className="stack">
            <div className="stack">
              {items.map((it, idx) => {
                const isEditing = editingIndex === idx;
                const equipmentName = it.equipmentId ? equipmentMap[it.equipmentId] ?? "不明" : null;
                return (
                  <div
                    key={idx}
                    className={`workout-item${it.done ? " workout-item--done" : ""}`}
                    onClick={() => {
                      toggleDone(idx);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        if (editingIndex === idx) return;
                        e.preventDefault();
                        toggleDone(idx);
                      }
                    }}
                  >
                    <div className="row space-between workout-item-row">
                      <div className="stack gap-xs">
                        <span className="workout-title">{it.name}</span>
                      </div>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={isEditing ? "閉じる" : "詳細を開く"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingIndex(isEditing ? null : idx);
                        }}
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">
                          {isEditing ? "expand_less" : "expand_more"}
                        </span>
                      </button>
                    </div>

                    {isEditing ? (
                      <div className="stack gap-sm mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        {it.note ? <div className="text-xs text-slate-500 mb-2">📝 {it.note}</div> : null}

                        <div className="row gap-xs">
                          <Field
                            label="重量(kg)"
                            value={it.weight ?? ""}
                            onChange={(v) => updateItem(idx, { weight: v === "" ? null : v.endsWith(".") ? (it.weight ?? 0) : Number(v) })}
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
                        </div>
                      </div>
                    ) : (
                      <div className="workout-metrics">
                        重量: {formatMetric(it.weight, "kg")} / 回数: {formatMetric(it.reps)} / セット:{" "}
                        {formatMetric(it.sets)}
                      </div>
                    )}
                  </div>
                );
              })}
              {items.length === 0 ? <div className="page-subtitle">今日は休養日か、メニューが空です。</div> : null}
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
    <label className="stack gap-xs" style={{ flex: 1, minWidth: 0 }}>
      <span className="label" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </span>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
      />
    </label>
  );
}

function formatMetric(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined) return "-";
  return `${value}${suffix}`;
}
