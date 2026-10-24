import ComponentsFigure from "../components/ComponentsFigure";
import KeyFacts from "../components/KeyFacts";
import { MYTHS } from "../data/myths";
import { UTD_RECORDS } from "../data/utd";
import Section from "../layout/Section";
import { Link } from "../router";

const GUIDE_PREVIEW = [
  { to: "/panduan#syarat", title: "Syarat dan pemeriksaan", text: "Apa yang dinilai petugas sebelum darahmu diambil." },
  { to: "/panduan#persiapan", title: "Persiapan", text: "Tidur, makan, dan minum sebelum datang (saran PMI)." },
  { to: "/panduan#proses", title: "Proses dan darah donor", text: "Isi kantong donor dan bagaimana darah diolah menjadi komponen." },
  { to: "/panduan#setelah", title: "Setelah donor", text: "Bagaimana tubuh mengganti darah, dan jeda antar donor." },
];

export default function HomePage() {
  return (
    <>
      <section className="hero hero--home" aria-labelledby="hero-title">
        <div className="wrap hero__grid">
          <div>
            <p className="kicker">Edukasi donor darah · proyek independen</p>
            <h1 id="hero-title">
              Pahami donor darah <em>sebelum</em> kamu datang ke PMI.
            </h1>
            <p className="hero__deck">
              Dasar-dasar donor darah, persiapan, dan jawaban atas pertanyaan umum, lengkap dengan sumber yang bisa kamu periksa. Keputusan tentang dirimu tetap ada pada petugas PMI.
            </p>
            <div className="hero__actions">
              <Link to="/lokasi" className="btn">
                Cari lokasi donor
              </Link>
              <Link to="/panduan" className="btn btn--quiet">
                Baca panduan
              </Link>
            </div>
            <p className="independence">
              Proyek edukasi independen. Bukan situs resmi PMI, bukan layanan medis, dan tidak berafiliasi dengan PMI maupun Kemenkes.
            </p>
          </div>

          <div className="hero__figure">
            <ComponentsFigure />
          </div>
        </div>
      </section>

      <KeyFacts />

      <Section id="ringkasan-panduan" title="Panduan singkat" deck="Empat bagian yang dibaca berurutan, sesuai perjalanan donor.">
        <ul className="linklist">
          {GUIDE_PREVIEW.map((item) => (
            <li key={item.to}>
              <Link to={item.to}>
                <span className="linklist__title">{item.title}</span>
                <span className="linklist__text">{item.text}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="more">
          <Link to="/panduan">Panduan lengkap, kuis, dan tanya jawab</Link>
        </p>
      </Section>

      <Section id="ringkasan-mitos" title="Fakta dan mitos" deck="Hal yang sering ditanyakan, dijawab dengan hati-hati.">
        <ul className="linklist linklist--plain">
          {MYTHS.map((m) => (
            <li key={m.id}>{m.myth}</li>
          ))}
        </ul>
        <p className="more">
          <Link to="/fakta-mitos">Lihat jawabannya</Link>
        </p>
      </Section>

      <Section id="ringkasan-lokasi" title="Cari UDD/UTD PMI" deck={`${UTD_RECORDS.length} unit menurut halaman Kontak PMI.`}>
        <p>
          Cari alamat dan telepon unit donor darah di kota atau provinsimu. Daftar disalin dari situs resmi PMI dan bisa belum lengkap; hubungi unit untuk memastikan sebelum datang.
        </p>
        <p className="more">
          <Link to="/lokasi" className="btn">
            Cari lokasi donor
          </Link>
        </p>
      </Section>
    </>
  );
}
