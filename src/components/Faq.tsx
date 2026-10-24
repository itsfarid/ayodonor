import { useMemo, useState } from "react";
import { FAQ_CATEGORIES, FAQ_ITEMS, searchFaq } from "../data/faq";
import SourceLinks from "./SourceLinks";

export default function Faq() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchFaq(FAQ_ITEMS, query), [query]);

  return (
    <section id="faq-section" aria-labelledby="faq-title" className="section">
      <div className="wrap section__inner">
        <div className="section__head">
          <p className="kicker">04 · Tanya jawab</p>
          <h2 id="faq-title">Tanya Jawab (FAQ)</h2>
          <p className="deck">
            Jawaban umum seputar donor darah beserta tautan sumbernya (lengkap di <a href="#sumber-informasi">Sumber informasi</a>). Bukan nasihat medis; petugas PMI yang memutuskan.
          </p>
        </div>

        <div className="section__body">
          <div className="field">
            <label htmlFor="faq-search">Cari pertanyaan</label>
            <input
              id="faq-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari, misalnya: tato, jeda, obat..."
              className="input"
              autoComplete="off"
            />
            <p className="hint" role="status">
              {results.length === 0 ? "Tidak ada pertanyaan yang cocok." : `${results.length} pertanyaan`}
            </p>
          </div>

          {results.length === 0 ? (
            <div className="callout callout--note">
              <p>Tidak ada hasil. Coba kata lain, atau tanyakan ke UTD PMI terdekat / ayodonor.pmi.or.id.</p>
            </div>
          ) : (
            FAQ_CATEGORIES.map((category) => {
              const items = results.filter((i) => i.category === category);
              if (items.length === 0) return null;
              return (
                <div key={category} className="faq-group">
                  <h3>{category}</h3>
                  {items.map((item) => (
                    <details key={item.id} className="faq-item">
                      <summary>{item.question}</summary>
                      <div className="faq-item__body">
                        <p>{item.answer}</p>
                        <p className="small">
                          <SourceLinks refs={item.refs} />
                          {item.refs.length > 0 && item.note ? " " : ""}
                          {item.note && <span className="source-links">Catatan: {item.note}.</span>}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
