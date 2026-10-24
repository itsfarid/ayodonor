import React, { useState, useEffect } from "react";

export type StockStatus = "Aman" | "Cukup" | "Kritis";
export const BLOOD_TYPES = ["A", "B", "O", "AB"] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

interface PmiLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  region: "Jawa" | "Sumatera" | "Sulawesi" | "Kalimantan" | "Lainnya";
  lat: number;
  lng: number;
  phone: string;
  status: string;
  stocks: Record<BloodType, StockStatus>;
}

// CATATAN: Data di bawah ini adalah CONTOH untuk demo. Nama unit, alamat, telepon, jam layanan,
// koordinat, dan terutama status stok BELUM diverifikasi dan stok bersifat fiktif. Belum terhubung
// ke sistem data PMI resmi. Jangan dipakai untuk keputusan donor.
// Upaya verifikasi per lokasi pada 24 Oktober 2026 tidak berhasil memastikan satu pun alamat, telepon, atau
// jam layanan dari sumber resmi (lihat docs/medical-claims.md, bagian 5); label "demo" harus dipertahankan.
export const INITIAL_PMI_DATA: PmiLocation[] = [
  {
    id: "pmi-jkt",
    name: "UTD PMI DKI Jakarta",
    address: "Jl. Kramat Raya No.47, Senen, Jakarta Pusat",
    city: "Jakarta Pusat",
    region: "Jawa",
    lat: -6.1844,
    lng: 106.8444,
    phone: "(021) 3906350",
    status: "Jam layanan: belum diverifikasi",
    stocks: { A: "Aman", B: "Aman", O: "Aman", AB: "Kritis" }
  },
  {
    id: "pmi-bdg",
    name: "UDD PMI Kota Bandung",
    address: "Jl. Aceh No.79, Cihapit, Bandung",
    city: "Bandung",
    region: "Jawa",
    lat: -6.9103,
    lng: 107.6186,
    phone: "(022) 4207052",
    status: "Jam layanan: belum diverifikasi",
    stocks: { A: "Cukup", B: "Aman", O: "Aman", AB: "Kritis" }
  },
  {
    id: "pmi-sby",
    name: "UTD PMI Kota Surabaya",
    address: "Jl. Embong Ploso No.7-15, Genteng, Surabaya",
    city: "Surabaya",
    region: "Jawa",
    lat: -7.2651,
    lng: 112.7423,
    phone: "(031) 5313555",
    status: "Jam layanan: belum diverifikasi",
    stocks: { A: "Aman", B: "Kritis", O: "Aman", AB: "Aman" }
  },
  {
    id: "pmi-yk",
    name: "UTD PMI Kota Yogyakarta",
    address: "Jl. Tegalgendu No.25, Kotagede, Yogyakarta",
    city: "Yogyakarta",
    region: "Jawa",
    lat: -7.8242,
    lng: 110.3956,
    phone: "(0274) 372176",
    status: "Jam layanan: belum diverifikasi",
    stocks: { A: "Kritis", B: "Aman", O: "Aman", AB: "Cukup" }
  },
  {
    id: "pmi-smg",
    name: "UTD PMI Kota Semarang",
    address: "Jl. Sugiopranoto No.31, Bulustalan, Semarang",
    city: "Semarang",
    region: "Jawa",
    lat: -6.9829,
    lng: 110.4092,
    phone: "(024) 3515050",
    status: "Jam layanan: belum diverifikasi",
    stocks: { A: "Aman", B: "Aman", O: "Kritis", AB: "Aman" }
  },
  {
    id: "pmi-mdn",
    name: "UTD PMI Kota Medan",
    address: "Jl. Palang Merah No.17, A U R, Medan Maimun, Medan",
    city: "Medan",
    region: "Sumatera",
    lat: 3.5824,
    lng: 98.6791,
    phone: "(061) 4567232",
    status: "Jam layanan: belum diverifikasi",
    stocks: { A: "Kritis", B: "Aman", O: "Aman", AB: "Kritis" }
  },
  {
    id: "pmi-mks",
    name: "UTD PMI Kota Makassar",
    address: "Jl. Kandea No.16, Bontoala Baru, Makassar",
    city: "Makassar",
    region: "Sulawesi",
    lat: -5.1278,
    lng: 119.4215,
    phone: "(0411) 3612502",
    status: "Jam layanan: belum diverifikasi",
    stocks: { A: "Aman", B: "Kritis", O: "Aman", AB: "Aman" }
  }
];

// Helper to calculate straight-line distance in km using the Haversine formula (not a driving route)
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function PmiLocator() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<PmiLocation | null>(INITIAL_PMI_DATA[0]);

  // Directly derive filtered and sorted locations using useMemo for bulletproof live reactive updates!
  const filteredLocations = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let result = INITIAL_PMI_DATA;

    if (query) {
      result = INITIAL_PMI_DATA.filter((p) => {
        return (
          p.name.toLowerCase().includes(query) ||
          p.address.toLowerCase().includes(query) ||
          p.city.toLowerCase().includes(query)
        );
      });
    }

    if (userLocation) {
      result = [...result].sort((a, b) => {
        const distA = getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const distB = getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return distA - distB;
      });
    }

    return result;
  }, [searchQuery, userLocation]);

  // Straight-line distance to the closest demo location, used to warn when none is actually nearby.
  const nearestDemoKm = React.useMemo(() => {
    if (!userLocation) return null;
    return Math.min(...INITIAL_PMI_DATA.map((p) => getDistanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng)));
  }, [userLocation]);

  // Keep selectedLocation up to date with search changes
  useEffect(() => {
    if (filteredLocations.length > 0) {
      // If no valid selected location is active, fallback to the first item matching query
      if (!selectedLocation || !filteredLocations.some((f) => f.id === selectedLocation.id)) {
        setSelectedLocation(filteredLocations[0]);
      }
    } else {
      setSelectedLocation(null);
    }
  }, [filteredLocations, selectedLocation]);

  // Request high precision geolocation
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocateError("Oops, browsermu tidak mendukung fitur lokalisasi GPS.");
      return;
    }

    setIsLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords);
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error", error);
        let errorMsg = "Pencarian GPS gagal. Pastikan izin lokasi diaktifkan di browsermu.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Akses lokasi ditolak. Silakan beri izin lokasi di browser kamu.";
        }
        setLocateError(errorMsg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Coordinates for the rough latitude/longitude diagram (not a map): Indonesia spans about lng 95-141, lat -11 to 6.
  const getMapCoords = (lat: number, lng: number) => {
    const minLng = 95;
    const maxLng = 141;
    const minLat = -11;
    const maxLat = 6;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    // Latitude is inverted in screen coordinates
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;

    return { x: `${Math.max(5, Math.min(95, x))}%`, y: `${Math.max(8, Math.min(92, y))}%` };
  };

  const routeUrl = (pmi: PmiLocation) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pmi.name + ", " + pmi.address)}`;

  return (
    <div id="pmi-locator" className="locator" role="group" aria-labelledby="locator-title">
      <h3 id="locator-title" className="chapter__title">
        Contoh daftar lokasi UTD PMI
      </h3>

      <div className="callout callout--caution">
        <p className="kicker">Data demo · belum terverifikasi</p>
        <p>
          Daftar ini hanya memuat {INITIAL_PMI_DATA.length} kota sebagai contoh tampilan. Nama unit, alamat, telepon, jam layanan, dan status stok <strong>belum diverifikasi</strong> sebagai data resmi.
        </p>
        <p>
          Untuk lokasi, jam layanan, dan stok darah yang resmi, buka{" "}
          <a href="https://ayodonor.pmi.or.id" target="_blank" rel="noopener noreferrer">
            ayodonor.pmi.or.id
          </a>{" "}
          atau hubungi UTD PMI setempat.
        </p>
      </div>

      <div className="locator__bar">
        <div className="field">
          <label htmlFor="pmi-search-input">Cari lokasi PMI</label>
          <input
            id="pmi-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kota, jalan, atau nama UDD PMI"
            className="input"
            autoComplete="off"
          />
        </div>

        <button id="btn-geolocate" onClick={handleDetectLocation} disabled={isLocating} className="btn btn--quiet">
          {isLocating ? "Mencari lokasi..." : userLocation ? "Diurutkan dari posisimu" : "Urutkan contoh lokasi dari posisiku"}
        </button>
      </div>

      {locateError && (
        <div role="alert" className="callout callout--caution">
          <p>{locateError}</p>
        </div>
      )}

      {userLocation && nearestDemoKm !== null && nearestDemoKm > 100 && (
        <div role="alert" className="callout callout--caution">
          <p>
            Contoh lokasi terdekat berjarak sekitar {Math.round(nearestDemoKm).toLocaleString("id-ID")} km dari posisimu. Daftar demo ini hanya memuat {INITIAL_PMI_DATA.length} kota, jadi belum tentu ada unit PMI contoh di dekatmu. Cari UTD terdekat lewat ayodonor.pmi.or.id.
          </p>
        </div>
      )}

      {userLocation && (
        <div className="callout callout--note">
          <p>
            Daftar diurutkan menurut perkiraan jarak garis lurus dari posisimu (bukan rute). Lokasimu hanya diproses di browser dan tidak dikirim ke server.
          </p>
          <button onClick={() => setUserLocation(null)} className="linkbutton">
            Hapus lokasi
          </button>
        </div>
      )}

      <div className="locator__cols">
        <div>
          <p className="small muted" role="status">
            {filteredLocations.length === 0 ? "Tidak ada contoh lokasi yang cocok." : `${filteredLocations.length} contoh lokasi`}
          </p>

          {filteredLocations.length === 0 ? (
            <div className="callout callout--note">
              <p>Coba kata kunci kota atau jalan lain. Untuk lokasi resmi, buka ayodonor.pmi.or.id.</p>
            </div>
          ) : (
            <ul className="loc-list">
              {filteredLocations.map((pmi) => {
                const distance = userLocation ? getDistanceKm(userLocation.lat, userLocation.lng, pmi.lat, pmi.lng) : null;
                const isSelected = selectedLocation?.id === pmi.id;

                return (
                  <li key={pmi.id} className="loc" data-selected={isSelected}>
                    <button
                      type="button"
                      className="loc__select"
                      aria-pressed={isSelected}
                      aria-label={`Pilih ${pmi.name}`}
                      onClick={() => setSelectedLocation(pmi)}
                    >
                      <span className="loc__meta">
                        {pmi.region} · {pmi.city}
                      </span>
                      <span className="loc__name">{pmi.name}</span>
                      <span className="loc__addr">{pmi.address}</span>
                    </button>

                    {distance !== null && <span className="loc__dist">≈ {distance.toFixed(1)} km (garis lurus)</span>}

                    <p className="loc__stock">
                      Contoh status stok (fiktif):{" "}
                      {BLOOD_TYPES.map((type, i) => (
                        <span key={type} data-blood-type={type} data-status={pmi.stocks[type]}>
                          {i > 0 && " · "}
                          {type} {pmi.stocks[type]}
                        </span>
                      ))}
                    </p>

                    <div className="loc__links">
                      <a href={`tel:${pmi.phone.replace(/[() ]/g, "")}`}>{pmi.phone}</a>
                      <a href={routeUrl(pmi)} target="_blank" rel="noopener noreferrer">
                        Petunjuk arah
                        <span className="sr-only"> ke {pmi.name} (membuka tab baru)</span>
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="locator__detail">
          <p className="kicker kicker--plain">Diagram posisi kasar (lintang-bujur), bukan peta</p>
          <div className="schematic">
            {userLocation && (
              <div
                className="pin pin--you"
                role="img"
                aria-label="Posisimu (perkiraan)"
                style={{ left: getMapCoords(userLocation.lat, userLocation.lng).x, top: getMapCoords(userLocation.lat, userLocation.lng).y }}
              >
                <span className="pin-label">Kamu</span>
              </div>
            )}

            {filteredLocations.map((pmi) => {
              const isSelected = selectedLocation?.id === pmi.id;
              const coords = getMapCoords(pmi.lat, pmi.lng);
              return (
                <button
                  key={pmi.id}
                  type="button"
                  className="pin"
                  aria-pressed={isSelected}
                  aria-label={`Pilih lokasi ${pmi.name}`}
                  onClick={() => setSelectedLocation(pmi)}
                  style={{ left: coords.x, top: coords.y, zIndex: isSelected ? 2 : 1 }}
                >
                  {isSelected && <span className="pin-label">{pmi.city}</span>}
                </button>
              );
            })}
          </div>

          {selectedLocation && (
            <div className="detail">
              <p className="kicker kicker--plain">Lokasi terpilih</p>
              <h4 className="loc__name">{selectedLocation.name}</h4>
              <p className="small" style={{ margin: "var(--s-1) 0 0" }}>
                {selectedLocation.address}
              </p>

              <dl>
                <div>
                  <dt>Jam layanan</dt>
                  <dd>{selectedLocation.status}</dd>
                </div>
                <div>
                  <dt>Telepon (belum diverifikasi)</dt>
                  <dd>{selectedLocation.phone}</dd>
                </div>
                <div>
                  <dt>Wilayah</dt>
                  <dd>{selectedLocation.region}</dd>
                </div>
              </dl>

              <p style={{ margin: 0 }}>
                <a href={routeUrl(selectedLocation)} target="_blank" rel="noopener noreferrer" className="btn btn--quiet">
                  Buka rute
                  <span className="sr-only"> ke {selectedLocation.name} (membuka tab baru)</span>
                </a>
              </p>

              <div style={{ marginTop: "var(--s-4)" }}>
                <p className="small" style={{ margin: 0 }}>
                  <strong>Contoh status stok (fiktif)</strong> <span className="demo-tag">Ilustrasi demo</span>
                </p>
                <div className="stock-grid">
                  {BLOOD_TYPES.map((type) => {
                    const status = selectedLocation.stocks[type];
                    return (
                      <div key={type} data-blood-type={type} data-status={status}>
                        <span className="type">Gol {type}</span>
                        <span className="state">{status}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="small muted" style={{ margin: 0 }}>
                  Status stok fiktif untuk ilustrasi. Jangan dipakai untuk keputusan donor; cek stok resmi di ayodonor.pmi.or.id.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
