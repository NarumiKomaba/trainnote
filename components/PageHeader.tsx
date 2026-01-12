"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  centered?: boolean;
  showBack?: boolean;
};

export default function PageHeader({ title, subtitle, meta, actions, centered, showBack }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-4 -mt-4 bg-orange-400 text-white sm:mx-0 sm:rounded-xl sticky top-0 z-10">
        <div className="mx-auto flex max-w-[760px] items-center px-4 py-4">
          {showBack ? (
            <button
              type="button"
              className="mr-2 inline-flex h-9 w-9 items-center justify-center"
              aria-label="戻る"
              onClick={() => router.back()}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_back
              </span>
            </button>
          ) : (
            <div className="h-9 w-9" aria-hidden="true" />
          )}
          <div className="flex-1 text-center text-base font-semibold">{title}</div>
          <div className="h-9 w-9" aria-hidden="true" />
        </div>
      </div>
      {subtitle || meta || actions ? (
        <div
          className={`flex flex-col gap-2 ${
            centered ? "items-center text-center" : "md:flex-row md:items-center md:justify-between"
          }`}
        >
          <div className="stack gap-xs">
            {subtitle ? <div className="page-subtitle">{subtitle}</div> : null}
            {meta ? <div className="page-meta">{meta}</div> : null}
          </div>
          {actions ? <div className="page-actions">{actions}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
