// Força Node a não validar cadeia de certificado (resolve "self-signed certificate...")
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MockOfficialAdapter = { name: "MockOfficialAdapter", run: async () => true };
const MockAggregatorAdapter = { name: "MockAggregatorAdapter", run: async () => true };

module.exports = { prisma, MockOfficialAdapter, MockAggregatorAdapter };