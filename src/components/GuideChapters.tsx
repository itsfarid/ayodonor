import SourceLinks from "./SourceLinks";
import { Link } from "../router";

// The three explanatory chapters of the guide. Text, figures and source links are unchanged from the original single page.

export function ChapterAfter() {
  return (
    <article id="content-kesehatan" className="chapter" aria-labelledby="ch-1">
      <h3 id="ch-1" className="chapter__title">
        Tubuh mengganti darah yang didonorkan
      </h3>
      <div className="prose">
        <p>
          Saat donor, sebagian darahmu diambil. Standar pelayanan transfusi darah menyebut kantong donor berisi sekitar <strong>350 mL atau 450 mL</strong>. Setelah itu tubuh mengganti darah yang diambil. Menurut FAQ PMI, volume darah diganti dalam 48 jam dan sel darah merah pengganti terbentuk dalam sekitar 4-8 minggu.{" "}
          <SourceLinks refs={[{ id: "permenkes", locator: "hal. 63" }, { id: "pmi-faq" }]} />
        </p>

        <ul className="ruled">
          <li>
            <strong>Ada jeda antar donor.</strong> Permenkes 91/2015 menyebut minimal 2 bulan antar donor darah lengkap; FAQ PMI menyebut jeda itu demi keamanan dan keselamatan pendonor. Sumber lain menyebut 3 bulan, jadi petugas PMI yang memastikan jedamu.
          </li>
          <li>
            <strong>Ada pemeriksaan dulu.</strong> Hemoglobin, tekanan darah, dan riwayat kesehatanmu dinilai sebelum donor demi keselamatan pendonor dan penerima.
          </li>
        </ul>

        <div className="callout callout--note">
          <p className="kicker">Catatan redaksi</p>
          <p>
            <strong>Tanpa janji manfaat pribadi.</strong> AyoDonor tidak mengklaim donor menurunkan kolesterol, mempercantik kulit, atau menambah stamina. Alasan utama donor adalah membantu pasien.
          </p>
        </div>

        <p className="small muted">
          Informasi umum, bukan nasihat medis pribadi. <SourceLinks refs={[{ id: "permenkes" }, { id: "pmi-faq" }]} />
        </p>
      </div>
    </article>
  );
}

export function ChapterProcess() {
  return (
    <article id="content-sosial" className="chapter" aria-labelledby="ch-2">
      <h3 id="ch-2" className="chapter__title">
        Satu kantong, beberapa komponen
      </h3>
      <div className="chapter__grid chapter__grid--split">
        <div className="prose">
          <p>
            Darah lengkap dapat diolah menjadi komponen darah sehingga satu donasi dapat melayani lebih dari satu pasien. Pejabat Kemenkes pernah menyebut satu kantong dapat menyelamatkan setidaknya 3 nyawa (pernyataan dalam acara, 2022); jumlah sebenarnya bergantung pada kebutuhan pasien.{" "}
            <SourceLinks refs={[{ id: "who-safety" }, { id: "permenkes", locator: "hal. 53" }, { id: "kemkes-pers" }]} />
          </p>
          <p>
            Komponen yang dapat dipisahkan dari darah lengkap antara lain sel darah merah (PRC), plasma (FFP), dan trombosit (TC); lihat skema di bagian atas halaman. Komponen mana yang diberikan kepada pasien diputuskan dokter sesuai kebutuhan medisnya.
          </p>
        </div>

        <aside className="panel" aria-labelledby="ch-2-aside">
          <h4 id="ch-2-aside">Berapa banyak darah yang diambil?</h4>
          <p className="small">
            Standar pelayanan transfusi darah menyebut kantong donor berisi sekitar 350 mL atau 450 mL. Batas berat badan pendonor bergantung pada volume yang diambil (45 kg atau 55 kg menurut Permenkes; WHO menyebut umumnya 50 kg), dan petugas PMI yang menentukan.
          </p>
          <p className="small" style={{ margin: 0 }}>
            <SourceLinks refs={[{ id: "permenkes", locator: "hal. 55-56, 63" }, { id: "who-eligibility" }]} />
          </p>
        </aside>
      </div>
    </article>
  );
}

export function ChapterEligibility() {
  return (
    <article id="content-personal" className="chapter" aria-labelledby="ch-3">
      <h3 id="ch-3" className="chapter__title">
        Apa yang terjadi sebelum darahmu diambil?
      </h3>
      <div className="chapter__grid chapter__grid--split">
        <div className="prose">
          <p>
            Sebelum donor, petugas menilai apakah kamu cukup sehat untuk donor dan mencatat faktor risiko. Tujuannya melindungi pendonor sekaligus penerima darah.
          </p>

          <dl className="defs">
            <div>
              <dt>Hemoglobin (Hb)</dt>
              <dd>Dicek untuk memastikan kadar hemoglobinmu memadai.</dd>
            </div>
            <div>
              <dt>Tekanan darah &amp; nadi</dt>
              <dd>Diukur sebelum donor.</dd>
            </div>
            <div>
              <dt>Riwayat kesehatan</dt>
              <dd>Petugas menanyakan penyakit, obat, dan faktor risiko. Jawablah dengan jujur.</dd>
            </div>
            <div>
              <dt>Skrining darah donor</dt>
              <dd>Setiap kantong diperiksa untuk HIV, hepatitis B, hepatitis C, dan sifilis demi keamanan penerima.</dd>
            </div>
          </dl>

          <p className="small">
            Skrining ini untuk keamanan darah yang diberikan ke pasien. AyoDonor tidak menyarankannya sebagai pengganti pemeriksaan kesehatan pribadi. Jika ada hasil yang reaktif, UTD menyampaikannya lewat konseling.{" "}
            <SourceLinks refs={[{ id: "permenkes", locator: "hal. 27, 54" }, { id: "who-safety" }]} />
          </p>
        </div>

        <div>
          <aside className="panel" aria-labelledby="ch-3-aside">
            <p className="kicker">Referensi umum</p>
            <h4 id="ch-3-aside">Yang diperiksa petugas</h4>
            <dl>
              <div>
                <dt>Hemoglobin (Hb)</dt>
                <dd className="mono">Permenkes: 12,5 - 17 g/dL</dd>
              </div>
              <div>
                <dt>Tekanan darah &amp; nadi</dt>
                <dd>diukur, rentang dinilai petugas</dd>
              </div>
              <div>
                <dt>Berat badan</dt>
                <dd>ada batas minimal, bergantung volume donor</dd>
              </div>
              <div>
                <dt>Suhu tubuh</dt>
                <dd>diperiksa petugas</dd>
              </div>
            </dl>
          </aside>
          <div className="callout callout--caution">
            <p className="kicker">Sumber berbeda</p>
            <p>
              Angka berbeda antar sumber (WHO menyebut banyak negara memakai Hb minimal 12,0 untuk perempuan dan 13,0 untuk laki-laki). Lihat <Link to="/tentang#sumber-informasi">Sumber informasi</Link>; selalu ikuti petugas PMI.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
