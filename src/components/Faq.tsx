import { useMemo, useState } from "react";
import { FAQ_CATEGORIES, FAQ_ITEMS, searchFaq } from "../data/faq";
import SourceLinks from "./SourceLinks";

export default function Faq() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchFaq(FAQ_ITEMS, query), [query]);

  return (
    <section id="faq-section" aria-labelledby="faq-title" className="bg-white border-t border-slate-200 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 id="faq-title" className="text-3xl font-black text-slate-800">
            Tanya Jawab (FAQ) 💬
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Jawaban umum seputar donor darah beserta tautan sumbernya (lengkap di <a href="#sumber-informasi" className="underline text-red-800">Sumber informasi</a>). Bukan nasihat medis; petugas PMI yang memutuskan.
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="faq-search" className="sr-only">
            Cari pertanyaan
          </label>
          <input
            id="faq-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari, misalnya: tato, jeda, obat..."
            className="w-full p-3.5 border border-slate-300 focus:border-red-500 focus:outline-none rounded-xl text-sm"
          />
          <p className="text-xs text-slate-600 mt-2" role="status">
            {results.length === 0 ? "Tidak ada pertanyaan yang cocok." : `${results.length} pertanyaan`}
          </p>
        </div>

        {results.length === 0 ? (
          <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4">
            Tidak ada hasil. Coba kata lain, atau tanyakan ke UTD PMI terdekat / ayodonor.pmi.or.id.
          </p>
        ) : (
          FAQ_CATEGORIES.map((category) => {
            const items = results.filter((i) => i.category === category);
            if (items.length === 0) return null;
            return (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-extrabold text-red-700 uppercase tracking-wider mb-2">{category}</h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <details key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 group">
                      <summary className="cursor-pointer font-bold text-sm text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded">
                        {item.question}
                      </summary>
                      <p className="text-sm text-slate-700 leading-relaxed mt-3">{item.answer}</p>
                      <p className="mt-2">
                        <SourceLinks refs={item.refs} />
                        {item.refs.length > 0 && item.note ? " " : ""}
                        {item.note && <span className="text-[11px] text-slate-600">Catatan: {item.note}.</span>}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
