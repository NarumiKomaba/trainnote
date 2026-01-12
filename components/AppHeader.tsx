"use client";

import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__content">
        <div className="app-header__top">
          <Link className="app-header__title app-header__title-link" href="/">
            TrainNote
          </Link>
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
