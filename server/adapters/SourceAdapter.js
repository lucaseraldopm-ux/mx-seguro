const { PrismaClient } = require("@prisma/client");

// No Render/Supabase, o Prisma usa automaticamente process.env.DATABASE_URL
// (desde que a variável esteja configurada no Render).
const prisma = new PrismaClient();

module.exports = { prisma };