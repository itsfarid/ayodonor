// Plain-language summary of the app's actual data flows (verified against server/ and src/).
// This is a technical summary, not a complete legal privacy policy.
export default function PrivacyNotice() {
  return (
    <section id="privasi" aria-labelledby="privasi-title" className="bg-slate-100 border-t border-slate-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 id="privasi-title" className="text-2xl font-black text-slate-800">
          Privasi & Data 🔒
        </h2>
        <p className="text-sm text-slate-600 mt-1">Ringkasan teknis tentang data yang kamu masukkan di situs ini.</p>

        <ul className="mt-5 space-y-3 text-sm text-slate-700 leading-relaxed list-disc pl-5">
          <li>
            <strong>Kuis dan FAQ:</strong> nama panggilan (boleh nama samaran) dan jawaban kuismu hanya diproses di browser. Tidak ada yang dikirim ke server atau pihak ketiga.
          </li>
          <li>
            <strong>Penyimpanan:</strong> aplikasi ini tidak punya basis data, tidak memakai layanan AI, dan tidak menyimpan data yang kamu masukkan. Log server hanya mencatat metadata teknis (waktu, alamat halaman, status, durasi).
          </li>
          <li>
            <strong>Lokasi:</strong> hanya dipakai di browsermu untuk mengurutkan contoh lokasi dan tidak dikirim ke server. Browser akan meminta izinmu dulu.
          </li>
          <li>
            <strong>Pihak ketiga:</strong> browsermu memuat font dari Google Fonts (alamat IP-mu terlihat oleh Google). Tautan peta membuka Google Maps. AyoDonor tidak memasang cookie atau pelacak analitik sendiri.
          </li>
        </ul>
      </div>
    </section>
  );
}
