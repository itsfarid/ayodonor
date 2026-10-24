import { CRITERIA_COMPARISON, SOURCES } from "../data/sources";

export default function SourcesSection() {
  return (
    <section id="sumber-informasi" aria-labelledby="sumber-title" className="bg-white border-t border-slate-200 py-14 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 id="sumber-title" className="text-2xl font-black text-slate-800">
          Sumber informasi 📚
        </h2>
        <p className="text-sm text-slate-700 mt-2 leading-relaxed">
          Rujukan regulasi Indonesia adalah Permenkes No. 91 Tahun 2015. WHO dipakai sebagai pedoman umum internasional, dan PMI
          untuk panduan praktis. Semua sumber di bawah dibuka dan dibaca pada tanggal akses yang tertera. Isi situs ini
          <strong> belum ditinjau oleh tenaga medis atau pihak PMI</strong> dan bukan keputusan kelayakan: petugas UTD yang
          memutuskan saat pemeriksaan langsung.
        </p>

        <ol className="mt-6 space-y-4">
          {SOURCES.map((s) => (
            <li key={s.id} id={`sumber-${s.id}`} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-red-800 underline hover:text-red-900 focus-visible:ring-2 focus-visible:ring-red-500 rounded"
              >
                {s.title}
                <span className="sr-only"> (membuka tab baru)</span>
              </a>
              <dl className="mt-2 grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-x-3 gap-y-1 text-slate-700">
                <dt className="font-semibold">Jenis</dt>
                <dd>{s.kind}</dd>
                <dt className="font-semibold">Penerbit</dt>
                <dd>{s.publisher}</dd>
                <dt className="font-semibold">Terbit</dt>
                <dd>{s.published}</dd>
                <dt className="font-semibold">Diakses</dt>
                <dd>{s.accessed}</dd>
                <dt className="font-semibold">Dipakai untuk</dt>
                <dd>{s.supports}</dd>
                <dt className="font-semibold">Keterbatasan</dt>
                <dd>{s.limits}</dd>
              </dl>
            </li>
          ))}
        </ol>

        <h3 className="text-lg font-extrabold text-slate-800 mt-10">Perbedaan antar sumber</h3>
        <p className="text-sm text-slate-700 mt-1 leading-relaxed">
          Sumber-sumber di atas tidak selalu sepakat. AyoDonor tidak memilih salah satu angka sebagai yang benar; tabel ini
          menampilkan apa adanya. Tanyakan ke petugas UTD PMI untuk ketentuan yang berlaku.
        </p>
        <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Tabel perbedaan kriteria antar sumber">
          <table className="min-w-[56rem] w-full text-xs text-left border-collapse">
            <caption className="sr-only">Perbandingan kriteria donor darah menurut Permenkes 91/2015, FAQ PMI, WHO, dan artikel Kemenkes</caption>
            <thead>
              <tr className="bg-slate-100">
                <th scope="col" className="border border-slate-300 p-2">Kriteria</th>
                <th scope="col" className="border border-slate-300 p-2">Permenkes 91/2015</th>
                <th scope="col" className="border border-slate-300 p-2">FAQ PMI</th>
                <th scope="col" className="border border-slate-300 p-2">WHO (Who can give blood)</th>
                <th scope="col" className="border border-slate-300 p-2">Kemenkes (2025)</th>
              </tr>
            </thead>
            <tbody>
              {CRITERIA_COMPARISON.map((row) => (
                <tr key={row.criterion} className="align-top">
                  <th scope="row" className="border border-slate-300 p-2 bg-slate-50">{row.criterion}</th>
                  <td className="border border-slate-300 p-2">{row.permenkes}</td>
                  <td className="border border-slate-300 p-2">{row.pmi}</td>
                  <td className="border border-slate-300 p-2">{row.who}</td>
                  <td className="border border-slate-300 p-2">{row.kemkes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-extrabold text-slate-800 mt-10">Klaim manfaat yang tidak kami ulang</h3>
        <p className="text-sm text-slate-700 mt-1 leading-relaxed">
          Dua artikel Kemenkes (2023 dan 2025) menyebut manfaat seperti penurunan kolesterol, kesehatan jantung, risiko kanker, dan
          pembakaran kalori tanpa merujuk studi untuk tiap klaim. Lembar fakta WHO di atas tidak menyebut manfaat kesehatan bagi
          pendonor. Karena itu AyoDonor tidak menjanjikan manfaat kesehatan pribadi. Alasan utama donor adalah membantu pasien.
        </p>
      </div>
    </section>
  );
}
