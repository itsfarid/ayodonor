import React from "react";
import SiteFooter from "./layout/SiteFooter";
import SiteHeader from "./layout/SiteHeader";
import AboutPage from "./pages/AboutPage";
import GuidePage from "./pages/GuidePage";
import HomePage from "./pages/HomePage";
import LocationsPage from "./pages/LocationsPage";
import MythsPage from "./pages/MythsPage";
import NotFoundPage from "./pages/NotFoundPage";
import { Router, useRouter } from "./router";

const PAGES: Record<string, () => React.ReactElement> = {
  "/": HomePage,
  "/panduan": GuidePage,
  "/fakta-mitos": MythsPage,
  "/lokasi": LocationsPage,
  "/tentang": AboutPage,
};

function Shell() {
  const { path } = useRouter();
  const Page = PAGES[path] ?? NotFoundPage;
  return (
    <div id="top">
      <a className="skip-link" href="#konten">
        Lewati ke konten
      </a>
      <SiteHeader />
      <main id="konten" tabIndex={-1}>
        <Page />
      </main>
      <SiteFooter />
    </div>
  );
}

/** `path` is for tests and previews; in the browser the router reads the address bar. */
export default function App({ path }: { path?: string }) {
  return (
    <Router initialPath={path}>
      <Shell />
    </Router>
  );
}
