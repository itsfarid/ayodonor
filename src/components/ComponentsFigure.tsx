import SourceLinks from "./SourceLinks";

// Original schematic: one whole-blood bag processed into the three components named in the cited sources
// (red cells / PRC, plasma / FFP, platelets / TC). Not to scale and not a medical diagram of any real product.
export default function ComponentsFigure() {
  return (
    <figure className="figure">
      <svg viewBox="0 0 400 392" role="img" aria-labelledby="fig-title fig-desc" focusable="false">
        <title id="fig-title">Skema: darah lengkap dipisah menjadi tiga komponen</title>
        <desc id="fig-desc">
          Sebuah kantong darah lengkap berisi sekitar 350 atau 450 mL. Selang dari kantong itu bercabang ke tiga kantong komponen: sel darah merah (PRC), plasma (FFP), dan trombosit (TC).
        </desc>
        <defs>
          <clipPath id="fig-bag-clip">
            <rect x="110" y="34" width="180" height="146" rx="14" />
          </clipPath>
        </defs>

        {/* Whole-blood bag: hanger tab, outline, blood fill */}
        <rect x="172" y="10" width="56" height="30" rx="7" fill="none" stroke="#231E1C" strokeWidth="2" />
        <circle cx="200" cy="25" r="5" fill="#F8F4ED" stroke="#231E1C" strokeWidth="2" />
        <rect x="110" y="34" width="180" height="146" rx="14" fill="#FFFDF9" />
        <g clipPath="url(#fig-bag-clip)">
          <rect x="110" y="72" width="180" height="110" fill="#8A1830" />
        </g>
        <line x1="110" y1="72" x2="290" y2="72" stroke="#231E1C" strokeWidth="1" strokeDasharray="4 3" />
        <rect x="110" y="34" width="180" height="146" rx="14" fill="none" stroke="#231E1C" strokeWidth="2" />
        <text x="200" y="124" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="19" fontWeight="700" fill="#fff">
          Darah lengkap
        </text>
        <text x="200" y="150" textAnchor="middle" fontFamily="ui-monospace, Menlo, Consolas, monospace" fontSize="14" fill="#fff">
          350 atau 450 mL
        </text>

        {/* Tubing: one line from the bag that forks to three component bags */}
        <g fill="none" stroke="#231E1C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M200 180 V222" />
          <path d="M200 222 L70 262" />
          <path d="M200 222 V262" />
          <path d="M200 222 L330 262" />
        </g>
        <text x="214" y="210" fontFamily="ui-monospace, Menlo, Consolas, monospace" fontSize="14" fill="#1D5360">
          dipisah
        </text>

        {/* Component bags */}
        <g stroke="#231E1C" strokeWidth="2">
          <rect x="15" y="262" width="110" height="110" rx="12" fill="#8A1830" />
          <rect x="145" y="262" width="110" height="110" rx="12" fill="#E0B84A" />
          <rect x="275" y="262" width="110" height="110" rx="12" fill="#F0E0A0" />
        </g>
        <g fontFamily="ui-monospace, Menlo, Consolas, monospace" fontSize="24" fontWeight="700" textAnchor="middle">
          <text x="70" y="326" fill="#fff">
            PRC
          </text>
          <text x="200" y="326" fill="#231E1C">
            FFP
          </text>
          <text x="330" y="326" fill="#231E1C">
            TC
          </text>
        </g>
      </svg>

      <figcaption>
        <ul className="legend">
          <li>
            <span className="swatch swatch--prc" aria-hidden="true" />
            <span>
              <strong>PRC</strong>: sel darah merah
            </span>
          </li>
          <li>
            <span className="swatch swatch--ffp" aria-hidden="true" />
            <span>
              <strong>FFP</strong>: plasma
            </span>
          </li>
          <li>
            <span className="swatch swatch--tc" aria-hidden="true" />
            <span>
              <strong>TC</strong>: trombosit
            </span>
          </li>
        </ul>
        <p style={{ margin: 0 }}>
          Skema sederhana, tidak berskala. Darah lengkap dapat diolah menjadi komponen darah sehingga satu donasi dapat melayani lebih dari satu pasien. Komponen mana yang diberikan kepada pasien diputuskan dokter sesuai kebutuhan medisnya.{" "}
          <SourceLinks refs={[{ id: "who-safety" }, { id: "permenkes", locator: "hal. 54" }]} />
        </p>
      </figcaption>
    </figure>
  );
}
