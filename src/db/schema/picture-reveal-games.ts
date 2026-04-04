import {
  datetime,
  foreignKey,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { users } from "./users";

export const pictureRevealGames = mysqlTable(
  "picture_reveal_games",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: varchar("user_id", { length: 255 }).notNull(),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    mode: varchar("mode", { length: 20 }).notNull().default("single"),
    startScore: int("start_score").notNull().default(1000),
    openTilePenalty: int("open_tile_penalty").notNull().default(50),
    specialTilePenalty: int("special_tile_penalty").notNull().default(200),
    imageWidth: int("image_width").notNull().default(1080),
    imageHeight: int("image_height").notNull().default(1080),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
    deletedAt: datetime("deleted_at"),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "prg_user_fk",
    }).onDelete("cascade"),
  ],
);

export type PictureRevealGame = typeof pictureRevealGames.$inferSelect;
export type NewPictureRevealGame = typeof pictureRevealGames.$inferInsert;
