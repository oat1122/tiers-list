// src/db/schema/index.ts
// Barrel export — รวม schema และ relations ทั้งหมดเพื่อให้ import ได้จากที่เดียว
// Relations ถูก define ที่นี่เพื่อหลีกเลี่ยง Circular Import ระหว่างไฟล์
import { relations } from "drizzle-orm";
import { users } from "./users";
import { sessions } from "./sessions";
import { accounts } from "./accounts";

// ─── Re-exports ────────────────────────────────────────────────────────────────
export * from "./users";
export * from "./sessions";
export * from "./accounts";
export * from "./verifications";

// ─── Relations ────────────────────────────────────────────────────────────────

/** user มี sessions หลายรายการ และ accounts หลายรายการ */
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
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
