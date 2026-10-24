import { FaqEntry } from "../components/Faq";
import KeyFacts from "../components/KeyFacts";
import MythList from "../components/MythList";
import { FAQ_ITEMS } from "../data/faq";
import PageHeader from "../layout/PageHeader";
import Section from "../layout/Section";
import { Link } from "../router";

const RELATED_IDS = ["jarum", "pusing", "manfaat", "nyawa"];
const RELATED = RELATED_IDS.map((id) => FAQ_ITEMS.find((i) => i.id === id)!).filter(Boolean);

export default function MythsPage() {
  return (
    <>
      <PageHeader kicker="Fakta & mitos" title="Fakta dan mitos donor darah">
        <p>Jawaban singkat untuk hal yang sering ditanyakan. Informasi umum, bukan nasihat medis pribadi.</p>
      </PageHeader>

      <KeyFacts />

      <Section
        id="mitos-fakta"
        title="Mitos dan Fakta Umum"
        deck={
          <>
            Lihat <Link to="/tentang#sumber-informasi">Sumber informasi</Link> dan <Link to="/panduan#faq-section">tanya jawab</Link>.
          </>
        }
      >
        <MythList />
      </Section>

      <Section id="pertanyaan-terkait" title="Pertanyaan terkait" deck="Dari tanya jawab, beserta sumbernya.">
        <div>
          {RELATED.map((item) => (
            <FaqEntry key={item.id} item={item} />
          ))}
        </div>
        <p className="more">
          <Link to="/panduan#faq-section">Semua tanya jawab</Link>
        </p>
      </Section>
    </>
  );
}
