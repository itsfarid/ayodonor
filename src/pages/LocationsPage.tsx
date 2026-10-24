import PmiLocator from "../components/PmiLocator";
import PageHeader from "../layout/PageHeader";
import Section from "../layout/Section";

export default function LocationsPage() {
  return (
    <>
      <PageHeader kicker="Lokasi" title="Cari UDD/UTD PMI">
        <p>Alamat dan telepon unit donor darah PMI per kota atau provinsi.</p>
      </PageHeader>

      <section id="pmi-locator-container" className="section section--tight" aria-label="Pencari UDD/UTD PMI">
        <div className="wrap">
          <PmiLocator />
        </div>
      </section>

      <Section id="hubungi" title="Kapan menghubungi PMI atau tenaga medis" deck="AyoDonor tidak bisa menilai kondisi pribadimu.">
        <div className="prose">
          <p>Tanyakan langsung ke UTD PMI terdekat (atau lewat ayodonor.pmi.or.id) bila kamu:</p>
          <ul className="ruled">
            <li>ingin memastikan syarat dan jeda donor yang berlaku. Sumber berbeda pada beberapa angka, dan petugas PMI yang memutuskan.</li>
            <li>sedang sakit, minum obat, hamil atau menyusui, atau baru membuat tato, tindik, atau akupunktur. Petugas menilai hal ini satu per satu.</li>
            <li>membutuhkan lokasi, jam layanan, atau stok darah yang resmi.</li>
          </ul>
          <div className="callout callout--caution">
            <p className="kicker">Setelah donor</p>
            <p>
              Jika pusing atau lemas terasa berat atau tidak reda, segera minta bantuan petugas atau tenaga medis. Untuk pertanyaan tentang kondisi kesehatan pribadi, tanyakan ke dokter atau tenaga kesehatan, bukan ke situs ini.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
