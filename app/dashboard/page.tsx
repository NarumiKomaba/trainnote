"use client";

import PageHeader from "@/components/PageHeader";
import { useMemo, useState } from "react";

const SUMMARY_CARDS = [
  { label: "週間達成率", value: "78%" },
  { label: "連続記録日数", value: "5日" },
  { label: "最大重量", value: "120kg" },
];

const HABIT_BARS = [40, 60, 75, 30, 50, 90, 65];

const EQUIPMENT_SERIES = {
  ベンチプレス: [
    { date: "2024-01-01", value: 80 },
    { date: "2024-01-08", value: 82.5 },
    { date: "2024-01-15", value: 85 },
    { date: "2024-01-22", value: 87.5 },
    { date: "2024-01-29", value: 90 },
  ],
  スクワット: [
    { date: "2024-01-01", value: 100 },
    { date: "2024-01-08", value: 105 },
    { date: "2024-01-15", value: 107.5 },
    { date: "2024-01-22", value: 110 },
    { date: "2024-01-29", value: 115 },
  ],
  デッドリフト: [
    { date: "2024-01-01", value: 110 },
    { date: "2024-01-08", value: 115 },
    { date: "2024-01-15", value: 117.5 },
    { date: "2024-01-22", value: 120 },
    { date: "2024-01-29", value: 125 },
  ],
};

const EQUIPMENT_OPTIONS = Object.keys(EQUIPMENT_SERIES);

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function DashboardPage() {
  const [selectedEquipment, setSelectedEquipment] = useState(EQUIPMENT_OPTIONS[0]);
  const series = EQUIPMENT_SERIES[selectedEquipment];
  const chartPoints = useMemo(() => {
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
  const dateLabels = useMemo(() => {
    const today = new Date();
    return HABIT_BARS.map((_, index) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (HABIT_BARS.length - 1 - index));
      return formatMonthDay(d);
    });
  }, []);

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
          <div className="flex items-end gap-2">
            {HABIT_BARS.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-24 w-full items-end rounded-full bg-slate-100">
                  <div
                    className="w-full rounded-full bg-orange-400"
                    style={{ height: `${value}%` }}
                    aria-label={`day-${index}`}
                  />
                </div>
                <div className="text-[10px] text-slate-400">{dateLabels[index]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="text-sm font-semibold text-slate-500">重量推移</div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
            <span>機材</span>
            <select
              className="select max-w-[200px]"
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
            >
              {EQUIPMENT_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <div className="text-xs text-slate-400">重量 (kg)</div>
            <div className="mt-2 h-40 w-full">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <polyline
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth="2"
                  points={chartPoints.join(" ")}
                />
                {series.map((point, index) => {
                  const coords = chartPoints[index].split(",").map(Number);
                  return <circle key={point.date} cx={coords[0]} cy={coords[1]} r="2" fill="#fb923c" />;
                })}
              </svg>
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-400">
              {series.map((point) => (
                <span key={point.date}>{point.date.slice(5)}</span>
              ))}
            </div>
            <div className="mt-1 text-xs text-slate-400">日付</div>
          </div>
        </div>
      </section>
    </div>
  );
}
