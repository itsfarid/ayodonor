import SourceLinks from "./SourceLinks";

/** Three short, sourced facts. Shown on the home page and on the facts-and-myths page. */
export default function KeyFacts() {
  return (
    <section id="sekilas" className="glance" aria-labelledby="sekilas-title">
      <div className="wrap">
        <h2 id="sekilas-title" className="sr-only">
          Sekilas: tiga hal untuk diketahui
        </h2>
        <div className="glance__grid">
          <div className="glance__item">
            <p className="kicker">01</p>
            <h3>Kata pejabat Kemenkes: setidaknya 3 nyawa per kantong</h3>
            <p>Pernyataan dalam acara (2022), bukan hasil penelitian. Jumlah sebenarnya bergantung pada kebutuhan pasien.</p>
            <SourceLinks refs={[{ id: "kemkes-pers" }]} />
          </div>

          <div className="glance__item">
            <p className="kicker">02</p>
            <h3>Satu kantong bisa dipisah menjadi beberapa komponen</h3>
            <p>Satu kantong bisa dipisah untuk pasien berbeda.</p>
            <SourceLinks refs={[{ id: "who-safety" }, { id: "permenkes", locator: "hal. 53" }]} />
          </div>

          <div className="glance__item">
            <p className="kicker">03</p>
            <h3>Diperiksa petugas sebelum donor</h3>
            <p>Hb, tekanan darah, dan riwayat kesehatan dicek sebelum donor.</p>
            <SourceLinks refs={[{ id: "pmi-faq" }, { id: "permenkes", locator: "hal. 55-56" }]} />
          </div>
        </div>
      </div>
    </section>
  );
}
