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
      {subtitle || meta || actions ? (
        <div
          className={`flex flex-col gap-2 ${centered ? "items-center text-center" : "md:flex-row md:items-center md:justify-between"
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
