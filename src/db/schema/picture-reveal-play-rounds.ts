import {
  datetime,
  foreignKey,
  int,
  json,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import type {
  PictureRevealChoiceSnapshot,
  PictureRevealImageSnapshot,
} from "@/types/picture-reveal";
import { pictureRevealImages } from "./picture-reveal-images";
import { pictureRevealPlaySessions } from "./picture-reveal-play-sessions";

export const pictureRevealPlayRounds = mysqlTable(
  "picture_reveal_play_rounds",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    sessionId: varchar("session_id", { length: 255 }).notNull(),

    imageId: varchar("image_id", { length: 255 }).notNull(),

    roundIndex: int("round_index").notNull(),
    outcome: varchar("outcome", { length: 20 }).notNull().default("pending"),
    guessedChoiceId: varchar("guessed_choice_id", { length: 255 }),
    openedTileCount: int("opened_tile_count").notNull().default(0),
    autoOpenedTileCount: int("auto_opened_tile_count").notNull().default(0),
    specialHitCount: int("special_hit_count").notNull().default(0),
    roundScore: int("round_score"),
    sessionScoreBefore: int("session_score_before").notNull(),
    sessionScoreAfter: int("session_score_after").notNull(),
    imageSnapshot:
      json("image_snapshot").$type<PictureRevealImageSnapshot>().notNull(),
    choiceSnapshot:
      json("choice_snapshot").$type<PictureRevealChoiceSnapshot[]>().notNull(),
    shuffledChoiceOrder:
      json("shuffled_choice_order").$type<string[]>().notNull(),
    specialTileNumbers:
      json("special_tile_numbers").$type<number[]>().notNull(),
    openedTileNumbers:
      json("opened_tile_numbers").$type<number[]>().notNull(),
    completedAt: datetime("completed_at"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.sessionId],
      foreignColumns: [pictureRevealPlaySessions.id],
      name: "prr_session_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [pictureRevealImages.id],
      name: "prr_image_fk",
    }),
  ],
);

export type PictureRevealPlayRound = typeof pictureRevealPlayRounds.$inferSelect;
export type NewPictureRevealPlayRound =
  typeof pictureRevealPlayRounds.$inferInsert;
