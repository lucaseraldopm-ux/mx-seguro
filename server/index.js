const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// Se você já está usando Prisma no projeto, mantém import pra /status (ping)
// (se não tiver, pode apagar essas 2 linhas)
const { prisma } = require("./adapters/SourceAdapter");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Limiter (anti-spam) para reports
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Demasiadas requisiciones, por favor intenta más tarde." },
});

// Mock data (pra app funcionar agora, depois a gente liga no banco)
let reports = [];

let incidents = [
  {
    id: "evt-1",
    title: "Bloqueo Vial",
    category: "Bloqueo",
    coordinate: { latitude: 25.43, longitude: -100.0 },
    date: new Date().toISOString(),
    riskLevel: "HIGH",
    description: "Paro con vehículos pesados en carretera.",
    confidence: "ALTA",
    sourceTag: "Oficial - SSC",
  },
  {
    id: "evt-2",
    title: "Retén irregular",
    category: "Retén",
    coordinate: { latitude: 19.43, longitude: -99.13 },
    date: new Date().toISOString(),
    riskLevel: "MEDIUM",
    description: "Ponto de controle não identificado em via principal.",
    confidence: "MÉDIA",
    sourceTag: "Relatos verificados",
  },
  {
    id: "evt-3",
    title: "Disturbio",
    category: "Disturbio",
    coordinate: { latitude: 20.67, longitude: -103.35 },
    date: new Date().toISOString(),
    riskLevel: "MEDIUM",
    description: "Aglomeração e tensão local.",
    confidence: "MÉDIA",
    sourceTag: "Agregado",
  },
  {
    id: "evt-4",
    title: "Enfrentamiento reportado",
    category: "Confrontación",
    coordinate: { latitude: 24.8, longitude: -107.39 },
    date: new Date().toISOString(),
    riskLevel: "HIGH",
    description: "Relato de tiros e movimentação intensa.",
    confidence: "ALTA",
    sourceTag: "Agregado + relatos",
  },
];

let globalStatus = {
  lastUpdatedAt: new Date().toISOString(),
  coverage: "Norte e Centro do México",
  sources: {
    official: "OK",
    user_reports: "OK",
    news_aggregators: "PARCIAL",
  },
};

// Home/health
app.get("/", (req, res) => res.send("mx-seguro-api up"));

// Status (com ping no banco se prisma existir)
app.get("/status", async (req, res) => {
  try {
    if (prisma?.$queryRaw) {
      await prisma.$queryRaw`SELECT 1`;
    }
    res.json({
      ok: true,
      lastUpdatedAt: new Date().toISOString(),
      sources: { mock: true },
      coverage: "mock",
    });
  } catch (e) {
    res.status(200).json({
      ok: true,
      db: "warning",
      message: String(e?.message || e),
      lastUpdatedAt: new Date().toISOString(),
      sources: { mock: true },
      coverage: "mock",
    });
  }
});

// 1) GET /api/status (app)
app.get("/api/status", (req, res) => {
  res.json({
    ...globalStatus,
    lastUpdatedAt: new Date().toISOString(),
  });
});

// 2) GET /risk (app)
app.get("/risk", (req, res) => {
  const { zoomLevel } = req.query;

  if (zoomLevel === "far") {
    return res.json([
      {
        id: "reg-1",
        name: "Nuevo León",
        type: "region",
        riskLevel: "MEDIUM",
        coordinate: { latitude: 25.5, longitude: -99.8 },
        confidence: "ALTA",
        sourceTag: "Agregado",
      },
      {
        id: "reg-2",
        name: "Sinaloa",
        type: "region",
        riskLevel: "HIGH",
        coordinate: { latitude: 24.8, longitude: -107.4 },
        confidence: "MÉDIA",
        sourceTag: "Agregado",
      },
      {
        id: "reg-3",
        name: "CDMX",
        type: "region",
        riskLevel: "MEDIUM",
        coordinate: { latitude: 19.43, longitude: -99.13 },
        confidence: "MÉDIA",
        sourceTag: "Agregado",
      },
      {
        id: "reg-4",
        name: "Jalisco",
        type: "region",
        riskLevel: "MEDIUM",
        coordinate: { latitude: 20.67, longitude: -103.35 },
        confidence: "MÉDIA",
        sourceTag: "Agregado",
      },
    ]);
  }

  // close (grid/polígono)
  return res.json([
    {
      id: "grid-1",
      name: "Grid Monterrey Sur",
      type: "cell",
      riskLevel: "MEDIUM",
      coordinates: [
        { latitude: 25.6, longitude: -100.4 },
        { latitude: 25.6, longitude: -100.2 },
        { latitude: 25.4, longitude: -100.2 },
        { latitude: 25.4, longitude: -100.4 },
      ],
      description: "Riesgo moderado basado en reportes locales.",
      lastUpdate: new Date().toISOString(),
      confidence: "MÉDIA",
      sourceTag: "Agregado Múltiple",
    },
    {
      id: "grid-2",
      name: "Grid CDMX Centro",
      type: "cell",
      riskLevel: "MEDIUM",
      coordinates: [
        { latitude: 19.48, longitude: -99.2 },
        { latitude: 19.48, longitude: -99.05 },
        { latitude: 19.38, longitude: -99.05 },
        { latitude: 19.38, longitude: -99.2 },
      ],
      description: "Atención a reportes puntuales.",
      lastUpdate: new Date().toISOString(),
      confidence: "MÉDIA",
      sourceTag: "Agregado",
    },
  ]);
});

// 3) GET /incidents (app)
app.get("/incidents", (req, res) => {
  res.json(incidents);
});

// 4) POST /reports (app)
app.post("/reports", reportLimiter, (req, res) => {
  const { category, description, coordinate } = req.body;

  if (!category || !description || !coordinate) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const snappedCoordinate = {
    latitude: Number(coordinate.latitude).toFixed(2),
    longitude: Number(coordinate.longitude).toFixed(2),
  };

  const newReport = {
    id: "rep-" + Date.now(),
    category,
    description,
    coordinate: snappedCoordinate,
    date: new Date().toISOString(),
    status: "En revisión",
  };

  reports.push(newReport);

  setTimeout(() => {
    const idx = reports.findIndex((r) => r.id === newReport.id);
    if (idx !== -1) reports[idx].status = "Verificado";
  }, 30000);

  res.status(201).json(newReport);
});

// 5) GET /reports (clusters) (app)
app.get("/reports", (req, res) => {
  const verified = reports.filter((r) => r.status === "Verificado");

  const aggregated = {};
  verified.forEach((r) => {
    const key = `${r.coordinate.latitude},${r.coordinate.longitude}`;
    if (!aggregated[key]) {
      aggregated[key] = { coordinate: r.coordinate, count: 1, categories: [r.category] };
    } else {
      aggregated[key].count += 1;
      if (!aggregated[key].categories.includes(r.category)) aggregated[key].categories.push(r.category);
    }
  });

  const clusteredResponse = Object.keys(aggregated).map((key) => ({
    id: `cluster-${key}`,
    coordinate: {
      latitude: parseFloat(aggregated[key].coordinate.latitude),
      longitude: parseFloat(aggregated[key].coordinate.longitude),
    },
    count: aggregated[key].count,
    categories: aggregated[key].categories,
    title: `${aggregated[key].count} reportes aquí`,
  }));

  res.json(clusteredResponse);
});

// Compat: mantém /api/* também (caso alguma tela use)
app.get("/api/risk", (req, res) => {
  req.url = "/risk" + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "");
  return app._router.handle(req, res, () => {});
});
app.get("/api/incidents", (req, res) => app._router.handle({ ...req, url: "/incidents" }, res, () => {}));
app.get("/api/reports", (req, res) => app._router.handle({ ...req, url: "/reports" }, res, () => {}));
app.post("/api/reports", reportLimiter, (req, res) => app._router.handle({ ...req, url: "/reports" }, res, () => {}));

app.listen(PORT, () => console.log(`MX Seguro Backend rodando na porta ${PORT}`));