import ComponentsFigure from "../components/ComponentsFigure";
import Faq from "../components/Faq";
import { ChapterAfter, ChapterEligibility, ChapterProcess } from "../components/GuideChapters";
import Quiz from "../components/Quiz";
import SourceLinks from "../components/SourceLinks";
import { FAQ_ITEMS } from "../data/faq";
import PageHeader from "../layout/PageHeader";
import Section from "../layout/Section";

const PREPARATION = FAQ_ITEMS.find((i) => i.id === "persiapan")!;

export default function GuidePage() {
  return (
    <>
      <PageHeader kicker="Panduan" title="Panduan donor darah">
        <p>
          Dari pemeriksaan sebelum donor sampai setelah donor, dengan sumber di setiap klaim. Informasi umum, bukan nasihat medis pribadi.
        </p>
        <nav aria-label="Isi halaman" className="jump">
          <ul>
            <li>
              <a href="#syarat">Syarat dan pemeriksaan</a>
            </li>
            <li>
              <a href="#persiapan">Persiapan</a>
            </li>
            <li>
              <a href="#proses">Proses dan darah donor</a>
            </li>
            <li>
              <a href="#setelah">Setelah donor</a>
            </li>
            <li>
              <a href="#quiz-section">Kuis</a>
            </li>
            <li>
              <a href="#faq-section">Tanya jawab</a>
            </li>
          </ul>
        </nav>
      </PageHeader>

      <Section id="syarat" kicker="Langkah 1" title="Syarat dan pemeriksaan" deck="Apa yang dinilai petugas sebelum darahmu diambil.">
        <ChapterEligibility />
      </Section>

      <Section id="persiapan" kicker="Langkah 2" title="Persiapan" deck="Saran sebelum dan sesudah datang.">
        <div className="prose">
          <p>
            {PREPARATION.answer} <SourceLinks refs={PREPARATION.refs} />
          </p>
          <p className="small muted">Syarat dan jeda yang berbeda antar sumber ada di tanya jawab di bawah.</p>
        </div>
      </Section>

      <Section id="proses" kicker="Langkah 3" title="Proses dan darah donor" deck="Berapa yang diambil dan ke mana darah itu pergi.">
        <ChapterProcess />
        <div className="figure-wrap">
          <ComponentsFigure />
        </div>
      </Section>

      <Section id="setelah" kicker="Langkah 4" title="Setelah donor" deck="Pemulihan dan jeda antar donor.">
        <ChapterAfter />
      </Section>

      <Section
        id="quiz-section"
        kicker="Kuis · 4 pertanyaan"
        title="Kuis Panduan Awal Donor Darah"
        deck="Kuis singkat untuk belajar apa yang biasanya ditanyakan sebelum donor. Hasilnya bukan keputusan medis."
      >
        <Quiz />
      </Section>

      <Faq />
    </>
  );
}
