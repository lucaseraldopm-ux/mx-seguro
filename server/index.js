const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Limiter para evitar spam de reports (max 5 por IP a cada 15 min)
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Demasiadas requisiciones, por favor intenta más tarde." },
});

// Mock “DB” em memória
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

// Healthcheck
app.get("/", (req, res) => res.send("mx-seguro-api up"));
app.get("/status", (req, res) => {
  res.json({
    ok: true,
    lastUpdatedAt: new Date().toISOString(),
    sources: { mock: true },
    coverage: "mock",
  });
});

// API
app.get("/api/status", (req, res) => {
  res.json({ ...globalStatus, lastUpdatedAt: new Date().toISOString() });
});

app.get("/api/risk", (req, res) => {
  const zoomLevel = String(req.query.zoomLevel || "close");

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

app.get("/api/incidents", (req, res) => res.json(incidents));

app.post("/api/reports", reportLimiter, (req, res) => {
  const { category, description, coordinate } = req.body || {};

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

app.get("/api/reports", (req, res) => {
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

// Aliases sem /api (pra abrir no navegador fácil)
app.get("/risk", (req, res) => {
  req.url = "/api/risk";
  return app._router.handle(req, res, () => {});
});
app.get("/incidents", (req, res) => {
  req.url = "/api/incidents";
  return app._router.handle(req, res, () => {});
});
app.get("/reports", (req, res) => {
  req.url = "/api/reports";
  return app._router.handle(req, res, () => {});
});
app.post("/reports", reportLimiter, (req, res) => {
  req.url = "/api/reports";
  return app._router.handle(req, res, () => {});
});

// Erro em JSON (pra não aparecer “Internal Server Error” seco)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: "internal", message: String(err?.message || err) });
});

app.listen(PORT, () => console.log(`MX Seguro Backend rodando na porta ${PORT}`));