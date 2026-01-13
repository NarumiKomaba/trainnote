"use client";

import PageHeader from "@/components/PageHeader";
import { useEffect, useMemo, useState } from "react";

const FAKE_UID = "demo-user";

const SUMMARY_CARDS = [
  { label: "週間達成率", value: "78%" },
  { label: "連続記録日数", value: "5日" },
  { label: "最大重量", value: "120kg" },
];

type HabitPoint = { dateKey: string; stampType: "done" | "partial" | "skipped" | "none" };
type EquipmentPoint = { dateKey: string; value: number };

type DashboardPayload = {
  habitSeries: HabitPoint[];
  equipmentSeries: Record<string, EquipmentPoint[]>;
};

function formatMonthDay(dateKey: string) {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function habitScore(stampType: HabitPoint["stampType"]) {
  if (stampType === "done") return 100;
  if (stampType === "partial") return 60;
  if (stampType === "skipped") return 20;
  return 0;
}

export default function DashboardPage() {
  const uid = FAKE_UID;
  const [loading, setLoading] = useState(true);
  const [habitSeries, setHabitSeries] = useState<HabitPoint[]>([]);
  const [equipmentSeries, setEquipmentSeries] = useState<DashboardPayload["equipmentSeries"]>({});
  const equipmentOptions = Object.keys(equipmentSeries);
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Failed to load dashboard");
        setHabitSeries(json.habitSeries ?? []);
        setEquipmentSeries(json.equipmentSeries ?? {});
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  useEffect(() => {
    if (!selectedEquipment && equipmentOptions.length) {
      setSelectedEquipment(equipmentOptions[0]);
    }
  }, [equipmentOptions, selectedEquipment]);

  const series = selectedEquipment ? equipmentSeries[selectedEquipment] ?? [] : [];
  const chartPoints = useMemo(() => {
    if (!series.length) return [];
    const values = series.map((point) => point.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = Math.max(max - min, 1);
    return series.map((point, index) => {
      const x = (index / (series.length - 1)) * 100;
      const y = 100 - ((point.value - min) / range) * 100;
      return `${x},${y}`;
    });
  }, [series]);

  const dateLabels = habitSeries.map((point) => formatMonthDay(point.dateKey));

  return (
    <div className="page">
      <PageHeader title="ダッシュボード" />
      <section className="flex flex-col gap-3">
        <div className="text-sm font-semibold text-slate-500">集計</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {SUMMARY_CARDS.map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">{card.label}</div>
              <div className="text-2xl font-bold text-slate-800">{card.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="text-sm font-semibold text-slate-500">習慣達成率</div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          {loading ? (
            <div className="page-subtitle">読み込み中...</div>
          ) : habitSeries.length === 0 ? (
            <div className="page-subtitle">記録がまだありません。</div>
          ) : (
            <div className="flex items-end gap-2">
              {habitSeries.map((point, index) => {
                const value = habitScore(point.stampType);
                return (
                  <div key={point.dateKey} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-24 w-full items-end rounded-full bg-slate-100">
                      <div
                        className="w-full rounded-full bg-orange-400"
                        style={{ height: `${value}%` }}
                        aria-label={`day-${index}`}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400">{dateLabels[index]}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="text-sm font-semibold text-slate-500">重量推移</div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          {loading ? (
            <div className="page-subtitle">読み込み中...</div>
          ) : equipmentOptions.length === 0 ? (
            <div className="page-subtitle">機材の記録がまだありません。</div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                <span>機材</span>
                <select
                  className="select max-w-[200px]"
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                >
                  {equipmentOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4">
                <div className="text-xs text-slate-400">重量 (kg)</div>
                <div className="mt-2 h-40 w-full">
                  {chartPoints.length ? (
                    <svg viewBox="0 0 100 100" className="h-full w-full">
                      <polyline
                        fill="none"
                        stroke="#fb923c"
                        strokeWidth="2"
                        points={chartPoints.join(" ")}
                      />
                      {series.map((point, index) => {
                        const coords = chartPoints[index].split(",").map(Number);
                        return (
                          <circle key={point.dateKey} cx={coords[0]} cy={coords[1]} r="2" fill="#fb923c" />
                        );
                      })}
                    </svg>
                  ) : (
                    <div className="page-subtitle">データがまだありません。</div>
                  )}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                  {series.map((point) => (
                    <span key={point.dateKey}>{point.dateKey.slice(5)}</span>
                  ))}
                </div>
                <div className="mt-1 text-xs text-slate-400">日付</div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
