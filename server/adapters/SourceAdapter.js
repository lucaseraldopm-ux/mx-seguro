const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Mantém esses exports porque seu index.js importa eles
const MockOfficialAdapter = { name: "MockOfficialAdapter", run: async () => true };
const MockAggregatorAdapter = { name: "MockAggregatorAdapter", run: async () => true };

module.exports = { prisma, MockOfficialAdapter, MockAggregatorAdapter };