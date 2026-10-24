import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { canonicalUrl, findRoute, normalizePath, NOT_FOUND_META } from "./routes";

// A small History API router. The site has five fixed pages, every one of which is also prerendered as its own HTML file at
// build time, so this only handles in-app navigation (no full reload) and keeps title, canonical link, focus and scroll in step.

interface RouterValue {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used inside <Router>");
  return ctx;
}

function setMeta(selector: string, attr: string, value: string) {
  document.head.querySelector(selector)?.setAttribute(attr, value);
}

function addMeta(tag: "meta" | "link", attrs: Record<string, string>) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.head.appendChild(el);
}

/** Keeps the document head accurate for the current page (the prerendered HTML already has it for first load). */
function applyHead(path: string) {
  const route = findRoute(path);
  const meta = route ?? NOT_FOUND_META;
  document.title = meta.title;
  setMeta('meta[name="description"]', "content", meta.description);
  setMeta('meta[property="og:title"]', "content", meta.title);
  setMeta('meta[property="og:description"]', "content", meta.description);
  setMeta('meta[name="twitter:title"]', "content", meta.title);
  setMeta('meta[name="twitter:description"]', "content", meta.description);
  const url = canonicalUrl(normalizePath(path));
  if (route) {
    // Arrived from the prerendered 404 page (noindex, no canonical): restore what a real page carries.
    if (document.head.querySelector('meta[name="robots"]')) {
      document.head.querySelector('meta[name="robots"]')?.remove();
      if (!document.head.querySelector('link[rel="canonical"]')) addMeta("link", { rel: "canonical", href: url });
      if (!document.head.querySelector('meta[property="og:url"]')) addMeta("meta", { property: "og:url", content: url });
    }
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('link[rel="canonical"]', "href", url);
  } else {
    // An unknown address must not claim a canonical address or be indexed (same head as the prerendered 404.html).
    document.head.querySelector('link[rel="canonical"]')?.remove();
    document.head.querySelector('meta[property="og:url"]')?.remove();
    if (!document.head.querySelector('meta[name="robots"]')) addMeta("meta", { name: "robots", content: "noindex" });
  }
}

function scrollToHash(hash: string): boolean {
  if (!hash || hash === "#") return false;
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    /* keep raw id */
  }
  const el = document.getElementById(id);
  if (!el) return false;
  // Instant, not smooth: after a page change the reader should land on the target, not watch the old page scroll.
  el.scrollIntoView({ behavior: "instant" });
  return true;
}

interface RouterProps {
  children: React.ReactNode;
  /** For tests and previews: start at this path instead of the browser location. */
  initialPath?: string;
}

export function Router({ children, initialPath }: RouterProps) {
  const [path, setPath] = useState(() => normalizePath(initialPath ?? window.location.pathname));
  const pendingHash = useRef<string>(initialPath ? "" : window.location.hash);
  const firstRender = useRef(true);
  const pathRef = useRef(path);

  const navigate = useCallback((to: string) => {
    const url = new URL(to, window.location.origin);
    const next = normalizePath(url.pathname);
    window.history.pushState({}, "", `${next}${url.search}${url.hash}`);
    if (next === pathRef.current) {
      // Same page (e.g. a link to an anchor further down): nothing re-renders, so scroll here.
      if (!scrollToHash(url.hash)) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    }
    pendingHash.current = url.hash;
    setPath(next);
  }, []);

  useEffect(() => {
    const onPop = () => {
      pendingHash.current = window.location.hash;
      setPath(normalizePath(window.location.pathname));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // After each render of a new page: update the head, then go to the #anchor if there is one, else to the top of the page
  // and move focus to <main> so keyboard and screen-reader users start at the new content.
  useEffect(() => {
    pathRef.current = path;
    applyHead(path);
    const hash = pendingHash.current;
    pendingHash.current = "";
    const isFirstRender = firstRender.current;
    firstRender.current = false;
    if (scrollToHash(hash)) return;
    if (isFirstRender) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.getElementById("konten")?.focus({ preventScroll: true });
  }, [path]);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
}

/** An in-app link. It is a normal <a href>, so open-in-new-tab, copy-link and no-JS navigation keep working. */
export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const { navigate } = useRouter();
  const handle = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (rest.target && rest.target !== "_self") return;
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
