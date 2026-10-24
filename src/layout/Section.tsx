import React from "react";

interface SectionProps {
  id: string;
  kicker?: string;
  title: string;
  deck?: React.ReactNode;
  children: React.ReactNode;
}

/** A content section: heading in the margin column on wide screens, stacked on narrow ones. */
export default function Section({ id, kicker, title, deck, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="section">
      <div className="wrap section__inner">
        <div className="section__head">
          {kicker && <p className="kicker">{kicker}</p>}
          <h2 id={`${id}-title`}>{title}</h2>
          {deck && <p className="deck">{deck}</p>}
        </div>
        <div className="section__body">{children}</div>
      </div>
    </section>
  );
}
