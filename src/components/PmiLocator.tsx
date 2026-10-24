import React, { useMemo, useState } from "react";
import SourceLinks from "./SourceLinks";
import { UTD_RECORDS, UTD_RETRIEVED_ON, type UtdRecord } from "../data/utd";
import { isValidCoordinates, sortByDistance, type LatLng } from "../lib/geo";
import { COARSE_ACCURACY_M, locate, type LocateFailure, type LocatedPosition } from "../lib/geolocation";

const PAGE_SIZE = 20;

type LocationState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; position: LocatedPosition }
  | { kind: "error"; reason: LocateFailure };

const ERROR_TEXT: Record<LocateFailure, { title: string; body: string }> = {
  denied: {
    title: "Izin lokasi ditolak",
    body: "Browser tidak memberi AyoDonor akses ke posisimu. Kamu bisa mengizinkannya di pengaturan situs browser lalu mencoba lagi, atau cukup pakai pencarian kota di atas.",
  },
  timeout: {
    title: "Posisi tidak ditemukan tepat waktu",
    body: "Browser tidak menjawab dalam 15 detik. Coba lagi, pindah ke tempat yang sinyalnya lebih baik, atau pakai pencarian kota.",
  },
  unavailable: {
    title: "Posisi tidak tersedia",
    body: "Perangkat atau browser tidak bisa menentukan posisimu saat ini (misalnya layanan lokasi mati). Coba lagi atau pakai pencarian kota.",
  },
  unsupported: {
    title: "Browser tidak mendukung lokasi",
    body: "Browser ini tidak menyediakan fitur lokasi. Pakai pencarian kota di atas.",
  },
  invalid: {
    title: "Browser memberi koordinat yang tidak valid",
    body: "Posisi yang diterima tidak masuk akal, jadi tidak dipakai. Coba lagi atau pakai pencarian kota.",
  },
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** A phone number the browser can dial as one link. Entries such as "(021) 906666/327711" hold two numbers and stay plain text. */
function dialHref(phone: string): string | null {
  const p = phone.trim();
  if (!/^\+?[\d\s()-]{6,}$/.test(p)) return null;
  return `tel:${p.replace(/[^\d+]/g, "")}`;
}

function mapsHref(unit: UtdRecord): string {
  // Only the unit's name and address are put in the link; the visitor's position never is.
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${unit.name}, ${unit.address}`)}`;
}

interface PmiLocatorProps {
  /** Records to search. Defaults to the PMI list; tests pass fixtures. */
  units?: UtdRecord[];
}

export default function PmiLocator({ units = UTD_RECORDS }: PmiLocatorProps) {
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [location, setLocation] = useState<LocationState>({ kind: "idle" });

  // Distances need valid coordinates on both sides. With no sourced coordinates in the data, the location button is not offered.
  const coordsOf = (u: UtdRecord): LatLng | null =>
    u.coordinates && isValidCoordinates(u.coordinates.lat, u.coordinates.lng) ? { lat: u.coordinates.lat, lng: u.coordinates.lng } : null;
  const measurableCount = useMemo(() => units.filter((u) => coordsOf(u) !== null).length, [units]);
  const canMeasure = measurableCount > 0;

  const provinces = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of units) counts.set(u.province, (counts.get(u.province) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "id"));
  }, [units]);

  const matches = useMemo(() => {
    const phrase = normalize(query);
    const tokens = phrase.split(" ").filter(Boolean);
    const found = units.filter((u) => {
      if (province && u.province !== province) return false;
      const haystack = normalize(`${u.name} ${u.province} ${u.address}`);
      return tokens.every((t) => haystack.includes(t));
    });
    if (!phrase) return found;
    // Relevance, so "jawa timur" lists Jawa Timur units before a Central Java address that merely says "sebelah timur".
    // 0: whole phrase in the name or province; 1: all words in the name or province; 2: words only found via the address.
    const rank = (u: UtdRecord) => {
      const head = normalize(`${u.name} ${u.province}`);
      if (head.includes(phrase)) return 0;
      return tokens.every((t) => head.includes(t)) ? 1 : 2;
    };
    return found
      .map((u, index) => ({ u, index, r: rank(u) }))
      .sort((x, y) => x.r - y.r || x.index - y.index)
      .map(({ u }) => u);
  }, [units, query, province]);

  const hasCriteria = query.trim() !== "" || province !== "";
  const position = location.kind === "ok" ? location.position : null;
  const showResults = hasCriteria || (position !== null && canMeasure);

  const rows = useMemo(() => {
    if (position && canMeasure) return sortByDistance(matches, position, coordsOf);
    return matches.map((item) => ({ item, km: null as number | null }));
  }, [matches, position, canMeasure]);

  const handleLocate = async () => {
    // Drop any earlier position first so a failure can never leave a stale one on screen.
    setLocation({ kind: "loading" });
    const result = await locate();
    setLocation("position" in result ? { kind: "ok", position: result.position } : { kind: "error", reason: result.reason });
    setVisible(PAGE_SIZE);
  };

  const onQuery = (value: string) => {
    setQuery(value);
    setVisible(PAGE_SIZE);
  };
  const onProvince = (value: string) => {
    setProvince(value);
    setVisible(PAGE_SIZE);
  };
  const reset = () => {
    setQuery("");
    setProvince("");
    setVisible(PAGE_SIZE);
  };

  const shown = rows.slice(0, visible);
  const measuredShown = rows.filter((r) => r.km !== null).length;

  return (
    <div id="pmi-locator" className="locator" role="group" aria-labelledby="locator-title">
      <h2 id="locator-title" className="chapter__title">
        Cari berdasarkan kota atau provinsi
      </h2>
      <p className="prose">
        Ketik nama kota, kabupaten, atau provinsi untuk melihat alamat dan telepon unit donor darah PMI (UDD/UTD) yang tercantum di situs resmi PMI.
      </p>

      <div className="callout callout--note">
        <p className="kicker">Asal data</p>
        <p>
          {units.length} unit, disalin apa adanya dari halaman Kontak PMI, diakses {UTD_RETRIEVED_ON}.{" "}
          <SourceLinks refs={[{ id: "pmi-kontak" }]} />
        </p>
        <p>
          Daftar ini bisa belum lengkap atau sudah berubah, dan halaman sumbernya tidak mencantumkan jam layanan. Hubungi unit untuk memastikan alamat dan jam layanan sebelum datang. Info resmi:{" "}
          <a href="https://ayodonor.pmi.or.id" target="_blank" rel="noopener noreferrer">
            ayodonor.pmi.or.id
          </a>
          .
        </p>
      </div>

      <div className="tool">
        <div className="locator__bar">
          <div className="field">
            <label htmlFor="pmi-search-input">Cari kota, kabupaten, atau nama unit</label>
            <input
              id="pmi-search-input"
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Contoh: Makassar, Sleman, Bandung"
              className="input"
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label htmlFor="pmi-province-select">Provinsi</label>
            <select id="pmi-province-select" value={province} onChange={(e) => onProvince(e.target.value)} className="input">
              <option value="">Semua provinsi</option>
              {provinces.map(([name, count]) => (
                <option key={name} value={name}>
                  {name} ({count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {canMeasure ? (
          <div className="locator__geo">
            <button id="btn-geolocate" type="button" onClick={handleLocate} disabled={location.kind === "loading"} className="btn btn--quiet">
              {location.kind === "loading" ? "Mencari posisimu..." : location.kind === "ok" ? "Perbarui posisiku" : "Gunakan posisiku"}
            </button>
            <p className="hint">
              Opsional. Browser akan meminta izinmu dulu. Posisimu hanya dipakai di browser ini dan tidak dikirim ke server mana pun.
            </p>
          </div>
        ) : (
          <p className="hint locator__geo">
            Jarak dari posisimu belum ditampilkan: daftar PMI tidak menyertakan koordinat unit, dan AyoDonor tidak memakai koordinat yang belum terverifikasi. Pencarian kota di atas tetap berlaku.
          </p>
        )}
      </div>

      {/* Location outcome: one distinct state at a time */}
      <div aria-live="polite">
        {location.kind === "loading" && (
          <div className="callout callout--note" role="status">
            <p>Menunggu browser menentukan posisimu...</p>
          </div>
        )}
        {location.kind === "ok" && (
          <div className="callout callout--note" role="status">
            <p className="kicker">Posisi diterima</p>
            <p>
              Daftar diurutkan menurut <strong>perkiraan</strong> jarak garis lurus dari posisimu, bukan jarak tempuh berkendara atau jalan kaki.
              {location.position.accuracyM !== null && (
                <> Browser melaporkan ketelitian sekitar {Math.round(location.position.accuracyM).toLocaleString("id-ID")} m.</>
              )}
            </p>
            {location.position.accuracyM !== null && location.position.accuracyM > COARSE_ACCURACY_M && (
              <p>Posisi ini kasar (biasanya dari jaringan atau IP), jadi urutan jarak bisa meleset jauh.</p>
            )}
            <p>
              Hanya {measurableCount} dari {units.length} unit yang punya koordinat bersumber; unit lain tidak ikut diurutkan, jadi urutan teratas belum tentu yang paling dekat.
            </p>
            <button type="button" className="linkbutton" onClick={() => setLocation({ kind: "idle" })}>
              Hapus posisi
            </button>
          </div>
        )}
      </div>
      {location.kind === "error" && (
        <div role="alert" className="callout callout--caution">
          <p className="kicker">{ERROR_TEXT[location.reason].title}</p>
          <p>{ERROR_TEXT[location.reason].body}</p>
          {location.reason !== "unsupported" && (
            <button type="button" className="btn btn--quiet" onClick={handleLocate}>
              Coba lagi
            </button>
          )}
        </div>
      )}

      {/* Results */}
      <div className="locator__results">
        {!showResults ? (
          <div className="callout callout--note" role="status">
            <p>Belum ada pencarian. Ketik nama kota atau pilih provinsi untuk menampilkan unit. Daftar ini berisi {units.length} unit di {provinces.length} wilayah menurut halaman sumber.</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="callout callout--note" role="status">
            <p className="kicker">Tidak ada hasil</p>
            <p>
              Tidak ada unit di daftar PMI yang cocok dengan{query.trim() ? <> &ldquo;{query.trim()}&rdquo;</> : ""}
              {province ? <> di {province}</> : ""}. Itu belum tentu berarti tidak ada unit di sana: daftar ini bisa belum lengkap.
            </p>
            <ul className="ruled">
              <li>Coba nama kota atau kabupaten lain, atau ejaan yang lebih singkat.</li>
              <li>
                Buka{" "}
                <a href="https://ayodonor.pmi.or.id/?page=kontak" target="_blank" rel="noopener noreferrer">
                  halaman Kontak PMI
                  <span className="sr-only"> (membuka tab baru)</span>
                </a>{" "}
                atau hubungi PMI setempat.
              </li>
            </ul>
            <button type="button" className="linkbutton" onClick={reset}>
              Hapus pencarian
            </button>
          </div>
        ) : (
          <>
            <p className="small muted" role="status">
              {matches.length} unit ditemukan
              {position && canMeasure ? `; ${measuredShown} punya koordinat sehingga jaraknya bisa diperkirakan` : ""}.
            </p>
            <ul className="loc-list" aria-label="Hasil pencarian UDD/UTD PMI">
              {shown.map(({ item: unit, km }) => {
                const dial = unit.phone ? dialHref(unit.phone) : null;
                return (
                  <li key={unit.no} className="loc">
                    <span className="loc__meta">{unit.province}</span>
                    <span className="loc__name">{unit.name}</span>
                    <dl className="loc__facts">
                      <div>
                        <dt>Alamat</dt>
                        <dd>{unit.address}</dd>
                      </div>
                      <div>
                        <dt>Telepon</dt>
                        <dd>
                          {unit.phone ? (
                            dial ? (
                              <a href={dial}>{unit.phone}</a>
                            ) : (
                              unit.phone
                            )
                          ) : (
                            "Tidak tercantum di sumber"
                          )}
                        </dd>
                      </div>
                    </dl>
                    {km !== null && <span className="loc__dist">Perkiraan jarak garis lurus: ≈ {km < 10 ? km.toFixed(1) : Math.round(km)} km</span>}
                    <div className="loc__links">
                      <a href={mapsHref(unit)} target="_blank" rel="noopener noreferrer">
                        Cari di Google Maps
                        <span className="sr-only"> untuk {unit.name} (membuka tab baru)</span>
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
            {rows.length > shown.length && (
              <p>
                <button type="button" className="btn btn--quiet" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  Tampilkan lebih banyak ({rows.length - shown.length} lagi)
                </button>
              </p>
            )}
          </>
        )}
      </div>

      <div className="callout callout--note">
        <p className="kicker">Stok darah</p>
        <p>
          AyoDonor tidak menampilkan stok darah. PMI menyatakan stok dapat berubah sewaktu-waktu dan menyarankan menghubungi UTD terkait.{" "}
          <SourceLinks refs={[{ id: "pmi-stok" }]} />
        </p>
      </div>
    </div>
  );
}
