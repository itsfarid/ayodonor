import React, { useState, useEffect } from "react";
import { MapPin, Navigation, Phone, Search, Compass, Locate, Activity, Clock, Sliders, Check, HelpCircle } from "lucide-react";

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
  stocks: {
    A: "Aman" | "Cukup" | "Kritis";
    B: "Aman" | "Cukup" | "Kritis";
    O: "Aman" | "Cukup" | "Kritis";
    AB: "Aman" | "Cukup" | "Kritis";
  };
}

const INITIAL_PMI_DATA: PmiLocation[] = [
  {
    id: "pmi-jkt",
    name: "UTD PMI DKI Jakarta",
    address: "Jl. Kramat Raya No.47, Senen, Jakarta Pusat",
    city: "Jakarta Pusat",
    region: "Jawa",
    lat: -6.1844,
    lng: 106.8444,
    phone: "(021) 3906350",
    status: "Buka 24 Jam ⏰",
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
    status: "Buka 24 Jam ⏰",
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
    status: "Buka 24 Jam ⏰",
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
    status: "Buka 24 Jam ⏰",
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
    status: "Buka 24 Jam ⏰",
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
    status: "Buka 24 Jam ⏰",
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
    status: "Buka 24 Jam ⏰",
    stocks: { A: "Aman", B: "Kritis", O: "Aman", AB: "Aman" }
  }
];

// Helper to calculate distance in km using Haversine formula
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  const [animateRadar, setAnimateRadar] = useState(false);

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
    setAnimateRadar(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords);
        setIsLocating(false);
        setTimeout(() => setAnimateRadar(false), 2500);
      },
      (error) => {
        console.error("Geolocation error", error);
        let errorMsg = "Pencarian GPS gagal. Pastikan izin lokasi diaktifkan di browsermu.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Akses lokasi ditolak. Silakan beri izin lokasi di browser kamu.";
        }
        setLocateError(errorMsg);
        setIsLocating(false);
        setAnimateRadar(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Get localized stocks style
  const getStockBadgeColor = (status: "Aman" | "Cukup" | "Kritis") => {
    switch (status) {
      case "Aman":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Cukup":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Kritis":
        return "bg-rose-100 text-rose-800 border-rose-200 text-rose-700 animate-pulse";
    }
  };

  // Coordinates used to render the stylized coordinates map
  // Mini map visualization coordinates calculated based on Indonesian central perspective bounds
  const getMapCoords = (lat: number, lng: number) => {
    // Relative positioning to fit inside a nice 100% responsive SVG container representing Indonesia coordinates
    // Indonesia bounds roughly: Lng 95 to 141, Lat -11 to 6
    const minLng = 95;
    const maxLng = 141;
    const minLat = -11;
    const maxLat = 6;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    // Latitude is inverted in SVG coordinates
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;

    return { x: `${Math.max(5, Math.min(95, x))}%`, y: `${Math.max(5, Math.min(95, y))}%` };
  };

  return (
    <section id="pmi-locator" className="max-w-6xl mx-auto w-full px-4 py-8 relative transition-all">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-bold px-4 py-1.5 rounded-full mb-3 uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5 animate-spin" />
          PMI Sentinel Map Locator
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
          Cari Unit PMI & Cek Stok Darah 📍
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto mt-2 text-sm">
          Deteksi PMI terdekat dari posisimu untuk mendonorkan darah secara langsung. Lengkap dengan taksiran jarak real-time & peta taktis interaktif!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* LEFT COLUMN: FILTERS & CARD LISTING (Lg: 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* SEARCH & GEOLOCATE CONTROL BAR */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="pmi-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Kota, Jalan, atau Nama UDD PMI..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:outline-none text-sm placeholder-slate-400 bg-slate-50/50"
              />
            </div>

            <button
              id="btn-geolocate"
              onClick={handleDetectLocation}
              disabled={isLocating}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 outline-none cursor-pointer ${
                userLocation 
                  ? "bg-slate-900 text-emerald-400 border border-slate-800" 
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              <Locate className={`w-4 h-4 ${isLocating ? "animate-spin" : ""}`} />
              {isLocating ? "Menghubungi GPS..." : userLocation ? "Lokasimu Siaga! ✅" : "Cari PMI Terdekat Saya"}
            </button>
          </div>

          {/* STATUS NOTIFICATION ACCENTS */}
          {locateError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 leading-relaxed font-semibold flex gap-2 items-start">
              <span className="text-sm">⚠️</span> {locateError}
            </div>
          )}

          {userLocation && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 leading-relaxed font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-heartbeat" />
                Peta disortir otomatis berdasarkan jarak terdekat dari koordinat fisikmu!
              </span>
              <button
                onClick={() => setUserLocation(null)}
                className="text-[10px] uppercase font-mono text-slate-400 hover:text-red-650 tracking-wider font-extrabold"
              >
                Reset GPS ✖
              </button>
            </div>
          )}

          {/* CARDS LIST CONTAINER */}
          <div className="flex-1 overflow-y-auto pr-1 max-h-[500px] space-y-3.5">
            {filteredLocations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center">
                <HelpCircle className="w-12 h-12 text-slate-350 animate-bounce mb-3" />
                <h4 className="font-extrabold text-slate-800 text-sm">Tidak Menemukan Satupun PMI</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">Coba ketik kata kunci kota lain atau jalan terdekat ya, sob!</p>
              </div>
            ) : (
              filteredLocations.map((pmi) => {
                const distance = userLocation 
                  ? getDistanceKm(userLocation.lat, userLocation.lng, pmi.lat, pmi.lng) 
                  : null;
                const isSelected = selectedLocation?.id === pmi.id;

                return (
                  <div
                    key={pmi.id}
                    onClick={() => setSelectedLocation(pmi)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected 
                        ? "bg-white border-red-500 shadow-md ring-1 ring-red-500/30" 
                        : "bg-white border-slate-150 hover:border-slate-300 shadow-xs"
                    }`}
                  >
                    {/* Selected Left Ribbon */}
                    {isSelected && (
                      <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-red-600" />
                    )}

                    {/* Proximity Tag Indicator */}
                    {distance !== null && (
                      <span className="absolute top-3.5 right-4 bg-emerald-100 text-emerald-800 text-[10.5px] font-mono font-bold px-2 rounded-full border border-emerald-200">
                        ⚡ {distance.toFixed(1)} km dari kamu
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                          {pmi.region} • {pmi.city}
                        </span>
                        
                        <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5 mt-0.5 group-hover:text-red-600 transition-colors">
                          <MapPin className={`w-4 h-4 shrink-0 ${isSelected ? "text-red-600 animate-bounce" : "text-slate-450"}`} />
                          {pmi.name}
                        </h4>

                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed pr-6">
                          {pmi.address}
                        </p>

                        {/* Blood Stocks Sub-Grid */}
                        <div className="mt-4 pt-3.5 border-t border-dashed border-slate-100">
                          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-2">
                            🔴 Live Stock Darah PMI:
                          </span>
                          <div className="grid grid-cols-4 gap-2">
                            {Object.entries(pmi.stocks).map(([type, status]) => (
                              <div
                                key={type}
                                className={`text-center py-1.5 px-2 rounded-xl border text-xs font-bold flex flex-col justify-center items-center gap-0.5 ${getStockBadgeColor(status as "Aman" | "Cukup" | "Kritis")}`}
                              >
                                <span className="text-[10.5px] text-slate-500">Gol {type}</span>
                                <span className="text-[11px] font-black uppercase text-slate-900 tracking-wider">
                                  {status === "Aman" ? "Aman 🟢" : status === "Cukup" ? "Cukup 🟡" : "Kritis 🔴"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Contacts & Quick Redirect Triggers */}
                        <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                          <a
                            href={`tel:${pmi.phone.replace(/[() ]/g, "")}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-1.5 px-3 rounded-xl transition-all"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {pmi.phone}
                          </a>

                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pmi.name + ", " + pmi.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-1.5 px-3.5 rounded-xl transition-all border border-red-100"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            Petunjuk Arah Jalan 🧭
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH-TECH TACTICAL INDIAN OCEAN MAP TRACKER (Lg: 5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-2xl flex flex-col flex-1 relative overflow-hidden min-h-[460px]">
            
            {/* Grid Mesh Backdrops */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-25" />
            
            {/* Radar Scope Header */}
            <div className="relative z-10 flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs font-mono font-bold tracking-wider text-slate-400">
                  TACTICAL BLOOD MAP RADAR
                </span>
              </span>
              
              <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                SENTINEL-v26 ACTIVE
              </span>
            </div>

            {/* INTERACTIVE COORDINATE MAP BODY */}
            <div className="relative flex-1 bg-slate-950/80 border border-slate-800/80 rounded-2xl overflow-hidden flex items-center justify-center p-4">
              
              {/* RADAR SWEEP SCANNER ANIMATION */}
              {animateRadar && (
                <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                  <div className="w-full h-full border border-red-500/20 rounded-full animate-ping opacity-35 scale-150" />
                  <div className="absolute w-[350px] h-[350px] border border-emerald-400/15 rounded-full animate-pulse flex items-center justify-center">
                    <div className="w-56 h-56 border border-emerald-400/20 rounded-full flex items-center justify-center">
                      <div className="w-28 h-28 border border-emerald-400/30 rounded-full" />
                    </div>
                  </div>
                  {/* Glowing Radar Scanning line */}
                  <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-gradient-to-r from-emerald-500/50 to-transparent origin-left rotate-0 animate-radar-sweep" style={{ transformOrigin: "0 0" }} />
                </div>
              )}

              {/* INDONESIA vector-styled grid plane */}
              <div className="w-full h-full relative flex items-center justify-center py-6">
                
                {/* Visual Mock outline of Indonesian Island clusters inside coordinates */}
                <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 opacity-15 pointer-events-none text-slate-700">
                  {/* Sumatera */}
                  <path d="M 5,20 L 25,45 L 30,40 L 10,15 Z" fill="currentColor" />
                  {/* Jawa */}
                  <path d="M 20,55 L 48,58 L 52,56 L 22,53 Z" fill="currentColor" />
                  {/* Kalimantan */}
                  <path d="M 33,22 L 48,22 L 48,38 L 33,38 Z" fill="currentColor" />
                  {/* Sulawesi */}
                  <path d="M 52,28 L 58,25 L 58,35 L 56,35 L 52,38 Z" fill="currentColor" />
                  {/* Bali & Nusa Tenggara */}
                  <path d="M 49,58 Q 55,59 60,60" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>

                {/* Grid guidelines */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] border-l border-dashed border-slate-800/60 pointer-events-none" />
                <div className="absolute top-1/2 left-0 right-0 h-[1px] border-t border-dashed border-slate-800/60 pointer-events-none" />

                {/* GEOLOCATION USER EMBLEM PIN */}
                {userLocation && (
                  <div
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
                    style={{
                      left: getMapCoords(userLocation.lat, userLocation.lng).x,
                      top: getMapCoords(userLocation.lat, userLocation.lng).y
                    }}
                  >
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-500 opacity-40"></span>
                      <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                      <div className="absolute top-5 bg-blue-600 font-bold text-[8.5px] uppercase text-white font-mono rounded px-1.5 py-0.5 tracking-wider shadow whitespace-nowrap">
                        Lokasimu 🛰️
                      </div>
                    </div>
                  </div>
                )}

                {/* PMI MARKERS DYNAMIC PINS */}
                {filteredLocations.map((pmi) => {
                  const isSelected = selectedLocation?.id === pmi.id;
                  const coords = getMapCoords(pmi.lat, pmi.lng);

                  return (
                    <button
                      key={pmi.id}
                      onClick={() => setSelectedLocation(pmi)}
                      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all focus:outline-none focus:ring-0 group"
                      style={{
                        left: coords.x,
                        top: coords.y
                      }}
                    >
                      <div className="relative flex flex-col items-center">
                        {/* Selected halo */}
                        {isSelected && (
                          <span className="absolute -inset-1.5 bg-red-500/25 border border-red-500/50 rounded-full animate-ping" />
                        )}
                        
                        <div className={`p-1.5 rounded-full border transition-all shadow-md relative ${
                          isSelected
                            ? "bg-red-500 border-white text-white scale-125 z-20"
                            : "bg-slate-800 border-slate-700 text-slate-350 hover:bg-slate-700 hover:text-white"
                        }`}>
                          <MapPin className="w-3.5 h-3.5 fill-current" />
                        </div>

                        {/* Interactive marker info balloon snippet */}
                        <div className={`absolute bottom-7 bg-slate-900 border text-[9.5px] font-extrabold uppercase rounded px-2 py-1 tracking-wider shadow-xl whitespace-nowrap flex items-center gap-1.5 transition-all w-max ${
                          isSelected 
                            ? "opacity-100 translate-y-0 text-white border-red-500 scale-102" 
                            : "opacity-0 translate-y-1 hover:opacity-100 hover:translate-y-0 text-slate-400 border-slate-800 scale-95 pointer-events-none group-hover:opacity-100"
                        }`}>
                          <span>{pmi.city}</span>
                          <span className="w-1 h-3 bg-red-500 rounded" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Coordinates details display bottom watermarks */}
              <div className="absolute bottom-2.5 right-3 font-mono text-[9.5px] text-slate-500 leading-none select-none">
                GRID FOCUS OVERLAY: EPSG:4326 (WGS 84)
              </div>
              <div className="absolute bottom-2.5 left-3 font-mono text-[9.5px] text-slate-500 leading-none select-none">
                Lat: -6.0° S / Lng: 106.8° E
              </div>
            </div>

            {/* DETAILED INFO BOX ABOUT SELECTED COMPONENT */}
            {selectedLocation && (
              <div className="relative z-10 bg-slate-950 border border-slate-800/80 rounded-2xl p-4 mt-4 text-left transition-all">
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">
                      SETERU PIN TERPILIH (PETA):
                    </span>
                    <h5 className="font-extrabold text-white text-sm">
                      {selectedLocation.name}
                    </h5>
                  </div>
                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    {selectedLocation.status}
                  </span>
                </div>
                
                <p className="text-slate-400 text-xs leading-relaxed">
                  {selectedLocation.address}
                </p>

                <div className="mt-3 bg-white/5 rounded-xl p-3 flex justify-between items-center border border-white/5">
                  <div className="flex gap-4">
                    <div>
                      <span className="text-[9px] uppercase font-mono text-slate-500 block">KONTAK RESMI:</span>
                      <strong className="text-slate-200 text-xs font-bold font-mono">{selectedLocation.phone}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono text-slate-500 block">WILAYAH (PROV):</span>
                      <strong className="text-slate-200 text-xs font-bold font-mono">{selectedLocation.region}</strong>
                    </div>
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedLocation.name + ", " + selectedLocation.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                  >
                    Buka Rute 🧭
                  </a>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </section>
  );
}
