import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "../router";
import { ROUTES } from "../routes";

function DropMark() {
  return (
    <svg viewBox="0 0 22 28" aria-hidden="true" focusable="false">
      <path d="M11 1C11 1 21 12.5 21 18.5a10 10 0 0 1-20 0C1 12.5 11 1 11 1Z" fill="#7B1428" />
    </svg>
  );
}

export default function SiteHeader() {
  const { path } = useRouter();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // A new page closes the menu.
  useEffect(() => setOpen(false), [path]);

  // Escape closes the menu and returns focus to its button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="masthead">
      <div className="wrap masthead__bar">
        <Link to="/" className="wordmark" aria-label="AyoDonor, ke beranda">
          <DropMark />
          AyoDonor
        </Link>

        <button
          ref={toggleRef}
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="menu-toggle__label">Menu</span>
          <span className="menu-toggle__icon" aria-hidden="true" />
        </button>

        <nav id="site-nav" aria-label="Navigasi utama" className="nav" data-open={open}>
          <ul>
            {ROUTES.map((r) => (
              <li key={r.path}>
                <Link to={r.path} aria-current={path === r.path ? "page" : undefined}>
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
