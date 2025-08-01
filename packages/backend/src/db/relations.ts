import { relations } from "drizzle-orm";
import { troops, users, items, transactions } from "./schema";

export const troopsRelations = relations(troops, ({ many }) => ({
  users: many(users),
  items: many(items),
  transactions: many(transactions),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  troop: one(troops, {
    fields: [users.troopId],
    references: [troops.id],
  }),
  transactions: many(transactions),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  troop: one(troops, {
    fields: [items.troopId],
    references: [troops.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  troop: one(troops, {
    fields: [transactions.troopId],
    references: [troops.id],
  }),
  item: one(items, {
    fields: [transactions.itemId],
    references: [items.id],
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));