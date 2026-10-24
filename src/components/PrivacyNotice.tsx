// Plain-language summary of the app's actual data flows (verified against src/).
// This is a technical summary, not a complete legal privacy policy.
export default function PrivacyNotice() {
  return (
    <section id="privasi" aria-labelledby="privasi-title" className="section privacy">
      <div className="wrap section__inner">
        <div className="section__head">
          <p className="kicker">07 · Privasi</p>
          <h2 id="privasi-title">Privasi &amp; Data</h2>
          <p className="deck">Ringkasan teknis tentang data yang kamu masukkan di situs ini.</p>
        </div>

        <ul className="section__body">
          <li>
            <strong>Kuis dan FAQ:</strong> nama panggilan (boleh nama samaran) dan jawaban kuismu hanya diproses di browser. Tidak ada yang dikirim ke server atau pihak ketiga.
          </li>
          <li>
            <strong>Penyimpanan:</strong> situs ini statis: tidak punya server aplikasi atau basis data, tidak memakai layanan AI, dan tidak menyimpan data yang kamu masukkan. Penyedia hosting dapat mencatat metadata teknis permintaan sesuai kebijakannya sendiri.
          </li>
          <li>
            <strong>Lokasi:</strong> hanya dipakai di browsermu untuk mengurutkan contoh lokasi dan tidak dikirim ke server. Browser akan meminta izinmu dulu.
          </li>
          <li>
            <strong>Pihak ketiga:</strong> situs ini memakai font bawaan perangkatmu dan tidak memuat font dari layanan lain. Tautan peta membuka Google Maps, yang berada di luar kendali AyoDonor. AyoDonor tidak memasang cookie atau pelacak analitik sendiri.
          </li>
        </ul>
      </div>
    </section>
  );
}
