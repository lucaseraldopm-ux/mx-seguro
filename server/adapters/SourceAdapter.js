const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Mantém esses exports porque o index.js está importando eles.
// Por enquanto são "no-op" (não fazem nada), só para o servidor subir.
const MockOfficialAdapter = {
  name: "MockOfficialAdapter",
  run: async () => true,
};

const MockAggregatorAdapter = {
  name: "MockAggregatorAdapter",
  run: async () => true,
};

module.exports = { prisma, MockOfficialAdapter, MockAggregatorAdapter };