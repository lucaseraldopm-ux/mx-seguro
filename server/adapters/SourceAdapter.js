const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

// Resolve TLS/self-signed sem mexer na DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Mantém exports que seu index.js espera
const MockOfficialAdapter = { name: "MockOfficialAdapter", run: async () => true };
const MockAggregatorAdapter = { name: "MockAggregatorAdapter", run: async () => true };

module.exports = { prisma, MockOfficialAdapter, MockAggregatorAdapter };