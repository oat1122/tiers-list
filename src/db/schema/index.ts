// src/db/schema/index.ts
// Barrel export — รวม schema และ relations ทั้งหมดเพื่อให้ import ได้จากที่เดียว
// Relations ถูก define ที่นี่เพื่อหลีกเลี่ยง Circular Import ระหว่างไฟล์
import { relations } from "drizzle-orm";
import { users } from "./users";
import { sessions } from "./sessions";
import { accounts } from "./accounts";
import { tierLists } from "./tier-lists";
import { tierItems } from "./tier-items";

// ─── Re-exports ────────────────────────────────────────────────────────────────
export * from "./users";
export * from "./sessions";
export * from "./accounts";
export * from "./verifications";
export * from "./tier-lists";
export * from "./tier-items";
// ─── Relations ────────────────────────────────────────────────────────────────

/** user มี sessions หลายรายการ และ accounts หลายรายการ */
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  tierLists: many(tierLists),
}));

/** session เป็นของ user คนเดียว */
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

/** account เป็นของ user คนเดียว */
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

/** tierList เป็นของ user คนเดียว และมี items หลายรายการ */
export const tierListsRelations = relations(tierLists, ({ one, many }) => ({
  user: one(users, {
    fields: [tierLists.userId],
    references: [users.id],
  }),
  items: many(tierItems),
}));

/** tierItem เป็นของ tierList เดียว */
export const tierItemsRelations = relations(tierItems, ({ one }) => ({
  tierList: one(tierLists, {
    fields: [tierItems.tierListId],
    references: [tierLists.id],
  }),
}));
