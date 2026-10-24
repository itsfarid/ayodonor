import React from "react";

interface PageHeaderProps {
  kicker: string;
  title: React.ReactNode;
  children?: React.ReactNode;
}

/** The single h1 of a page, with a one-or-two-line summary. */
export default function PageHeader({ kicker, title, children }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="wrap">
        <p className="kicker">{kicker}</p>
        <h1>{title}</h1>
        {children && <div className="page-header__deck">{children}</div>}
      </div>
    </div>
  );
}
