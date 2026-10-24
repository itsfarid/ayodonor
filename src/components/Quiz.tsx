import React, { useEffect, useRef, useState } from "react";
import HeroCard from "./HeroCard";
import SourceLinks from "./SourceLinks";
import { Link } from "../router";
import { buildQuizSummary, MEDICAL_DISCLAIMER, type QuizAnswer } from "../../shared/content";
import type { SourceRef } from "../data/sources";

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
    refs: [{ id: "permenkes", locator: "hal. 55-56" }, { id: "who-eligibility" }],
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
    refs: [{ id: "permenkes", locator: "hal. 59, formulir 3.2 hal. 276" }],
    safe: "Tidak sedang sakit atau berobat",
    unsafe: "Ya, sedang sakit atau berobat",
  },
  {
    key: "recency",
    category: "Jeda waktu",
    text: () =>
      "Pertanyaan terakhir: apakah kamu baru-baru ini donor darah (dalam 3 bulan terakhir), atau membuat tato, tindik, atau akupunktur (dalam 1 tahun terakhir)?",
    help: "Jeda minimal berbeda antar sumber resmi (donor: 2-3 bulan; tato/tindik: beberapa bulan hingga 1 tahun), jadi kami memakai rentang yang paling hati-hati. Petugas PMI yang memutuskan.",
    refs: [{ id: "permenkes", locator: "hal. 58, 63" }, { id: "pmi-faq" }, { id: "who-eligibility" }],
    safe: "Tidak, sudah lewat atau tidak pernah",
    unsafe: "Ya, baru-baru ini",
  },
];

const EMPTY_ANSWERS: Record<QuizKey, QuizAnswer> = { ageWeight: "", sleep: "", meds: "", recency: "" };


/** The four-question starter quiz and its neutral summary. Everything runs in the browser. */
export default function Quiz() {
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
              <Link to="/tentang#sumber-informasi">Semua sumber</Link>
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
  );
}
