import React, { useEffect, useRef, useState } from "react";
import PmiLocator from "./components/PmiLocator";
import HeroCard from "./components/HeroCard";
import Faq from "./components/Faq";
import PrivacyNotice from "./components/PrivacyNotice";
import SourceLinks from "./components/SourceLinks";
import SourcesSection from "./components/SourcesSection";
import ComponentsFigure from "./components/ComponentsFigure";
import { allQuizAnswersSafe, buildQuizSummary, MEDICAL_DISCLAIMER, type QuizAnswer } from "../shared/content";
import type { SourceRef } from "./data/sources";

// --- Minimal renderer for the quiz summary (headings "###", "*" bullets, **bold**, paragraphs) ---
function renderStyledText(text: string): React.ReactNode {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, idx) => (idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part));
}

function parseMarkdown(text: string): React.ReactNode[] {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const items = bullets;
    bullets = [];
    blocks.push(
      <ul key={`ul-${blocks.length}`}>
        {items.map((item, i) => (
          <li key={i}>{renderStyledText(item)}</li>
        ))}
      </ul>
    );
  };

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    // A bullet needs whitespace after the marker; a line starting with **bold** is a paragraph.
    if (/^[*-]\s/.test(line)) {
      bullets.push(line.substring(1).trim());
      continue;
    }
    flushBullets();
    if (line === "") continue;
    if (line.startsWith("###")) {
      blocks.push(<h3 key={`h-${blocks.length}`}>{renderStyledText(line.replace(/^#+/, "").trim())}</h3>);
    } else {
      blocks.push(<p key={`p-${blocks.length}`}>{renderStyledText(line)}</p>);
    }
  }
  flushBullets();
  return blocks;
}

// Matches the maxLength of the name input.
const VISITOR_NAME_MAX_CHARS = 50;

type QuizKey = "ageWeight" | "sleep" | "meds" | "recency";

interface QuizQuestion {
  key: QuizKey;
  category: string;
  text: (name: string) => string;
  help: string;
  refs: SourceRef[];
  safe: string;
  unsafe: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    key: "ageWeight",
    category: "Usia dan berat badan",
    text: (name) => `Halo ${name}, apakah umurmu minimal 17 tahun dan berat badanmu minimal 45 kg?`,
    help: "Batas berat badan berbeda antar sumber: 45 kg atau 55 kg menurut Permenkes (tergantung volume), umumnya 50 kg menurut WHO. Petugas PMI yang menimbang dan memutuskan.",
    refs: [{ id: "permenkes", locator: "hal. 56-57" }, { id: "who-eligibility" }],
    safe: "Ya, kurasa sudah memenuhi",
    unsafe: "Belum, atau aku tidak yakin",
  },
  {
    key: "sleep",
    category: "Istirahat",
    text: (name) => `Apakah kamu cukup istirahat dan merasa sehat hari ini, ${name}?`,
    help: "PMI menganjurkan tidur cukup sebelum donor. Kami tidak menetapkan jumlah jam tidur tertentu.",
    refs: [{ id: "pmi-faq" }],
    safe: "Ya, cukup istirahat dan merasa sehat",
    unsafe: "Kurang istirahat atau kurang fit",
  },
  {
    key: "meds",
    category: "Sakit dan pengobatan",
    text: () => "Apakah kamu sedang sakit, atau sedang menjalani pengobatan / minum obat tertentu (termasuk antibiotik)?",
    help: "Petugas menilai penyakit dan jenis obatnya satu per satu. Sebutkan semua obat yang kamu minum saat pemeriksaan.",
    refs: [{ id: "permenkes", locator: "hal. 60, 277" }],
    safe: "Tidak sedang sakit atau berobat",
    unsafe: "Ya, sedang sakit atau berobat",
  },
  {
    key: "recency",
    category: "Jeda waktu",
    text: () =>
      "Pertanyaan terakhir: apakah kamu baru-baru ini donor darah (dalam 3 bulan terakhir), atau membuat tato, tindik, atau akupunktur (dalam 1 tahun terakhir)?",
    help: "Jeda minimal berbeda antar sumber resmi (donor: 2-3 bulan; tato/tindik: beberapa bulan hingga 1 tahun), jadi kami memakai rentang yang paling hati-hati. Petugas PMI yang memutuskan.",
    refs: [{ id: "permenkes", locator: "hal. 59, 64" }, { id: "pmi-faq" }, { id: "who-eligibility" }],
    safe: "Tidak, sudah lewat atau tidak pernah",
    unsafe: "Ya, baru-baru ini",
  },
];

const EMPTY_ANSWERS: Record<QuizKey, QuizAnswer> = { ageWeight: "", sleep: "", meds: "", recency: "" };

const NAV_LINKS = [
  { href: "#education", label: "Dasar-dasar" },
  { href: "#quiz-section", label: "Kuis" },
  { href: "#faq-section", label: "FAQ" },
  { href: "#sumber-informasi", label: "Sumber" },
  { href: "#pmi-locator-container", label: "Hubungi PMI" },
];

function DropMark() {
  return (
    <svg viewBox="0 0 22 28" aria-hidden="true" focusable="false">
      <path d="M11 1C11 1 21 12.5 21 18.5a10 10 0 0 1-20 0C1 12.5 11 1 11 1Z" fill="#7B1428" />
    </svg>
  );
}

export default function App() {
  // App Name context
  const [visitorName, setVisitorName] = useState<string>("");
  const [hasEnteredName, setHasEnteredName] = useState<boolean>(false);

  // Quiz State
  const [quizStep, setQuizStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<QuizKey, QuizAnswer>>(EMPTY_ANSWERS);
  const [quizResult, setQuizResult] = useState<string>("");

  // Keyboard and screen-reader users lose their place when the question they just answered unmounts,
  // so focus moves to the new question (or the result).
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (quizStep >= 1 && quizStep <= 4) questionHeadingRef.current?.focus({ preventScroll: true });
    if (quizStep === 5) resultRef.current?.focus({ preventScroll: true });
  }, [quizStep]);

  const startQuiz = () => {
    if (!visitorName.trim()) return;
    setHasEnteredName(true);
    setQuizStep(1);
  };

  // The quiz summary is computed in the browser; nothing is sent to a server.
  const answerQuizQuestion = (index: number, key: QuizKey, val: "safe" | "unsafe") => {
    const updated = { ...answers, [key]: val };
    setAnswers(updated);
    if (index < QUIZ_QUESTIONS.length - 1) {
      setQuizStep(quizStep + 1);
      return;
    }
    setQuizResult(buildQuizSummary(visitorName.trim() || undefined, updated));
    setQuizStep(5);
  };

  // Reset Quiz to retake
  const resetQuiz = () => {
    setQuizStep(hasEnteredName ? 1 : 0);
    setAnswers(EMPTY_ANSWERS);
    setQuizResult("");
  };

  const activeQuestion = quizStep >= 1 && quizStep <= 4 ? QUIZ_QUESTIONS[quizStep - 1] : null;

  return (
    <div id="top">
      <a className="skip-link" href="#konten">
        Lewati ke konten
      </a>

      <header className="masthead">
        <div className="wrap masthead__bar">
          <a href="#top" className="wordmark" aria-label="AyoDonor, ke awal halaman">
            <DropMark />
            AyoDonor
          </a>
          <nav aria-label="Navigasi halaman" className="nav">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="konten" tabIndex={-1}>
        {/* HERO */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="wrap hero__grid">
            <div>
              <p className="kicker">Edukasi donor darah · proyek independen</p>
              <h1 id="hero-title">
                Pahami donor darah <em>sebelum</em> kamu datang ke PMI.
              </h1>
              <p className="hero__deck">
                AyoDonor merangkum dasar-dasar donor darah, persiapan, dan jawaban atas pertanyaan umum, lengkap dengan sumber yang bisa kamu periksa sendiri. Keputusan tentang dirimu tetap ada pada petugas PMI.
              </p>
              <div className="hero__actions">
                <a href="#education" className="btn">
                  Mulai dari dasar-dasarnya
                </a>
                <a href="#quiz-section" className="btn btn--quiet">
                  Coba kuis panduan awal
                </a>
                <a href="#sumber-informasi" className="textlink">
                  Lihat sumber informasi
                </a>
              </div>
              <div className="independence">
                <p>
                  AyoDonor adalah proyek edukasi independen. Bukan situs resmi PMI, bukan layanan medis, dan tidak berafiliasi dengan PMI maupun Kemenkes.
                </p>
              </div>
            </div>

            <ComponentsFigure />
          </div>
        </section>

        {/* SEKILAS */}
        <section id="sekilas" className="glance" aria-labelledby="sekilas-title">
          <div className="wrap">
            <h2 id="sekilas-title" className="sr-only">
              Sekilas: tiga hal untuk diketahui
            </h2>
            <div className="glance__grid">
              <div className="glance__item">
                <p className="kicker">01</p>
                <h3>Kata pejabat Kemenkes: setidaknya 3 nyawa per kantong</h3>
                <p>Pernyataan dalam acara (2022), bukan hasil penelitian. Jumlah sebenarnya bergantung pada kebutuhan pasien.</p>
                <SourceLinks refs={[{ id: "kemkes-pers" }]} />
              </div>

              <div className="glance__item">
                <p className="kicker">02</p>
                <h3>Satu kantong bisa dipisah menjadi beberapa komponen</h3>
                <p>Satu kantong bisa dipisah untuk pasien berbeda.</p>
                <SourceLinks refs={[{ id: "who-safety" }, { id: "permenkes", locator: "hal. 54" }]} />
              </div>

              <div className="glance__item">
                <p className="kicker">03</p>
                <h3>Diperiksa petugas sebelum donor</h3>
                <p>Hb, tekanan darah, dan riwayat kesehatan dicek sebelum donor.</p>
                <SourceLinks refs={[{ id: "pmi-faq" }, { id: "permenkes", locator: "hal. 56-57" }]} />
              </div>
            </div>
          </div>
        </section>

        {/* 01 DASAR-DASAR */}
        <section id="education" aria-labelledby="education-title" className="section">
          <div className="wrap section__inner">
            <div className="section__head">
              <p className="kicker">01 · Dasar-dasar</p>
              <h2 id="education-title">Dasar-dasar Donor Darah</h2>
              <p className="deck">
                Apa yang terjadi setelah donor, kenapa darah donor dibutuhkan, dan apa saja yang diperiksa petugas sebelum donor.
              </p>
            </div>

            <div className="section__body">
              <article id="content-kesehatan" className="chapter" aria-labelledby="ch-1">
                <h3 id="ch-1" className="chapter__title">
                  <span className="kicker">1.1 Setelah donor</span>{" "}
                  Tubuh mengganti darah yang didonorkan
                </h3>
                <div className="prose">
                  <p>
                    Saat donor, sebagian darahmu diambil. Standar pelayanan transfusi darah menyebut kantong donor berisi sekitar <strong>350 mL atau 450 mL</strong>. Setelah itu tubuh mengganti darah yang diambil. Menurut FAQ PMI, volume darah diganti dalam 48 jam dan sel darah merah pengganti terbentuk dalam sekitar 4-8 minggu.{" "}
                    <SourceLinks refs={[{ id: "permenkes", locator: "hal. 64" }, { id: "pmi-faq" }]} />
                  </p>

                  <ul className="ruled">
                    <li>
                      <strong>Ada jeda antar donor.</strong> Permenkes 91/2015 menyebut minimal 2 bulan antar donor darah lengkap agar tubuh sempat pulih. Sumber lain menyebut 3 bulan, jadi petugas PMI yang memastikan jedamu.
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

              <article id="content-sosial" className="chapter" aria-labelledby="ch-2">
                <h3 id="ch-2" className="chapter__title">
                  <span className="kicker">1.2 Kenapa dibutuhkan</span>{" "}
                  Satu kantong, beberapa komponen
                </h3>
                <div className="chapter__grid chapter__grid--split">
                  <div className="prose">
                    <p>
                      Darah lengkap dapat diolah menjadi komponen darah sehingga satu donasi dapat melayani lebih dari satu pasien. Pejabat Kemenkes pernah menyebut satu kantong dapat menyelamatkan setidaknya 3 nyawa (pernyataan dalam acara, 2022); jumlah sebenarnya bergantung pada kebutuhan pasien.{" "}
                      <SourceLinks refs={[{ id: "who-safety" }, { id: "permenkes", locator: "hal. 54" }, { id: "kemkes-pers" }]} />
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
                      <SourceLinks refs={[{ id: "permenkes", locator: "hal. 56-57, 64" }, { id: "who-eligibility" }]} />
                    </p>
                  </aside>
                </div>
              </article>

              <article id="content-personal" className="chapter" aria-labelledby="ch-3">
                <h3 id="ch-3" className="chapter__title">
                  <span className="kicker">1.3 Sebelum donor</span>{" "}
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
                      <SourceLinks refs={[{ id: "permenkes", locator: "hal. 28, 55" }, { id: "who-safety" }]} />
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
                        Angka berbeda antar sumber (WHO menyebut banyak negara memakai Hb minimal 12,0 untuk perempuan dan 13,0 untuk laki-laki). Lihat <a href="#sumber-informasi">Sumber informasi</a>; selalu ikuti petugas PMI.
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* 02 MITOS & FAKTA */}
        <section id="mitos-fakta" aria-labelledby="mitos-title" className="section">
          <div className="wrap section__inner">
            <div className="section__head">
              <p className="kicker">02 · Mitos &amp; fakta</p>
              <h2 id="mitos-title">Mitos &amp; Fakta Umum</h2>
              <p className="deck">
                Informasi umum, bukan nasihat medis pribadi. Lihat <a href="#sumber-informasi">Sumber informasi</a> dan <a href="#faq-section">FAQ</a>.
              </p>
            </div>

            <dl className="defs section__body" style={{ marginTop: 0 }}>
              <div>
                <dt>Katanya: donor bikin gemuk?</dt>
                <dd>
                  <strong>Faktanya:</strong> Donor darah bukan program diet dan tidak dianjurkan untuk tujuan itu. Alasan utama donor adalah membantu pasien.
                </dd>
              </div>
              <div>
                <dt>Katanya: jarumnya besar dan sakit?</dt>
                <dd>
                  <strong>Faktanya:</strong> Rasanya berbeda-beda. Sebagian orang hanya merasakan sensasi singkat saat jarum masuk, sebagian lain lebih tidak nyaman. Bilang ke petugas kalau kamu takut.
                </dd>
              </div>
              <div>
                <dt>Katanya: bikin lemas berhari-hari?</dt>
                <dd>
                  <strong>Faktanya:</strong> Sebagian orang bisa merasa pusing atau lemas setelah donor. Tidur cukup, makan, dan minum sebelum donor, istirahat sesudahnya, dan ikuti arahan petugas. Kalau terasa berat atau tidak reda, segera minta bantuan.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* 03 KUIS */}
        <section id="quiz-section" aria-labelledby="quiz-title" className="section">
          <div className="wrap section__inner">
            <div className="section__head">
              <p className="kicker">03 · Kuis · 4 pertanyaan</p>
              <h2 id="quiz-title">Kuis Panduan Awal Donor Darah</h2>
              <p className="deck">
                Kuis singkat untuk belajar apa yang biasanya ditanyakan sebelum donor. Hasilnya bukan keputusan medis.
              </p>
            </div>

            <div className="section__body">
              <div className="tool">
                {/* STEP 0: NAME */}
                {quizStep === 0 && (
                  <div id="quiz-gate">
                    <h3 className="tool__title">Mulai kuis</h3>
                    <p className="small" style={{ maxWidth: "34rem", marginTop: "var(--s-2)" }}>
                      Tulis nama panggilan (boleh nama samaran). Nama dan jawabanmu hanya diproses di browser dan tidak dikirim ke server.
                    </p>

                    <div className="field" style={{ maxWidth: "26rem", marginTop: "var(--s-4)" }}>
                      <label htmlFor="visitor-name-input">Nama panggilan</label>
                      <input
                        id="visitor-name-input"
                        type="text"
                        maxLength={VISITOR_NAME_MAX_CHARS}
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        placeholder="Contoh: Farhan, Rizki, Aurel"
                        className="input"
                        autoComplete="off"
                        aria-describedby="name-hint"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") startQuiz();
                        }}
                      />
                      <p id="name-hint" className="hint">
                        Tombol Mulai kuis aktif setelah nama panggilan diisi.
                      </p>
                    </div>

                    <p style={{ marginTop: "var(--s-4)", marginBottom: 0 }}>
                      <button id="btn-start-quiz" disabled={!visitorName.trim()} onClick={startQuiz} className="btn">
                        Mulai kuis
                      </button>
                    </p>
                  </div>
                )}

                {/* STEPS 1-4 */}
                {activeQuestion && (
                  <div id={`question-${quizStep}`} className="question">
                    <p className="kicker kicker--plain" style={{ marginBottom: 0 }}>
                      Pertanyaan {quizStep} dari 4 · {activeQuestion.category}
                    </p>
                    <div className="steps" aria-hidden="true">
                      {[1, 2, 3, 4].map((n) => (
                        <span key={n} data-done={n <= quizStep} />
                      ))}
                    </div>

                    <h3 ref={questionHeadingRef} tabIndex={-1}>
                      {activeQuestion.text(visitorName)}
                    </h3>
                    <p className="help">
                      {activeQuestion.help} <SourceLinks refs={activeQuestion.refs} />
                    </p>

                    <div className="choices">
                      <button
                        id={`btn-q${quizStep}-safe`}
                        onClick={() => answerQuizQuestion(quizStep - 1, activeQuestion.key, "safe")}
                        className="choice"
                      >
                        {activeQuestion.safe}
                      </button>
                      <button
                        id={`btn-q${quizStep}-unsafe`}
                        onClick={() => answerQuizQuestion(quizStep - 1, activeQuestion.key, "unsafe")}
                        className="choice"
                      >
                        {activeQuestion.unsafe}
                      </button>
                    </div>

                    <p style={{ marginTop: "var(--s-5)", marginBottom: 0 }}>
                      <button id="btn-back-step" onClick={() => setQuizStep(quizStep - 1)} className="linkbutton">
                        ← Kembali ke pertanyaan sebelumnya
                      </button>
                    </p>
                  </div>
                )}

                {/* STEP 5: SUMMARY */}
                {quizStep === 5 && (
                  <div id="quiz-results" ref={resultRef} tabIndex={-1} className="result" style={{ outline: "none" }}>
                    <div className="callout callout--note" style={{ marginTop: 0 }}>
                      {parseMarkdown(quizResult)}
                      <p className="small muted" style={{ marginTop: "var(--s-3)" }}>
                        Ringkasan ini disusun otomatis dari 4 jawabanmu dan tidak dikirim ke mana pun. Ini edukasi awal dan tidak menggantikan penilaian petugas UTD.{" "}
                        <SourceLinks refs={[{ id: "permenkes" }, { id: "pmi-faq" }, { id: "who-eligibility" }]} /> ·{" "}
                        <a href="#sumber-informasi">Semua sumber</a>
                      </p>
                    </div>

                    <div role="note" className="callout callout--caution">
                      <p className="kicker">Penting</p>
                      <p>
                        <strong>{MEDICAL_DISCLAIMER}</strong>
                      </p>
                    </div>

                    <HeroCard visitorName={visitorName} />

                    <ul className="ruled" style={{ marginTop: "var(--s-5)" }}>
                      <li>
                        <strong>Ada di mana Kantor PMI terdekat?</strong>
                        Cari UTD PMI terdekat lewat ayodonor.pmi.or.id atau peta digital, lalu pastikan jam layanannya sebelum datang.
                      </li>
                      <li>
                        <strong>Tips sebelum berangkat</strong>
                        Tidur cukup, makan dan minum seperti biasa, lalu ikuti arahan petugas saat di lokasi.
                      </li>
                    </ul>

                    <p style={{ marginBottom: 0 }}>
                      <button id="btn-reset-quiz" onClick={resetQuiz} aria-label="Ulangi kuis" className="btn btn--quiet">
                        Ulangi kuis
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <Faq />

        <SourcesSection />

        {/* 06 HUBUNGI PMI */}
        <section id="pmi-locator-container" aria-labelledby="hubungi-title" className="section">
          <div className="wrap section__inner">
            <div className="section__head">
              <p className="kicker">06 · Hubungi PMI</p>
              <h2 id="hubungi-title">Kapan menghubungi PMI atau tenaga medis</h2>
              <p className="deck">AyoDonor tidak bisa menilai kondisi pribadimu.</p>
            </div>

            <div className="section__body">
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

              <PmiLocator />
            </div>
          </div>
        </section>

        <PrivacyNotice />
      </main>

      <footer className="footer">
        <div className="wrap">
          <div className="footer__grid">
            <div>
              <h2>Tentang AyoDonor</h2>
              <p style={{ maxWidth: "34rem" }}>
                Proyek edukasi independen tentang donor darah untuk generasi muda Indonesia. AyoDonor bukan layanan medis dan tidak berafiliasi dengan PMI maupun Kemenkes.
              </p>
            </div>

            <nav aria-label="Navigasi footer">
              <h2>Navigasi</h2>
              <ul>
                <li>
                  <a href="#education">Dasar-dasar Donor Darah</a>
                </li>
                <li>
                  <a href="#pmi-locator-container">Contoh Lokasi (Data Demo)</a>
                </li>
                <li>
                  <a href="#quiz-section">Kuis Panduan Awal</a>
                </li>
                <li>
                  <a href="#faq-section">Tanya Jawab (FAQ)</a>
                </li>
                <li>
                  <a href="#sumber-informasi">Sumber Informasi</a>
                </li>
                <li>
                  <a href="#privasi">Privasi &amp; Data</a>
                </li>
              </ul>
            </nav>

            <div>
              <h2>Informasi medis &amp; disclaimer</h2>
              <p>
                Kuis dan teks di AyoDonor hanya untuk edukasi. Bukan diagnosis, bukan keputusan kelayakan, dan bukan nasihat medis. Kelayakan donor ditentukan petugas PMI lewat pemeriksaan langsung. Data lokasi dan stok di situs ini adalah contoh yang belum diverifikasi.
              </p>
              <p style={{ marginBottom: 0 }}>
                <SourceLinks refs={[{ id: "permenkes" }, { id: "pmi-faq" }, { id: "who-eligibility" }]} />
                <br />
                <a href="#sumber-informasi">Semua sumber dan perbedaannya</a>. Daftar klaim dan statusnya ada di docs/medical-claims.md.
              </p>
            </div>
          </div>

          <div className="footer__base">
            <span>© {new Date().getFullYear()} AyoDonor. Dibuat dengan penuh rasa hormat kepedulian kemanusiaan bagi keselamatan sesama.</span>
            <span>Info resmi: ayodonor.pmi.or.id</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
