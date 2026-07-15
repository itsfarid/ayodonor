import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazily initialize Gemini to prevent start crashes if GEMINI_API_KEY is not defined yet
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Using local fallbacks for AI features.");
        return null;
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // --- API Endpoints ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "AyoDonor server running gracefully!" });
  });

  // Evaluate donor eligibility quiz with Gemini AI
  app.post("/api/gemini/evaluate", async (req, res) => {
    const { name, ageWeight, sleep, meds, recency } = req.body;
    const client = getGeminiClient();

    // Eligibility check logic (all must be "safe")
    const isEligible = ageWeight === "safe" && sleep === "safe" && meds === "safe" && recency === "safe";

    if (!client) {
      // Prompt-compliant energetic and humorous local fallback if Gemini isn't configured yet
      if (isEligible) {
        return res.json({
          success: true,
          text: `### 🎉 Mantap Jiwa, **${name || "Sobat Hero"}**! \n\nKamu **100% SIAP SENSOR** alias lolos kriteria utama donor darah! \n\n*   **Umur & Badan:** Sip banget!\n*   **Tidur:** Cukup dan bugar!\n*   **Kondisi medis:** Fit luar dalam!\n*   **Jeda Jarak:** Aman tentram!\n\nYuk, langsung meluncur ke unit PMI terdekat! Satu kantong darah darimu bisa jadi mukjizat buat 3 nyawa. Jangan lupa minum air yang cukup sebelum disuntik ya, gaes! 🩸🚀`
        });
      } else {
        let adviceList = [];
        if (ageWeight !== "safe") adviceList.push("*   **Umur / BB Belum Pas:** Minimal umur 17 tahun dan berat badan 45 kg ya, bro/sis. Tubuh butuh sirkulasi darah yang stabil agar kamu gak lemas.");
        if (sleep !== "safe") adviceList.push("*   **Begadang Mania:** Tidur semalam kurang dari 5 jam itu bisa bikin tekanan darah ngaco pas dicek dokter. Mending kamu istirahat dulu sekarang, rebahan manja, dan dateng lagi besok!");
        if (meds !== "safe") adviceList.push("*   **Detoks Obat / Haid:** Tubuh wanita saat haid kehilangan zat besi, dan obat-obatan/antibiotik di darah butuh waktu tersaring keluar. Istirahat dulu sampai masa penyembuhan selesai ya!");
        if (recency !== "safe") adviceList.push("*   **Jeda Terlalu Kilat:** Harus ada jarak minimal 2 bulan antar donor atau 6 bulan pasca bikin tato/tindik agar antibodi dan sel darahmu benar-benar steril.");

        return res.json({
          success: true,
          text: `### 🩸 Selangkah Lagi Jadi Hero, **${name || "Sobat"}**! \n\nNiat muliamu patut diacungi jempol, tapi tubuhmu hari ini ngasih sinyal untuk re-charge dulu. Berikut catatan kecil buatmu:\n\n${adviceList.join("\n")}\n\n**Solusi Santuy:** Jangan berkecil hati! Minum air putih hangat yang banyak hari ini, tidur pules 7-8 jam nanti malam, dan yuk coba cek kelayakan lagi lain hari. Kamu tetap calon pahlawan pelipur lara! 🌟`
        });
      }
    }

    try {
      const prompt = `Lakukan evaluasi kelayakan donor darah berdasarkan data berikut:
Nama Pengguna: ${name || "Sobat Hero"}
1. Umur & Berat Badan (Kategori 17-60 thn & BB >= 45 kg): ${ageWeight === 'safe' ? 'Ya (Lolos)' : 'Tidak Lolos (BB di bawah 45kg atau usia belum mencukupi)'}
2. Pola Tidur Semalam (Minimal 5 jam): ${sleep === 'safe' ? 'Cukup (Lolos)' : 'Begadang / Kurang Tidur'}
3. Kondisi Medis / Obat-obatan & Haid: ${meds === 'safe' ? 'Aman (Lolos)' : 'Sedang minum antibiotik, obat keras, atau sedang datang bulan'}
4. Jarak Waktu Donor (Min 2 bulan) & Tato/Tindik baru (Min 6 bulan): ${recency === 'safe' ? 'Aman (Lolos)' : 'Baru donor belakangan ini atau baru tato/tindik'}

Hasil Kelayakan Teknis: ${isEligible ? "LOLOS MENYAMBAR" : "TERTUNDA DULU SEMESTARA"}

Tulis evaluasi ini dengan gaya bahasa anak muda Indonesia yang super kasual, penuh canda tapi edukatif dan ilmiah ringan (Jakarta/Kekinian slang, gunakan panggilan santai seperti bro, sis, gokil, keren, kuy).
Gaya Evaluasi:
- Jika LOLOS: Berikan apresiasi heboh, jelaskan dengan analogi asyik manfaat tubuh yang di-reset (ganti oli, bakar kalori gila-gilaan, bikin kulit seger) dan selamatkan 3 nyawa. Ajakan gaspol ke PMI terdekat.
- Jika BELUM LOLOS: Jelaskan alasan mengapa parameter yang gagal (misal kurang tidur atau haid/obat) secara medis mengharuskan dia menunda donor darah demi kesehatannya sendiri. Sampaikan ini dengan nada merangkul, menghibur, sangat suportif, dan beri tahu tips bersiap diri untuk hari besok. Jangan buat dia kecewa atau sedih!

Format respon kamu menggunakan Markdown yang rapi dan elegan.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Kamu adalah 'AyoDonor Personal Buddy', asisten interaktif donor darah tergaul yang membakar semangat anak muda Indonesia untuk berani mendonor darah secara aman, ramah, dan bebas stress.",
        }
      });

      res.json({ success: true, text: response.text });
    } catch (err: any) {
      console.error("Gemini evaluate error:", err);
      res.status(500).json({ error: "Gagal memproses evaluasi AI. Silakan coba lagi nanti!" });
    }
  });

  // Chat/Q&A Companion
  app.post("/api/gemini/chat", async (req, res) => {
    const { message, history } = req.body;
    const client = getGeminiClient();

    if (!client) {
      // Local fallback auto-answering prompt questions with high-quality humorous responses
      let reply = "Waduh, AI Buddy lagi re-charge darah dulu! Tapi secara garis besar, donor darah itu asyik, menyehatkan, gak bikin gemuk, dan jarumnya gak seserem jarum fitnah kok! Ada pertanyaan lain yang mau kamu kulik?";
      const msgLower = (message || "").toLowerCase();

      const keywords = ["donor", "darah", "jarum", "sakit", "lemas", "lemes", "pusing", "haid", "obat", "tato", "tindik", "tensi", "hb", "gemuk", "berat", "kelayakan", "tidur", "pmi", "kesehatan", "tubuh", "nyawa", "pahlawan", "hero", "manfaat", "syarat", "plasma", "trombosit", "kantong"];
      const isRelated = keywords.some(kw => msgLower.includes(kw));

      if (!isRelated) {
        reply = "### 🥤 Waduh, OOT (Out of Topic) Nih, Sob! \n\nTopik itu menarik banget (kayak manis-gurihnya es cendol, atau hal seru lainnya!), tapi **AyoDonor Buddy** ini khusus dilatih untuk membahas seputar donor darah, mitos medis, serta info kelayakan kesehatan tubuh demi aksi heroik menyelamatkan 3 nyawa! \n\nDaripada ngomongin yang lain, yuk tanyain hal seputar donor darah aja. Contohnya: \n* 'Apakah donor darah bikin gemuk?' \n* 'Takut jarum suntik, gimana dong?' \n* 'Kenapa gak boleh begadang sebelum donor?'";
      } else if (msgLower.includes("gemuk")) {
        reply = "### 🛑 Mitos Gedenya: 'Donor Darah Bikin Badan Gemuk/Melar'\n\n**Faktanya:** Ini mah mitos tatanan semesta kuliner, bro/sis! \n\nPas kamu donor, tubuh kamu itu membakar energi sekitar **650 kalori** demi mengganti darah yang disumbangin. Itu setara lari santai selama 45 menit! \n\n*Kenapa ada stigma bikin gemuk?* \nSoalnya setelah donor, biasanya PMI kasih asupan teh anget, telur rebus, plus biskuit cokelat manis. Nah, kalau pulangnya kita balas dendam pesen ayam geprek plus boba bumbu cinta 2 porsi, ya itu yang bikin melar! Jadi intinya, kontrol kalori setelah mendonor ya!";
      } else if (msgLower.includes("jarum") || msgLower.includes("takut") || msgLower.includes("sakit")) {
        reply = "### 💉 Tips Anti-Phobia: 'Gemetar Liat Jarum Suntik'\n\n**Santuy, kamu gak sendirian!** Banyak calon hero yang aslinya berotot kekar tapi langsung lemes pas liat jarum. \n\nBerikut rahasia dapet lencana hero tanpa rasa drama:\n1.  **Gak usah diliat:** Pas dokter mau tusuk, buang muka ke arah berlawanan. \n2.  **Mikirin Seblak:** Bayangin aroma baso aci kuah seblak pedas level 5 kesukaanmu. Ketakutanmu bakal berpindah jadi laper!\n3.  **Hanya 3 Detik:** Rasa cubitannya cuma secuil kayak digigit semut merah lewat. Setelah nancep, sisanya kamu tinggal rebahan nonton video lucu selama 10 menit. Easy peasy!";
      } else if (msgLower.includes("lemas") || msgLower.includes("pusing")) {
        reply = "### 🌀 'Apakah Habis Donor Bakal Lemas dan Goyang Dombret?'\n\n**Faktanya:** Enggak dong, asal persiapannya bener! \n\nBadan kita punya stok darah melimpah. Sekali donor cuma diambil sekitar 350-450 ml (gak sampe 10% total darah tubuh). Tubuhmu bakal langsung memproduksi sel-sel baru berselimut oksigen seger dalam waktu singkat. \n\n**Resep anti-lemas:** \n*   Tidur nyenyak semalam sebelum donor (min 6 jam).\n*   Minum air putih minimal 2-3 gelas sebelum meluncur ke PMI.\n*   Jangan langsung akrobat salto atau angkat beban berat sehabis jarum ditarik. Santai dulu sambil ngunyah camilan manis!";
      } else if (msgLower.includes("tato") || msgLower.includes("tindik")) {
        reply = "### 🎨 'Punya Tato / Tindik Boleh Donor Gak Sih?'\n\n**Boleh banget, asalkan sabar!** \n\nPMI gak ngelarang anak seni bertato buat jadi hero. Kuncinya cuma satu: **Jeda waktu minimal 6 bulan** sejak pembuatan tato atau tindik terakhir. \n\n*Kenapa?* Ini demi masa pembersihan (window period) untuk memastikan jarum tato yang dipakai benar-benar bersih dan bebas dari potensi virus menular seperti Hepatitis. Setelah 6 bulan, pintu registrasi hero terbuka lebar buat kamu!";
      }
      return res.json({ success: true, text: reply });
    }

    try {
      const formattedContents = [];
      if (history && Array.isArray(history)) {
        for (const h of history) {
          formattedContents.push({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.text }]
          });
        }
      }
      formattedContents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: `Kamu adalah 'Sobat Hero AI', konsultan gaul, kocak, humoris, pinter, dan super bersahabat dari AyoDonor. Tugasmu menjawab kekhawatiran, ketakutan, dan mitos seputar donor darah.

CRITICAL TOPIC REGULATION (PEMBATASAN TOPIK MUTLAK):
- Kamu hanya diprogram untuk menjawab pertanyaan seputar donor darah, donor organ, kepramukaan palang merah, kesehatan tubuh sebelum donor (misal porsi tidur, berat badan, tensi darah, hemoglobin Hb, obat-obatan), mitos medis, serta panduan ke PMI.
- Jika pengguna menanyakan hal di luar konteks ini (seperti "cara membuat es cendol", "belajar coding", "resep mie ayam", "luas segitiga", atau info politik negara), kamu secara mutlak dilarang keras menjawab panduan asli tersebut!
- Kamu HARUS menolaknya secara halus, humoris, gaul, kemudian menyambungkannya kembali ke pentingnya donor darah! Contoh penolakan: 'Eits, daripada ngeracik es cendol manis gurih, mending racik kesehatan tubuhmu biar darahmu selalu manis bertenaga buat nerima sertifikat hero! Yuk nanya seputar donor darah aja, kuy!'
- Tetap gunakan bahasa santai pergaulan anak muda Indonesia masa kini (lu, gue, bro, sis, gokil, kuy, jangan kaku parah).
- Jawab mitos-mitos merugikan (takut gemuk, lemas, phobia jarum, tato, dsb) secara logis, ilmiah sederhana, tapi diselingi lawakan segar dan analogi kocak.
- Selalu berikan respon terstruktur dengan bullet points atau list jika menjelaskan tips, agar sangat mudah dibaca lewat layar HP.`
        }
      });

      res.json({ success: true, text: response.text });
    } catch (err: any) {
      console.error("Gemini chat error:", err);
      res.status(500).json({ error: "Koneksi AI lagi sibuk nih, coba tanya sekali lagi ya!" });
    }
  });

  // --- Static Asset Serving & Dev Server Setup ---

  if (process.env.NODE_ENV !== "production") {
    // Development mode via Vite
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    // Production serving statically compiled files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving production static assets from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AyoDonor application server runs on: http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical server starting error:", error);
});
