import {
  datetime,
  foreignKey,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { users } from "./users";

export const soundGuessGames = mysqlTable(
  "sound_guess_games",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: varchar("user_id", { length: 255 }).notNull(),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    coverImagePath: varchar("cover_image_path", { length: 500 }),
    status: varchar("status", { length: 20 }).notNull().default("draft"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
    deletedAt: datetime("deleted_at"),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "sgg_user_fk",
    }).onDelete("cascade"),
  ],
);

export type SoundGuessGame = typeof soundGuessGames.$inferSelect;
export type NewSoundGuessGame = typeof soundGuessGames.$inferInsert;

