// Local fallback responses used when Gemini is unconfigured or its quota is exhausted.

export function buildEvaluateFallback(
  name: string | undefined,
  ageWeight: string,
  sleep: string,
  meds: string,
  recency: string,
  isEligible: boolean
): string {
  if (isEligible) {
    return `### 🎉 Mantap Jiwa, **${name || "Sobat Hero"}**! \n\nBerdasarkan 4 pertanyaan ini, kamu **KEMUNGKINAN BESAR** memenuhi syarat awal — tapi keputusan akhir tetap ditentukan lewat pemeriksaan medis langsung di PMI (cek Hb, tensi, riwayat kesehatan lengkap).\n\n*   **Umur & Badan:** Sip banget!\n*   **Tidur:** Cukup dan bugar!\n*   **Kondisi medis:** Fit luar dalam!\n*   **Jeda Jarak:** Aman tentram!\n\nYuk, datang ke unit PMI terdekat buat screening resmi. Satu kantong darah darimu bisa jadi mukjizat buat 3 nyawa. Jangan lupa minum air yang cukup sebelum datang ya, gaes! 🩸🚀`;
  }

  const adviceList = [];
  if (ageWeight !== "safe") adviceList.push("*   **Umur / BB Belum Pas:** Minimal umur 17 tahun dan berat badan 45 kg ya, bro/sis. Tubuh butuh sirkulasi darah yang stabil agar kamu gak lemas.");
  if (sleep !== "safe") adviceList.push("*   **Begadang Mania:** Tidur semalam kurang dari 5 jam itu bisa bikin tekanan darah ngaco pas dicek dokter. Mending kamu istirahat dulu sekarang, rebahan manja, dan dateng lagi besok!");
  if (meds !== "safe") adviceList.push("*   **Detoks Obat / Haid:** Tubuh wanita saat haid kehilangan zat besi, dan obat-obatan/antibiotik di darah butuh waktu tersaring keluar. Istirahat dulu sampai masa penyembuhan selesai ya!");
  if (recency !== "safe") adviceList.push("*   **Jeda Terlalu Kilat:** Harus ada jarak minimal 2 bulan antar donor atau 6 bulan pasca bikin tato/tindik agar antibodi dan sel darahmu benar-benar steril.");

  return `### 🩸 Selangkah Lagi Jadi Hero, **${name || "Sobat"}**! \n\nNiat muliamu patut diacungi jempol, tapi tubuhmu hari ini ngasih sinyal untuk re-charge dulu. Berikut catatan kecil buatmu:\n\n${adviceList.join("\n")}\n\n**Solusi Santuy:** Jangan berkecil hati! Minum air putih hangat yang banyak hari ini, tidur pules 7-8 jam nanti malam, dan yuk coba cek kelayakan lagi lain hari. Kamu tetap calon pahlawan pelipur lara! 🌟`;
}

export function buildChatFallback(message: string): string {
  let reply = "Waduh, AI Buddy lagi re-charge darah dulu! Tapi secara garis besar, donor darah itu asyik, menyehatkan, gak bikin gemuk, dan jarumnya gak seserem jarum fitnah kok! Ada pertanyaan lain yang mau kamu kulik?";
  const msgLower = (message || "").toLowerCase();

  const keywords = ["donor", "darah", "jarum", "sakit", "lemas", "lemes", "pusing", "haid", "obat", "tato", "tindik", "tensi", "hb", "gemuk", "berat", "kelayakan", "tidur", "pmi", "kesehatan", "tubuh", "nyawa", "pahlawan", "hero", "manfaat", "syarat", "plasma", "trombosit", "kantong"];
  const isRelated = keywords.some(kw => msgLower.includes(kw));

  if (!isRelated) {
    reply = "### 🥤 Waduh, OOT (Out of Topic) Nih, Sob! \n\nTopik itu menarik banget (kayak manis-gurihnya es cendol, atau hal seru lainnya!), tapi **AyoDonor Buddy** ini khusus dilatih untuk membahas seputar donor darah, mitos medis, serta info kelayakan kesehatan tubuh demi aksi heroik menyelamatkan 3 nyawa! \n\nDaripada ngomongin yang lain, yuk tanyain hal seputar donor darah aja. Contohnya: \n* 'Apakah donor darah bikin gemuk?' \n* 'Takut jarum suntik, gimana dong?' \n* 'Kenapa gak boleh begadang sebelum donor?'";
  } else if (msgLower.includes("gemuk")) {
    reply = "### 🛑 Mitos Gedenya: 'Donor Darah Bikin Badan Gemuk/Melar'\n\n**Faktanya:** Ini mitos, bro/sis! Donor darah **bukan** program diet.\n\nPas kamu donor, tubuh memang memakai energi ekstra untuk regenerasi darah yang disumbangkan — itu efek samping regenerasi, bukan alasan utama buat datang ke PMI. Motivasi utamanya tetap **menyelamatkan sampai 3 nyawa**.\n\n*Kenapa ada stigma bikin gemuk?* \nSoalnya setelah donor, biasanya PMI kasih asupan teh anget, telur rebus, plus biskuit cokelat manis. Nah, kalau pulangnya kita balas dendam pesen ayam geprek plus boba 2 porsi, ya itu yang bikin melar! Jadi intinya, kontrol porsi makan setelah mendonor ya!";
  } else if (msgLower.includes("jarum") || msgLower.includes("takut") || msgLower.includes("sakit")) {
    reply = "### 💉 Tips Anti-Phobia: 'Gemetar Liat Jarum Suntik'\n\n**Santuy, kamu gak sendirian!** Banyak calon hero yang aslinya berotot kekar tapi langsung lemes pas liat jarum. \n\nBerikut rahasia dapet lencana hero tanpa rasa drama:\n1.  **Gak usah diliat:** Pas dokter mau tusuk, buang muka ke arah berlawanan. \n2.  **Mikirin Seblak:** Bayangin aroma baso aci kuah seblak pedas level 5 kesukaanmu. Ketakutanmu bakal berpindah jadi laper!\n3.  **Hanya 3 Detik:** Rasa cubitannya cuma secuil kayak digigit semut merah lewat. Setelah nancep, sisanya kamu tinggal rebahan nonton video lucu selama 10 menit. Easy peasy!";
  } else if (msgLower.includes("lemas") || msgLower.includes("pusing")) {
    reply = "### 🌀 'Apakah Habis Donor Bakal Lemas dan Goyang Dombret?'\n\n**Faktanya:** Enggak dong, asal persiapannya bener! \n\nBadan kita punya stok darah melimpah. Sekali donor cuma diambil sekitar 350-450 ml (gak sampe 10% total darah tubuh). Tubuhmu bakal langsung memproduksi sel-sel baru berselimut oksigen seger dalam waktu singkat. \n\n**Resep anti-lemas:** \n*   Tidur nyenyak semalam sebelum donor (min 6 jam).\n*   Minum air putih minimal 2-3 gelas sebelum meluncur ke PMI.\n*   Jangan langsung akrobat salto atau angkat beban berat sehabis jarum ditarik. Santai dulu sambil ngunyah camilan manis!";
  } else if (msgLower.includes("tato") || msgLower.includes("tindik")) {
    reply = "### 🎨 'Punya Tato / Tindik Boleh Donor Gak Sih?'\n\n**Boleh banget, asalkan sabar!** \n\nPMI gak ngelarang anak seni bertato buat jadi hero. Kuncinya cuma satu: **Jeda waktu minimal 6 bulan** sejak pembuatan tato atau tindik terakhir. \n\n*Kenapa?* Ini demi masa pembersihan (window period) untuk memastikan jarum tato yang dipakai benar-benar bersih dan bebas dari potensi virus menular seperti Hepatitis. Setelah 6 bulan, pintu registrasi hero terbuka lebar buat kamu!";
  }

  return reply;
}
