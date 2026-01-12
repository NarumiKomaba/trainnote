"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

function formatMonthTitle(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function formatDayLabel(date: Date) {
  return date.getDate();
}

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const today = new Date();
  const dateOffsets = [-2, -1, 0, 1, 2];
  const dateList = dateOffsets.map((offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    return { date, offset };
  });

  if (isHome) {
    return (
      <header className="sticky top-0 z-10 bg-orange-500 text-white">
        <div className="mx-auto flex max-w-[760px] flex-col gap-4 px-4 pb-5 pt-4">
          <div className="flex items-center justify-between gap-3">
            <Link className="inline-flex h-9 w-9 items-center justify-center" href="/patterns" aria-label="メニュー">
              <span className="material-symbols-outlined" aria-hidden="true">
                menu
              </span>
            </Link>
            <div className="flex-1 text-center text-base font-semibold">{formatMonthTitle(today)}</div>
            <Link className="inline-flex h-9 w-9 items-center justify-center" href="/settings" aria-label="カレンダー">
              <span className="material-symbols-outlined" aria-hidden="true">
                calendar_month
              </span>
            </Link>
          </div>
          <div className="flex justify-center gap-2" role="list">
            {dateList.map(({ date, offset }) => {
              const isToday = offset === 0;
              return (
                <div
                  key={offset}
                  className={`min-w-[52px] rounded-full border-2 px-3 py-2 text-center text-sm font-semibold ${
                    isToday
                      ? "border-white bg-white text-orange-600"
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
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[760px] flex-col gap-3 px-4 pb-3 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center"
              aria-label="戻る"
              onClick={() => router.back()}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_back
              </span>
            </button>
            <Link className="text-lg font-semibold" href="/">
              TrainNote
            </Link>
          </div>
          <Link className="inline-flex h-9 w-9 items-center justify-center" href="/settings" aria-label="設定">
            <span className="material-symbols-outlined" aria-hidden="true">
              settings
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
