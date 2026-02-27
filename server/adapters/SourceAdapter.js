const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SourceAdapter {
    constructor(name, confidenceLevel, intervalMinutes) {
        this.name = name;
        this.confidenceLevel = confidenceLevel;
        this.intervalMinutes = intervalMinutes;
    }

    // To be implemented by subclasses
    async fetchRawData() {
        throw new Error('fetchRawData() must be implemented');
    }

    // Converts raw API format to MX Seguro standard format
    normalize(rawData) {
        throw new Error('normalize() must be implemented');
    }

    // Executes the ingestion pipeline step-by-step
    async runPipeline() {
        console.log(`[Adapter] Running Pipeline for: ${this.name}`);
        try {
            const raw = await this.fetchRawData();
            const normalizedList = this.normalize(raw);

            let insertedCount = 0;
            for (const item of normalizedList) {
                // Upsert to prevent duplicate alerts processing the same ID
                const timeLimit = new Date(Date.now() - (this.intervalMinutes * 60000 * 2)); // Duplicate threshold

                const exists = await prisma.incident.findFirst({
                    where: {
                        title: item.title,
                        date: { gt: timeLimit },
                        sourceTag: this.name
                    }
                });

                if (!exists) {
                    await prisma.incident.create({
                        data: {
                            ...item,
                            confidence: this.confidenceLevel,
                            sourceTag: this.name,
                        }
                    });
                    insertedCount++;
                }
            }

            // Update global status to reflection ingestion health
            await prisma.statusInfo.update({
                where: { id: 1 },
                data: {
                    lastUpdatedAt: new Date(),
                    officialStatus: this.name.includes('Oficial') ? 'OK' : undefined,
                    aggregatorStatus: this.name.includes('Agregador') ? 'OK' : undefined,
                }
            });

            console.log(`[Adapter] Pipeline success for ${this.name}. Inserted ${insertedCount} new incidents.`);
        } catch (error) {
            console.error(`[Adapter Error] Failed pipeline: ${this.name}`, error);

            // Degrade status
            await prisma.statusInfo.update({
                where: { id: 1 },
                data: {
                    officialStatus: this.name.includes('Oficial') ? 'PARCIAL' : undefined,
                    aggregatorStatus: this.name.includes('Agregador') ? 'INDISPONÍVEL' : undefined,
                }
            });
        }
    }
}

class MockOfficialAdapter extends SourceAdapter {
    constructor() {
        super('Oficial - Proteção Civil', 'ALTA', 240); // 4 hours
    }

    async fetchRawData() {
        // Mocking an external Gov request
        return [
            { idGov: 'gv-89', desc: 'Retén militar preventivo do estado', riesgo: 'LOW', lat: 25.40, lng: -100.10 },
            { idGov: 'gv-90', desc: 'Operación policial en curso', riesgo: 'HIGH', lat: 25.68, lng: -100.31 }
        ];
    }

    normalize(raw) {
        return raw.map(item => ({
            title: 'Aviso Governamental',
            category: 'Segurança Pública',
            latitude: item.lat,
            longitude: item.lng,
            riskLevel: item.riesgo,
            description: item.desc,
            date: new Date()
        }));
    }
}

class MockAggregatorAdapter extends SourceAdapter {
    constructor() {
        super('Agregador Notícias - X', 'MÉDIA', 15); // 15 mins
    }

    async fetchRawData() {
        // Mocking a Twitter/News crawler
        return [
            { url: 'twitter.com/x/1', alertType: 'Bloqueio', risk: 'MEDIUM', coordinates: [25.7, -100.2], tweet: "Reporte de bloqueio na carretera nacional." }
        ];
    }

    normalize(raw) {
        return raw.map(item => ({
            title: item.alertType,
            category: 'Notícias em Tempo Real',
            latitude: item.coordinates[0],
            longitude: item.coordinates[1],
            riskLevel: item.risk,
            description: item.tweet,
            date: new Date()
        }));
    }
}

module.exports = {
    SourceAdapter,
    MockOfficialAdapter,
    MockAggregatorAdapter
};
