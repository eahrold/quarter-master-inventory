import { beforeEach, afterEach, beforeAll } from 'vitest';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { users, troops, items, transactions } from '../db/schema';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '7d';
process.env.DATABASE_URL = ':memory:'; // Use in-memory database for tests

// Create test database instance
const sqlite = new Database(':memory:');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON'); // Enable foreign key constraints

export const testDb = drizzle(sqlite, { 
  schema: { users, troops, items, transactions }
});

// Run migrations before all tests
beforeAll(async () => {
  // Since we're using in-memory database, we need to create tables manually
  // or use a different approach for testing
  
  // Create tables manually for testing
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS troops (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      troop_id TEXT NOT NULL REFERENCES troops(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE INDEX user_email_idx ON users(email);
    CREATE UNIQUE INDEX user_troop_email_idx ON users(troop_id, email);

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      troop_id TEXT NOT NULL REFERENCES troops(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      location_side TEXT NOT NULL,
      location_level TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      qr_code TEXT NOT NULL UNIQUE,
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE INDEX item_qr_idx ON items(qr_code);
    CREATE INDEX item_troop_idx ON items(troop_id);
    CREATE INDEX item_status_idx ON items(status);
    CREATE INDEX item_category_idx ON items(category);
    CREATE INDEX item_location_idx ON items(location_side, location_level);

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      troop_id TEXT NOT NULL REFERENCES troops(id) ON DELETE CASCADE,
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      checked_out_by TEXT,
      expected_return_date INTEGER,
      notes TEXT,
      timestamp INTEGER
    );

    CREATE INDEX transaction_item_idx ON transactions(item_id);
    CREATE INDEX transaction_troop_idx ON transactions(troop_id);
    CREATE INDEX transaction_timestamp_idx ON transactions(timestamp);
    CREATE INDEX transaction_action_idx ON transactions(action);
  `);
});

// Clean database before each test
beforeEach(async () => {
  // Clear all tables in the correct order (respecting foreign key constraints)
  await testDb.delete(transactions);
  await testDb.delete(items);
  await testDb.delete(users);
  await testDb.delete(troops);
});

// Clean up after each test
afterEach(async () => {
  // Additional cleanup if needed
});