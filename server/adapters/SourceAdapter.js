const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const MockOfficialAdapter = {
  name: "MockOfficialAdapter",
  run: async () => true,
};

const MockAggregatorAdapter = {
  name: "MockAggregatorAdapter",
  run: async () => true,
};

module.exports = { prisma, MockOfficialAdapter, MockAggregatorAdapter };