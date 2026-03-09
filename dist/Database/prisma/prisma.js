"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL ou DIRECT_URL deve estar definido para o Prisma.");
}
const pool = new pg_1.Pool({
    connectionString,
    max: 10,
    allowExitOnIdle: false,
});
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
exports.default = prisma;
