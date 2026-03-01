const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

// FIX SSL (Prisma v7): evita erro "self-signed certificate in certificate chain"
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter });

const MockOfficialAdapter = { name: "MockOfficialAdapter", run: async () => true };
const MockAggregatorAdapter = { name: "MockAggregatorAdapter", run: async () => true };

module.exports = { prisma, MockOfficialAdapter, MockAggregatorAdapter };