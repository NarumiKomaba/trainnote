"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const FAKE_UID = "demo-user";

function formatMonthTitle(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function formatDayLabel(date: Date) {
  return date.getDate();
}

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AppHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const uid = FAKE_UID;
  const today = useMemo(() => new Date(), []);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [stampMap, setStampMap] = useState<Record<string, string>>({});
  const dateOffsets = [-2, -1, 0, 1, 2];
  const dateList = dateOffsets.map((offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    return { date, offset };
  });
  const monthTitle = formatMonthTitle(today);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const calendarDays = useMemo(() => {
    const blanks = Array.from({ length: firstDayIndex }).map((_, index) => ({
      key: `blank-${index}`,
      day: null,
    }));
    const days = Array.from({ length: daysInMonth }).map((_, index) => ({
      key: `day-${index + 1}`,
      day: index + 1,
    }));
    return [...blanks, ...days];
  }, [daysInMonth, firstDayIndex]);

  useEffect(() => {
    if (!isHome) return;
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    (async () => {
      try {
        const res = await fetch("/api/stamps/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid,
            startDate: formatDateKey(startOfMonth),
            endDate: formatDateKey(endOfMonth),
          }),
        });
        const data = await res.json();
        if (!res.ok) return;
        const nextMap: Record<string, string> = {};
        for (const stamp of data.stamps ?? []) {
          if (stamp?.dateKey) {
            nextMap[stamp.dateKey] = stamp.stampType ?? "done";
          }
        }
        setStampMap(nextMap);
      } catch {
        setStampMap({});
      }
    })();
  }, [isHome, today, uid]);

  if (isHome) {
    return (
      <header className="sticky top-0 z-10 bg-orange-400 text-white">
        <div className="mx-auto flex max-w-[760px] flex-col gap-4 px-4 pb-5 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="h-9 w-9" aria-hidden="true" />
            <div className="flex-1 text-center text-base font-semibold">{monthTitle}</div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center"
              aria-label="カレンダー"
              onClick={() => setIsCalendarOpen(true)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                calendar_month
              </span>
            </button>
          </div>
          <div className="flex justify-center gap-2" role="list">
            {dateList.map(({ date, offset }) => {
              const isToday = offset === 0;
              return (
                <div
                  key={offset}
                  className={`min-w-[52px] rounded-full border-2 px-3 py-2 text-center text-sm font-semibold ${
                    isToday
                      ? "border-white bg-white text-orange-500"
                      : "border-white/70 bg-white/10 text-white"
                  }`}
                  role="listitem"
                >
                  <div>{formatDayLabel(date)}</div>
                  {isToday ? <div className="text-[10px] font-medium">今日</div> : null}
                </div>
              );
            })}
          </div>
        </div>
        {isCalendarOpen ? (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-4 text-slate-800 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-700">{monthTitle}</div>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500"
                  aria-label="閉じる"
                  onClick={() => setIsCalendarOpen(false)}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    close
                  </span>
                </button>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-2 text-center text-[11px] text-slate-400">
                {["日", "月", "火", "水", "木", "金", "土"].map((label) => (
                  <div key={label}>{label}</div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2 text-center text-sm">
                {calendarDays.map(({ key, day }) => {
                  if (!day) {
                    return <div key={key} className="h-8" />;
                  }
                  const dateKey = formatDateKey(new Date(today.getFullYear(), today.getMonth(), day));
                  const stampType = stampMap[dateKey];
                  const hasStamp = Boolean(stampType && stampType !== "none");
                  const isToday = day === today.getDate();
                  return (
                    <div
                      key={key}
                      className={`flex h-8 items-center justify-center rounded-full ${
                        isToday ? "bg-orange-100 text-orange-600" : "text-slate-700"
                      }`}
                    >
                      <span>{day}</span>
                      {hasStamp ? <span className="ml-1 text-[10px]">●</span> : null}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-xs text-slate-400">● = 記録済み</div>
            </div>
          </div>
        ) : null}
      </header>
    );
  }

  return null;
}
