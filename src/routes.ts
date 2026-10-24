// Route table shared by the app (navigation, document title) and the build (one prerendered HTML file per route, see vite.config.ts).

export const SITE_URL = "https://ayodonor.web.id";

export interface RouteMeta {
  path: string;
  /** Short name used in navigation. */
  label: string;
  title: string;
  description: string;
}

const NOT_AFFILIATED = "Bukan layanan medis dan tidak berafiliasi dengan PMI.";

export const ROUTES: RouteMeta[] = [
  {
    path: "/",
    label: "Beranda",
    title: "AyoDonor — Edukasi Donor Darah untuk Anak Muda",
    description:
      "AyoDonor — proyek edukasi independen tentang donor darah untuk generasi muda Indonesia: dasar-dasar donor, kuis panduan awal, dan tanya jawab (FAQ). Bukan layanan medis dan tidak berafiliasi dengan PMI.",
  },
  {
    path: "/panduan",
    label: "Panduan",
    title: "Panduan Donor Darah — AyoDonor",
    description: `Panduan umum donor darah: pemeriksaan sebelum donor, persiapan, proses, dan setelah donor, lengkap dengan sumber. Ada kuis panduan awal dan tanya jawab. ${NOT_AFFILIATED}`,
  },
  {
    path: "/fakta-mitos",
    label: "Fakta & Mitos",
    title: "Fakta dan Mitos Donor Darah — AyoDonor",
    description: `Fakta singkat dan mitos umum seputar donor darah beserta sumbernya, termasuk apa yang tidak kami klaim. ${NOT_AFFILIATED}`,
  },
  {
    path: "/lokasi",
    label: "Lokasi",
    title: "Cari UDD/UTD PMI per Kota — AyoDonor",
    description: `Cari alamat dan telepon UDD/UTD PMI per kota atau provinsi, disalin dari halaman Kontak PMI. Daftar bisa belum lengkap; hubungi unit untuk memastikan. ${NOT_AFFILIATED}`,
  },
  {
    path: "/tentang",
    label: "Tentang",
    title: "Tentang AyoDonor dan Sumber Informasi",
    description: `Tujuan AyoDonor, batasannya, daftar sumber beserta tanggal akses dan keterbatasannya, perbedaan antar sumber, dan ringkasan privasi. ${NOT_AFFILIATED}`,
  },
];

export const NOT_FOUND_META: Omit<RouteMeta, "path" | "label"> = {
  title: "Halaman tidak ditemukan — AyoDonor",
  description: `Halaman yang kamu cari tidak ada. Kembali ke beranda AyoDonor. ${NOT_AFFILIATED}`,
};

/** "/panduan/" and "/panduan.html" both mean "/panduan"; the root stays "/". Query and hash are dropped. */
export function normalizePath(raw: string): string {
  let p = raw.split(/[?#]/)[0] || "/";
  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
}

export function findRoute(path: string): RouteMeta | undefined {
  const p = normalizePath(path);
  return ROUTES.find((r) => r.path === p);
}

export function canonicalUrl(path: string): string {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}
