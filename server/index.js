const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');
const { MockOfficialAdapter, MockAggregatorAdapter } = require('./adapters/SourceAdapter');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Limiter para evitar spam de reports (max 5 requisições por IP a cada 15 min)
const reportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Demasiadas requisiciones, por favor intenta más tarde.' }
});

// Seed Initial Status if empty
async function ensureStatus() {
    try {
        const status = await prisma.statusInfo.findFirst();
        if (!status) {
            await prisma.statusInfo.create({
                data: { coverage: "Norte e Centro do México" }
            });
        }
    } catch (e) { console.log('Database not ready for seeding or already seeded.'); }
}
ensureStatus();

// 1) GET /api/status
app.get('/api/status', async (req, res) => {
    try {
        const status = await prisma.statusInfo.findFirst() || {};
        res.json({
            lastUpdatedAt: status.lastUpdatedAt || new Date().toISOString(),
            coverage: status.coverage || "Desconhecida",
            sources: {
                official: status.officialStatus || "OK",
                user_reports: status.reportStatus || "OK",
                news_aggregators: status.aggregatorStatus || "PARCIAL"
            }
        });
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch status" });
    }
});

// 2) GET /api/risk (Aggregated Grid / Regions)
app.get('/api/risk', async (req, res) => {
    try {
        const { zoomLevel, bbox } = req.query;
        let whereClause = { type: zoomLevel === 'far' ? 'region' : 'cell' };

        if (bbox) {
            const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
            whereClause = {
                ...whereClause,
                latitude: { gte: minLat, lte: maxLat },
                longitude: { gte: minLng, lte: maxLng }
            };
        }

        const overlays = await prisma.riskOverlay.findMany({
            where: whereClause
        });

        if (overlays.length === 0) {
            // Fallback mock data format inserted for first boot to not break the frontend map
            if (zoomLevel === 'far') {
                return res.json([
                    { id: "reg-1", name: "Nuevo León", type: "region", riskLevel: "MEDIUM", coordinate: { latitude: 25.5, longitude: -99.8 }, confidence: "ALTA" }
                ]);
            }
            return res.json([
                { id: "grid-1", name: "Grid Monterrey Sur", type: "cell", riskLevel: "MEDIUM", coordinates: [{ latitude: 25.6, longitude: -100.4 }, { latitude: 25.6, longitude: -100.2 }, { latitude: 25.4, longitude: -100.2 }, { latitude: 25.4, longitude: -100.4 }], description: "Riesgo moderado", lastUpdate: new Date().toISOString(), confidence: "MÉDIA", sourceTag: "Agregado Múltiple" }
            ]);
        }

        // Format for frontend
        const formatted = overlays.map(o => ({
            id: o.id,
            name: o.name,
            type: o.type,
            riskLevel: o.riskLevel,
            coordinate: o.latitude && o.longitude ? { latitude: o.latitude, longitude: o.longitude } : undefined,
            coordinates: o.coordinates || undefined,
            confidence: o.confidence,
            description: o.description,
            sourceTag: o.sourceTag,
            lastUpdate: o.lastUpdate
        }));

        res.json(formatted);
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

// 3) GET /api/incidents
app.get('/api/incidents', async (req, res) => {
    try {
        const { bbox, since } = req.query;
        let whereClause = {};

        if (bbox) {
            const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
            whereClause = {
                latitude: { gte: minLat, lte: maxLat },
                longitude: { gte: minLng, lte: maxLng }
            };
        }
        if (since) {
            whereClause.date = { gte: new Date(since) };
        }

        const incidents = await prisma.incident.findMany({
            where: whereClause,
            orderBy: { date: 'desc' },
            take: 100 // limit
        });

        if (incidents.length === 0) {
            // Fallback mock
            return res.json([{
                id: "evt-1", title: "Bloqueo Vial", category: "Bloqueo", coordinate: { latitude: 25.43, longitude: -100.0 }, date: new Date().toISOString(), riskLevel: "HIGH", description: "Paro con vehículos pesados en carretera.", confidence: "ALTA", sourceTag: "Oficial - SSC"
            }]);
        }

        const formatted = incidents.map(i => ({
            ...i,
            coordinate: { latitude: i.latitude, longitude: i.longitude }
        }));

        res.json(formatted);
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

// 4) POST /api/reports (Criar novo relato)
app.post('/api/reports', reportLimiter, async (req, res) => {
    try {
        const { category, description, coordinate } = req.body;
        const ip = req.ip || req.socket.remoteAddress;

        if (!category || !description || !coordinate) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // Anti-Spam: Block exact same description from same IP in last hour
        const oneHourAgo = new Date(Date.now() - 3600000);
        const existingSpam = await prisma.userReport.findFirst({
            where: {
                ip: String(ip),
                description: description,
                date: { gt: oneHourAgo }
            }
        });

        if (existingSpam) {
            return res.status(429).json({ error: 'Reporte duplicado detectado. Espere antes de enviar de nuevo.' });
        }

        // Deslocamento intencional (Snap) - reduz a precisão da coordenada
        const lat = parseFloat(parseFloat(coordinate.latitude).toFixed(2));
        const lng = parseFloat(parseFloat(coordinate.longitude).toFixed(2));

        const newReport = await prisma.userReport.create({
            data: {
                category,
                description,
                latitude: lat,
                longitude: lng,
                status: 'En revisión',
                ip: String(ip)
            }
        });

        res.status(201).json({
            ...newReport,
            coordinate: { latitude: lat, longitude: lng }
        });
    } catch (e) { res.status(500).json({ error: "Server DB Error" }); }
});

// 5) GET /api/reports (Públicos)
app.get('/api/reports', async (req, res) => {
    try {
        const { bbox } = req.query;
        let whereClause = { status: 'Verificado' };

        if (bbox) {
            const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
            whereClause = {
                ...whereClause,
                latitude: { gte: minLat, lte: maxLat },
                longitude: { gte: minLng, lte: maxLng }
            };
        }

        // Busca apenas verificados na bounding box
        const verified = await prisma.userReport.findMany({
            where: whereClause
        });

        // Agregação por grid/célula
        const aggregated = {};
        verified.forEach(r => {
            const key = `${r.latitude},${r.longitude}`;
            if (!aggregated[key]) {
                aggregated[key] = {
                    coordinate: { latitude: r.latitude, longitude: r.longitude },
                    count: 1,
                    categories: [r.category]
                };
            } else {
                aggregated[key].count += 1;
                if (!aggregated[key].categories.includes(r.category)) {
                    aggregated[key].categories.push(r.category);
                }
            }
        });

        const clusteredResponse = Object.keys(aggregated).map(key => ({
            id: `cluster-${key}`,
            coordinate: aggregated[key].coordinate,
            count: aggregated[key].count,
            categories: aggregated[key].categories,
            title: `${aggregated[key].count} reportes aquí`
        }));

        res.json(clusteredResponse);
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

// --- ADMIN DASHBOARD (Mock Web HTML) ---
app.get('/admin', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>MX Seguro - Moderação</title>
        <style>
          body { font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
          .card { border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #fafafa;}
          .btn { padding: 8px 16px; margin-right: 5px; cursor: pointer; border-radius: 4px; font-weight: bold; }
          .btn-approve { background: #4CAF50; color: white; border: none; }
          .btn-reject { background: #f44336; color: white; border: none; }
          .meta { color: #666; font-size: 12px; margin-bottom: 10px; display: block; }
        </style>
      </head>
      <body>
        <h1>Moderação de Relatos</h1>
        <p>Aprove ou rejeite relatos pendentes dos usuários.</p>
        <hr/>
        <div id="reports">Carregando...</div>
        <script>
          async function load() {
            const res = await fetch('/api/admin/reports');
            const data = await res.json();
            const div = document.getElementById('reports');
            if(data.length === 0) return div.innerHTML = 'Nenhum reporte "En revisión" no momento.';
            div.innerHTML = data.map(r => 
              '<div class="card">' +
                '<h3 style="margin:0 0 5px 0;">' + r.category + '</h3>' +
                '<span class="meta">ID: '+r.id+' | Em: ' + new Date(r.date).toLocaleString() + '</span>' +
                '<p>' + r.description + '</p>' +
                '<button class="btn btn-approve" onclick="moderate(\\''+r.id+'\\', \\'Verificado\\')">Aprovar no Mapa</button>' +
                '<button class="btn btn-reject" onclick="moderate(\\''+r.id+'\\', \\'Rechazado\\')">Recusar</button>' +
              '</div>'
            ).join('');
          }
          async function moderate(id, status) {
            await fetch('/api/admin/reports/' + id, {
              method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({status})
            });
            load();
          }
          load();
        </script>
      </body>
    </html>
  `);
});

// Admin internal APIs
app.get('/api/admin/reports', async (req, res) => {
    const pendings = await prisma.userReport.findMany({ where: { status: 'En revisión' }, orderBy: { date: 'desc' } });
    res.json(pendings);
});

app.patch('/api/admin/reports/:id', async (req, res) => {
    try {
        const updated = await prisma.userReport.update({
            where: { id: req.params.id },
            data: { status: req.body.status }
        });
        res.json({ success: true, report: updated });
    } catch (e) {
        res.status(404).json({ error: 'Not found' });
    }
});

// --- Aliases (atalhos) para compatibilidade (sem /api) ---
app.get("/status", (req, res) => res.redirect("/api/status"));
app.get("/risk", (req, res) => {
    const qs = req.originalUrl.includes("?") ? req.originalUrl.split("?")[1] : "";
    return res.redirect(qs ? `/api/risk?${qs}` : "/api/risk");
});
app.get("/incidents", (req, res) => res.redirect("/api/incidents"));
app.get("/reports", (req, res) => res.redirect("/api/reports"));
app.post("/reports", reportLimiter, (req, res) => res.redirect(307, "/api/reports"));

// --- Start Server & Cron ---
const officialAdapter = new MockOfficialAdapter();
const aggregatorAdapter = new MockAggregatorAdapter();

// Run initially
officialAdapter.runPipeline();
aggregatorAdapter.runPipeline();

// Schedule: Oficial (every 4 hours), Agregador (every 15 mins)
cron.schedule('0 */4 * * *', () => officialAdapter.runPipeline());
cron.schedule('*/15 * * * *', () => aggregatorAdapter.runPipeline());

app.listen(PORT, () => {
    console.log(`MX Seguro Backend (Prisma+Postgres+Cron) rodando na porta ${PORT}`);
});