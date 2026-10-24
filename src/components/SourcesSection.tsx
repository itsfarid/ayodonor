import { CRITERIA_COMPARISON, SOURCES, type SourceKind } from "../data/sources";

// Order and one-line explanation for each kind of source, so readers can tell regulation from guidance from
// press statements. AyoDonor's own explanations are not sources and are labelled as such elsewhere.
const KIND_ORDER: { kind: SourceKind; note: string }[] = [
  { kind: "Regulasi Indonesia", note: "Dasar hukum standar pelayanan transfusi darah di Indonesia." },
  { kind: "Panduan praktis PMI", note: "Panduan dari PMI. Tidak selalu bertanggal, dan angkanya bisa berbeda dari regulasi." },
  { kind: "Pedoman internasional", note: "Pedoman umum WHO. Angkanya bervariasi antar negara dan bukan aturan Indonesia." },
  { kind: "Artikel edukasi Kemenkes", note: "Artikel rumah sakit di situs Kemenkes. Dipakai sebagai pembanding, bukan standar." },
  { kind: "Siaran pers Kemenkes", note: "Pernyataan pejabat dalam acara, bukan standar atau penelitian." },
];

export default function SourcesSection() {
  // Running number across groups so a source keeps one number wherever it is listed.
  const numbered = KIND_ORDER.flatMap(({ kind }) => SOURCES.filter((s) => s.kind === kind));
  const numberOf = (id: string) => numbered.findIndex((s) => s.id === id) + 1;

  return (
    <section id="sumber-informasi" aria-labelledby="sumber-title" className="section">
      <div className="wrap section__inner">
        <div className="section__head">
          <p className="kicker">05 · Rujukan</p>
          <h2 id="sumber-title">Sumber informasi</h2>
          <p className="deck">Daftar rujukan menurut jenisnya, perbedaan antar sumber, dan batas masing-masing.</p>
        </div>

        <div className="section__body">
          <div className="prose">
            <p>
              Rujukan regulasi Indonesia adalah Permenkes No. 91 Tahun 2015. WHO dipakai sebagai pedoman umum internasional, dan PMI
              untuk panduan praktis. Semua sumber di bawah dibuka dan dibaca pada tanggal akses yang tertera. Keputusan kelayakan:
              petugas UTD yang memutuskan saat pemeriksaan langsung.
            </p>
            <p className="small muted">
              Penjelasan di situs ini ditulis AyoDonor sendiri berdasarkan sumber-sumber di bawah. Penjelasan itu bukan sumber;
              tautan sumber diletakkan di dekat klaim yang didukungnya.
            </p>
          </div>

          {KIND_ORDER.map(({ kind, note }) => {
            const group = SOURCES.filter((s) => s.kind === kind);
            if (group.length === 0) return null;
            return (
              <div key={kind} className="refs-group">
                <h3>{kind}</h3>
                <p>{note}</p>
                <ol className="refs-list">
                  {group.map((s) => (
                    <li key={s.id} id={`sumber-${s.id}`} className="ref">
                      <span className="ref__no" aria-hidden="true">
                        [{numberOf(s.id)}]
                      </span>
                      <div>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="ref__title">
                          {s.title}
                          <span className="sr-only"> (membuka tab baru)</span>
                        </a>
                        <p className="ref__meta">
                          {s.publisher} · Terbit: {s.published}
                        </p>
                        <dl>
                          <div>
                            <dt>Diakses</dt>
                            <dd>{s.accessed}</dd>
                          </div>
                          <div>
                            <dt>Dipakai untuk</dt>
                            <dd>{s.supports}</dd>
                          </div>
                          <div className="limits">
                            <dt>Keterbatasan</dt>
                            <dd>{s.limits}</dd>
                          </div>
                        </dl>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}

          <div className="refs-group">
            <h3>Perbedaan antar sumber</h3>
            <div className="prose" style={{ marginTop: "var(--s-3)" }}>
              <p>
                Sumber-sumber di atas tidak selalu sepakat. AyoDonor tidak memilih salah satu angka sebagai yang benar; tabel ini
                menampilkan apa adanya. Tanyakan ke petugas UTD PMI untuk ketentuan yang berlaku.
              </p>
            </div>
            <div className="table-wrap" tabIndex={0} role="region" aria-label="Tabel perbedaan kriteria antar sumber">
              <table className="compare">
                <caption className="sr-only">Perbandingan kriteria donor darah menurut Permenkes 91/2015, FAQ PMI, WHO, dan artikel Kemenkes</caption>
                <thead>
                  <tr>
                    <th scope="col">Kriteria</th>
                    <th scope="col">Permenkes 91/2015</th>
                    <th scope="col">FAQ PMI</th>
                    <th scope="col">WHO (Who can give blood)</th>
                    <th scope="col">Kemenkes (2025)</th>
                  </tr>
                </thead>
                <tbody>
                  {CRITERIA_COMPARISON.map((row) => (
                    <tr key={row.criterion}>
                      <th scope="row">{row.criterion}</th>
                      <td>{row.permenkes}</td>
                      <td>{row.pmi}</td>
                      <td>{row.who}</td>
                      <td>{row.kemkes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="table-hint">Tabel ini bisa digeser ke samping; kolom Kriteria tetap terlihat.</p>
          </div>

          <div className="callout callout--note" style={{ marginTop: "var(--s-6)" }}>
            <p className="kicker">Catatan redaksi</p>
            <h3 style={{ fontSize: "var(--text-base)", marginBottom: "var(--s-2)" }}>Klaim manfaat yang tidak kami ulang</h3>
            <p>
              Dua artikel Kemenkes (2023 dan 2025) menyebut manfaat seperti penurunan kolesterol, kesehatan jantung, risiko kanker, dan
              pembakaran kalori tanpa merujuk studi untuk tiap klaim. Lembar fakta WHO di atas tidak menyebut manfaat kesehatan bagi
              pendonor. Karena itu AyoDonor tidak menjanjikan manfaat kesehatan pribadi. Alasan utama donor adalah membantu pasien.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
