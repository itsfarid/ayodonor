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

/** Keeps the document head accurate for the current page (the prerendered HTML already has it for first load). */
function applyHead(path: string) {
  const meta = findRoute(path) ?? NOT_FOUND_META;
  document.title = meta.title;
  setMeta('meta[name="description"]', "content", meta.description);
  setMeta('meta[property="og:title"]', "content", meta.title);
  setMeta('meta[property="og:description"]', "content", meta.description);
  setMeta('meta[name="twitter:title"]', "content", meta.title);
  setMeta('meta[name="twitter:description"]', "content", meta.description);
  setMeta('meta[property="og:url"]', "content", canonicalUrl(normalizePath(path)));
  setMeta('link[rel="canonical"]', "href", canonicalUrl(normalizePath(path)));
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
  el.scrollIntoView();
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
      if (!scrollToHash(url.hash)) window.scrollTo(0, 0);
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
    if (scrollToHash(hash)) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
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
