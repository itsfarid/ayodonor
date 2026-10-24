import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import {canonicalUrl, NOT_FOUND_META, ROUTES, type RouteMeta} from './src/routes';
import {buildSitemap, jsonLdScript, websiteJsonLd} from './src/seo';

const escapeAttr = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escapeText = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Rewrites the page-specific head tags of the built index.html. */
function withRouteHead(html: string, meta: Pick<RouteMeta, 'title' | 'description'>, urlPath: string | null): string {
  const url = urlPath ? canonicalUrl(urlPath) : null;
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeText(meta.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeAttr(meta.description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeAttr(meta.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeAttr(meta.description)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escapeAttr(meta.title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escapeAttr(meta.description)}$2`);
  if (url) {
    out = out
      .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
      .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  } else {
    // The not-found page must not claim a canonical address or be indexed.
    out = out
      .replace(/\s*<meta property="og:url"[^>]*>/, '')
      .replace(/<link rel="canonical"[^>]*>/, '<meta name="robots" content="noindex" />');
  }
  // Structured data (WebSite) belongs to the home page only; every other file stays free of JSON-LD.
  if (urlPath === '/') out = out.replace('</head>', `    ${jsonLdScript(websiteJsonLd())}\n  </head>`);
  return out;
}

/**
 * The site is a client-rendered app with five pages. So that every address works on a plain static host (direct visit,
 * refresh, shared link) without any rewrite or fallback rule, the build writes one HTML file per page next to index.html:
 * panduan.html, fakta-mitos.html, lokasi.html, tentang.html, plus 404.html. They differ from index.html only in the head
 * (title, description, canonical); the same scripts and styles load and the app renders the page for the address.
 */
function routeHtml(): Plugin {
  return {
    name: 'ayodonor-route-html',
    apply: 'build',
    writeBundle(options) {
      const dir = options.dir;
      if (!dir) return;
      const indexPath = path.join(dir, 'index.html');
      const base = fs.readFileSync(indexPath, 'utf8');
      for (const route of ROUTES) {
        const html = withRouteHead(base, route, route.path);
        const file = route.path === '/' ? 'index.html' : `${route.path.slice(1)}.html`;
        fs.writeFileSync(path.join(dir, file), html);
      }
      fs.writeFileSync(path.join(dir, '404.html'), withRouteHead(base, NOT_FOUND_META, null));
      fs.writeFileSync(path.join(dir, 'sitemap.xml'), buildSitemap());
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), routeHtml()],
    // The site is served from the root of its own domain (ayodonor.web.id).
    base: '/',
    build: {
      // Complete standalone static site; deploy this directory as-is (Cloudflare: output/assets directory "dist").
      outDir: 'dist',
      emptyOutDir: true,
      // Production source maps would expose application source to every visitor.
      sourcemap: false,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
