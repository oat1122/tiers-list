import {
  datetime,
  foreignKey,
  int,
  json,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import type { PictureRevealGameSnapshot } from "@/types/picture-reveal";
import { pictureRevealGames } from "./picture-reveal-games";

export const pictureRevealPlaySessions = mysqlTable(
  "picture_reveal_play_sessions",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    gameId: varchar("game_id", { length: 255 }).notNull(),

    playerTokenHash: varchar("player_token_hash", { length: 255 }).notNull(),
    modeSnapshot: varchar("mode_snapshot", { length: 20 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    currentRoundIndex: int("current_round_index").notNull().default(0),
    currentScore: int("current_score").notNull(),
    finalScore: int("final_score"),
    gameSnapshot:
      json("game_snapshot").$type<PictureRevealGameSnapshot>().notNull(),
    imageQueue: json("image_queue").$type<string[]>().notNull(),
    completedAt: datetime("completed_at"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.gameId],
      foreignColumns: [pictureRevealGames.id],
      name: "prs_game_fk",
    }),
  ],
);

export type PictureRevealPlaySession =
  typeof pictureRevealPlaySessions.$inferSelect;
export type NewPictureRevealPlaySession =
  typeof pictureRevealPlaySessions.$inferInsert;
