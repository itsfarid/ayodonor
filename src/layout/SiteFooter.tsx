import SourceLinks from "../components/SourceLinks";
import { Link } from "../router";
import { ROUTES } from "../routes";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__grid">
          <div>
            <h2>Tentang AyoDonor</h2>
            <p>
              Proyek edukasi independen tentang donor darah untuk generasi muda Indonesia. AyoDonor bukan layanan medis dan tidak berafiliasi dengan PMI maupun Kemenkes.
            </p>
          </div>

          <nav aria-label="Navigasi footer">
            <h2>Halaman</h2>
            <ul>
              {ROUTES.map((r) => (
                <li key={r.path}>
                  <Link to={r.path}>{r.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="footer__note">
          Kuis dan teks di AyoDonor hanya untuk edukasi. Bukan diagnosis, bukan keputusan kelayakan, dan bukan nasihat medis. Kelayakan donor ditentukan petugas PMI lewat pemeriksaan langsung. Daftar UDD/UTD disalin dari halaman Kontak PMI dan bisa belum lengkap atau sudah berubah; AyoDonor tidak menampilkan stok darah.
        </p>
        <p className="footer__note">
          <SourceLinks refs={[{ id: "permenkes" }, { id: "pmi-faq" }, { id: "who-eligibility" }]} /> ·{" "}
          <Link to="/tentang#sumber-informasi">Semua sumber</Link> · <Link to="/tentang#privasi">Privasi</Link>
        </p>

        <div className="footer__base">
          <span>© {new Date().getFullYear()} AyoDonor</span>
          <span>Info resmi: ayodonor.pmi.or.id</span>
        </div>
      </div>
    </footer>
  );
}
