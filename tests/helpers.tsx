import { render } from "@testing-library/react";
import App from "../src/App";
import { ROUTES } from "../src/routes";

/** Renders the whole app as if the browser were at `path`. */
export const renderPage = (path: string) => render(<App path={path} />);

/** Text of every page, rendered one after another (for site-wide "this text must never appear" checks). */
export function allPagesText(): string {
  const parts: string[] = [];
  for (const r of ROUTES) {
    const { container, unmount } = renderPage(r.path);
    parts.push(container.textContent ?? "");
    unmount();
  }
  return parts.join("\n");
}
