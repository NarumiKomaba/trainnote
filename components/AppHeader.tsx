"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AppHeader() {
  const router = useRouter();

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
