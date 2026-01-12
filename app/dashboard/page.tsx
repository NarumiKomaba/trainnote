"use client";

import PageHeader from "@/components/PageHeader";

const SUMMARY_CARDS = [
  { label: "週間達成率", value: "78%" },
  { label: "連続記録日数", value: "5日" },
  { label: "最大重量", value: "120kg" },
];

const WEEKLY_BARS = [40, 60, 75, 30, 50, 90, 65];

export default function DashboardPage() {
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
        <div className="text-sm font-semibold text-slate-500">週間達成率</div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-end gap-2">
            {WEEKLY_BARS.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="h-24 w-full rounded-full bg-slate-100">
                  <div
                    className="w-full rounded-full bg-orange-400"
                    style={{ height: `${value}%` }}
                    aria-label={`day-${index}`}
                  />
                </div>
                <div className="text-[10px] text-slate-400">{index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="text-sm font-semibold text-slate-500">伸びた重量</div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>ベンチプレス</span>
            <span className="font-semibold text-slate-800">+10kg</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
            <span>スクワット</span>
            <span className="font-semibold text-slate-800">+7.5kg</span>
          </div>
        </div>
      </section>
    </div>
  );
}
