import {
  datetime,
  foreignKey,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { soundGuessGames } from "./sound-guess-games";

export const soundGuessSounds = mysqlTable(
  "sound_guess_sounds",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    gameId: varchar("game_id", { length: 255 }).notNull(),

    audioPath: varchar("audio_path", { length: 500 }).notNull(),
    imagePath: varchar("image_path", { length: 500 }),
    answer: varchar("answer", { length: 255 }).notNull(),
    audioStartMs: int("audio_start_ms").notNull().default(0),
    audioEndMs: int("audio_end_ms"),
    sortOrder: int("sort_order").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
    deletedAt: datetime("deleted_at"),
  },
  (table) => [
    foreignKey({
      columns: [table.gameId],
      foreignColumns: [soundGuessGames.id],
      name: "sgs_game_fk",
    }).onDelete("cascade"),
  ],
);

export type SoundGuessSound = typeof soundGuessSounds.$inferSelect;
export type NewSoundGuessSound = typeof soundGuessSounds.$inferInsert;
