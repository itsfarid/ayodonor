import { getSource, type SourceRef } from "../data/sources";

interface SourceLinksProps {
  refs: SourceRef[];
  className?: string;
}

/** "Sumber: <link> (hal. 56); <link>" placed next to the content it supports. Plain links: keyboard focusable. */
export default function SourceLinks({ refs, className }: SourceLinksProps) {
  if (refs.length === 0) return null;
  return (
    <span className={className ?? "text-[11px] text-slate-600"}>
      Sumber:{" "}
      {refs.map((ref, i) => {
        const source = getSource(ref.id);
        return (
          <span key={`${ref.id}-${i}`}>
            {i > 0 && "; "}
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-red-800 hover:text-red-900 focus-visible:ring-2 focus-visible:ring-red-500 rounded"
              title={`${source.title} (${source.publisher})`}
            >
              {source.label}
              <span className="sr-only"> (membuka tab baru)</span>
            </a>
            {ref.locator ? ` (${ref.locator})` : ""}
          </span>
        );
      })}
    </span>
  );
}
