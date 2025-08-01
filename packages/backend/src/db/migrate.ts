import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./index";

async function runMigrations() {
  console.log("Running database migrations...");
  
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Database migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}