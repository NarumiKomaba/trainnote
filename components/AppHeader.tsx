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
  const prevDate = new Date(today);
  prevDate.setDate(today.getDate() - 1);
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + 1);

  if (isHome) {
    return (
      <header className="app-header app-header--home">
        <div className="app-header__content app-header__content--home">
          <div className="app-header__top">
            <Link className="icon-button app-header__icon" href="/patterns" aria-label="メニュー">
              <span className="material-symbols-outlined" aria-hidden="true">
                menu
              </span>
            </Link>
            <div className="app-header__title app-header__title--home">{formatMonthTitle(today)}</div>
            <Link className="icon-button app-header__icon" href="/settings" aria-label="カレンダー">
              <span className="material-symbols-outlined" aria-hidden="true">
                calendar_month
              </span>
            </Link>
          </div>
          <div className="home-date-strip" role="list">
            <div className="home-date-chip" role="listitem">
              <span className="home-date-chip__number">{formatDayLabel(prevDate)}</span>
            </div>
            <div className="home-date-chip home-date-chip--today" role="listitem">
              <span className="home-date-chip__number">{formatDayLabel(today)}</span>
              <span className="home-date-chip__label">今日</span>
            </div>
            <div className="home-date-chip" role="listitem">
              <span className="home-date-chip__number">{formatDayLabel(nextDate)}</span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="app-header">
      <div className="app-header__content">
        <div className="app-header__top">
          <div className="app-header__left">
            <button type="button" className="icon-button" aria-label="戻る" onClick={() => router.back()}>
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_back
              </span>
            </button>
            <Link className="app-header__title app-header__title-link" href="/">
              TrainNote
            </Link>
          </div>
          <Link className="icon-button" href="/settings" aria-label="設定">
            <span className="material-symbols-outlined" aria-hidden="true">
              settings
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
