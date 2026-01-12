import Link from "next/link";

export default function AppFooter() {
  return (
    <footer className="sticky bottom-0 z-10 border-t border-slate-200 bg-white">
      <nav className="mx-auto grid max-w-[760px] grid-cols-3 gap-2 px-4 py-2" aria-label="フッターナビ">
        <Link className="flex flex-col items-center gap-1 text-xs font-semibold text-slate-500" href="/">
          <span className="material-symbols-outlined" aria-hidden="true">
            home
          </span>
          <span>ホーム</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-xs font-semibold text-slate-500" href="/patterns">
          <span className="material-symbols-outlined" aria-hidden="true">
            edit_calendar
          </span>
          <span>記録</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-xs font-semibold text-slate-500" href="/settings">
          <span className="material-symbols-outlined" aria-hidden="true">
            settings
          </span>
          <span>設定</span>
        </Link>
      </nav>
    </footer>
  );
}
