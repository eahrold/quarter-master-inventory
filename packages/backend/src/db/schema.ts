import {
  sqliteTable,
  text,
  integer,
  index,
} from "drizzle-orm/sqlite-core";

// Tenant table - each scout troop is a tenant
export const troops = sqliteTable("troops", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // URL-friendly identifier
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// Users with troop association
export const users = sqliteTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    troopId: text("troop_id")
      .notNull()
      .references(() => troops.id, { onDelete: "cascade" }),
    username: text("username").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", {
      enum: ["admin", "leader", "scout", "viewer"],
    }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    emailIdx: index("user_email_idx").on(table.email),
    troopEmailIdx: index("user_troop_email_idx").on(table.troopId, table.email),
  })
);

// Items with enhanced location tracking
export const items = sqliteTable(
  "items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    troopId: text("troop_id")
      .notNull()
      .references(() => troops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category", { enum: ["permanent", "staples"] }).notNull(),
    locationSide: text("location_side", { enum: ["left", "right"] }).notNull(),
    locationLevel: text("location_level", {
      enum: ["low", "middle", "high"],
    }).notNull(),
    status: text("status", {
      enum: ["available", "checked_out", "needs_repair"],
    }).default("available"),
    qrCode: text("qr_code").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    qrIdx: index("item_qr_idx").on(table.qrCode),
    troopIdx: index("item_troop_idx").on(table.troopId),
    statusIdx: index("item_status_idx").on(table.status),
    categoryIdx: index("item_category_idx").on(table.category),
    locationIdx: index("item_location_idx").on(
      table.locationSide,
      table.locationLevel
    ),
  })
);

// Transaction logging with flexible user tracking
export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    troopId: text("troop_id")
      .notNull()
      .references(() => troops.id, { onDelete: "cascade" }),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id), // nullable for non-registered users
    action: text("action", { enum: ["check_out", "check_in"] }).notNull(),
    checkedOutBy: text("checked_out_by"), // manual entry for non-users
    expectedReturnDate: integer("expected_return_date", { mode: "timestamp" }),
    notes: text("notes"),
    timestamp: integer("timestamp", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    itemIdx: index("transaction_item_idx").on(table.itemId),
    troopIdx: index("transaction_troop_idx").on(table.troopId),
    timestampIdx: index("transaction_timestamp_idx").on(table.timestamp),
    actionIdx: index("transaction_action_idx").on(table.action),
  })
);