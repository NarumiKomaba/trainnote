import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  centered?: boolean;
};

export default function PageHeader({ title, subtitle, meta, actions, centered }: PageHeaderProps) {
  return (
    <div className={`page-header${centered ? " page-header--centered" : ""}`}>
      <div className="stack gap-xs">
        <div className="page-title">{title}</div>
        {subtitle ? <div className="page-subtitle">{subtitle}</div> : null}
        {meta ? <div className="page-meta">{meta}</div> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}
