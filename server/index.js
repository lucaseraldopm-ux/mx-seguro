const express = require("express");
const cors = require("cors");

// Puxa o prisma já configurado (com adapter e DATABASE_URL)
const { prisma } = require("./adapters/SourceAdapter");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/status", async (req, res) => {
  try {
    // Ping no banco (não depende das tabelas)
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "ok" });
  } catch (e) {
    res.status(500).json({ ok: false, db: "error", message: String(e?.message || e) });
  }
});

// Endpoint simples pra Render Health Check
app.get("/", (req, res) => res.send("mx-seguro-api up"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MX Seguro API running on ${PORT}`));