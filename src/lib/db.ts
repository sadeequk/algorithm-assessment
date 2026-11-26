import pg from "pg";
import { Sequelize } from "sequelize";

const globalForDb = globalThis as unknown as { sequelize?: Sequelize };

const databaseUrl = process.env.DATABASE_URL || "";
const needsSsl =
  databaseUrl.includes("sslmode=require") ||
  databaseUrl.includes("supabase.co") ||
  databaseUrl.includes("neon.tech");

export const sequelize =
  globalForDb.sequelize ??
  new Sequelize(databaseUrl, {
    dialect: "postgres",
    dialectModule: pg,
    logging: false,
    dialectOptions: needsSsl
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.sequelize = sequelize;
}

let initPromise: Promise<void> | null = null;

export async function ensureDb() {
  if (!initPromise) {
    initPromise = (async () => {
      await import("@/models");
      await sequelize.sync();
    })();
  }
  return initPromise;
}
