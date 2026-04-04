import {
  datetime,
  foreignKey,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { pictureRevealGames } from "./picture-reveal-games";

export const pictureRevealImages = mysqlTable(
  "picture_reveal_images",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    gameId: varchar("game_id", { length: 255 }).notNull(),

    imagePath: varchar("image_path", { length: 500 }).notNull(),
    originalImagePath: varchar("original_image_path", { length: 500 }),
    rows: int("rows").notNull().default(4),
    cols: int("cols").notNull().default(4),
    specialTileCount: int("special_tile_count").notNull().default(0),
    specialPattern: varchar("special_pattern", { length: 40 })
      .notNull()
      .default("plus"),
    sortOrder: int("sort_order").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
    deletedAt: datetime("deleted_at"),
  },
  (table) => [
    foreignKey({
      columns: [table.gameId],
      foreignColumns: [pictureRevealGames.id],
      name: "pri_game_fk",
    }).onDelete("cascade"),
  ],
);

export type PictureRevealImage = typeof pictureRevealImages.$inferSelect;
export type NewPictureRevealImage = typeof pictureRevealImages.$inferInsert;
