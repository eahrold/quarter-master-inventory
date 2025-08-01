import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import * as relations from "./relations";

const sqlite = new Database(process.env.DATABASE_URL || "./database.sqlite");

// Enable WAL mode for better concurrency
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { 
  schema: { ...schema, ...relations },
  logger: process.env.NODE_ENV === "development"
});

export * from "./schema";
export * from "./relations";