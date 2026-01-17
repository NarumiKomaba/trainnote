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
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [stampMap, setStampMap] = useState<Record<string, string>>({});
  const dateOffsets = [-2, -1, 0, 1, 2];
  const dateList = dateOffsets.map((offset) => {
    if (!today) return { date: new Date(), offset }; // dummy fallback for hook stability
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    return { date, offset };
  });
  const monthTitle = today ? formatMonthTitle(today) : "";
  const daysInMonth = today ? new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() : 30;
  const firstDayIndex = today ? new Date(today.getFullYear(), today.getMonth(), 1).getDay() : 0;
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
    if (!isHome || !today) return;
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

  if (!today) return null;

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "ダッシュボード";
    if (pathname === "/settings") return "設定";
    if (pathname === "/equipment") return "機材管理";
    if (pathname === "/settings/goal") return "目標設定";
    if (pathname === "/settings/preference") return "強度設定";
    if (pathname === "/settings/weekly") return "スケジュール設定";
    if (pathname?.startsWith("/patterns")) return "トレーニングパターン";
    return "";
  };

  const pageTitle = getPageTitle();

  return (
    <header className="sticky top-0 z-20 bg-orange-400 text-white shadow-sm">
      <div className="mx-auto flex max-w-[760px] flex-col px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-3 min-h-[44px]">
          {isHome ? (
            <div className="h-9 w-9" aria-hidden="true" />
          ) : (
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center -ml-2"
              aria-label="戻る"
              onClick={() => window.history.back()}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_back
              </span>
            </button>
          )}

          <div className="flex-1 text-center text-base font-semibold">
            {isHome ? monthTitle : pageTitle}
          </div>

          {isHome ? (
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center -mr-2"
              aria-label="カレンダー"
              onClick={() => setIsCalendarOpen(true)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                calendar_month
              </span>
            </button>
          ) : (
            <div className="h-9 w-9" aria-hidden="true" />
          )}
        </div>

        {isHome && (
          <div className="flex justify-center gap-2 mt-4 pb-3" role="list">
            {dateList.map(({ date, offset }) => {
              const isToday = offset === 0;
              return (
                <div
                  key={offset}
                  className={`min-w-[52px] rounded-full border-2 px-3 py-2 text-center text-sm font-semibold ${isToday
                    ? "border-white bg-white text-orange-500 shadow-sm"
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
        )}
      </div>

      {isCalendarOpen && isHome ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
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
                const dateKey = today ? formatDateKey(new Date(today.getFullYear(), today.getMonth(), day)) : "";
                const stampType = stampMap[dateKey];
                const hasStamp = Boolean(stampType && stampType !== "none");
                const isToday = today ? day === today.getDate() : false;
                return (
                  <div
                    key={key}
                    className={`flex h-8 items-center justify-center rounded-full ${isToday ? "bg-orange-100 text-orange-600" : "text-slate-700"
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
