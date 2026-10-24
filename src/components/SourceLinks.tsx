import { getSource, type SourceRef } from "../data/sources";

interface SourceLinksProps {
  refs: SourceRef[];
  className?: string;
}

/** "Sumber: <link> (hal. 56); <link>" placed next to the content it supports. Plain links: keyboard focusable. */
export default function SourceLinks({ refs, className }: SourceLinksProps) {
  if (refs.length === 0) return null;
  return (
    <span className={className ?? "source-links"}>
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
