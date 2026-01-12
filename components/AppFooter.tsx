import Link from "next/link";

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <nav className="app-footer__nav" aria-label="フッターナビ">
        <Link className="app-footer__link" href="/">
          <span className="material-symbols-outlined" aria-hidden="true">
            home
          </span>
          <span>ホーム</span>
        </Link>
        <Link className="app-footer__link" href="/patterns">
          <span className="material-symbols-outlined" aria-hidden="true">
            edit_calendar
          </span>
          <span>記録</span>
        </Link>
        <Link className="app-footer__link" href="/settings">
          <span className="material-symbols-outlined" aria-hidden="true">
            settings
          </span>
          <span>設定</span>
        </Link>
      </nav>
    </footer>
  );
}
