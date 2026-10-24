import PrivacyNotice from "../components/PrivacyNotice";
import SourcesSection from "../components/SourcesSection";
import PageHeader from "../layout/PageHeader";
import Section from "../layout/Section";
import { Link } from "../router";

export default function AboutPage() {
  return (
    <>
      <PageHeader kicker="Tentang" title="Tentang AyoDonor">
        <p>Tujuan, batasan, dan dasar informasi di situs ini.</p>
        <nav aria-label="Isi halaman" className="jump">
          <ul>
            <li>
              <a href="#tentang-ayodonor">Tentang</a>
            </li>
            <li>
              <a href="#sumber-informasi">Sumber informasi</a>
            </li>
            <li>
              <a href="#perbedaan-sumber">Perbedaan antar sumber</a>
            </li>
            <li>
              <a href="#privasi">Privasi</a>
            </li>
          </ul>
        </nav>
      </PageHeader>

      <Section id="tentang-ayodonor" title="Apa itu AyoDonor">
        <div className="prose">
          <p>
            Proyek edukasi independen tentang donor darah untuk generasi muda Indonesia. AyoDonor bukan layanan medis dan tidak berafiliasi dengan PMI maupun Kemenkes.
          </p>
          <p>
            Kuis dan teks di AyoDonor hanya untuk edukasi. Bukan diagnosis, bukan keputusan kelayakan, dan bukan nasihat medis. Kelayakan donor ditentukan petugas PMI lewat pemeriksaan langsung. Info resmi: ayodonor.pmi.or.id.
          </p>
          <p>
            Penjelasan ditulis AyoDonor sendiri berdasarkan sumber yang tercantum di bawah, dan tautan sumber diletakkan di dekat klaim yang didukungnya. Situs ini statis dan tidak memakai layanan AI.
          </p>
          <ul className="ruled">
            <li>
              <Link to="/panduan">Panduan</Link>
              <span className="muted"> Syarat, persiapan, proses, setelah donor, kuis, dan tanya jawab.</span>
            </li>
            <li>
              <Link to="/fakta-mitos">Fakta & mitos</Link>
              <span className="muted"> Jawaban singkat untuk hal yang sering ditanyakan.</span>
            </li>
            <li>
              <Link to="/lokasi">Lokasi</Link>
              <span className="muted"> Alamat dan telepon UDD/UTD dari halaman Kontak PMI.</span>
            </li>
          </ul>
        </div>
      </Section>

      <SourcesSection />
      <PrivacyNotice />
    </>
  );
}
