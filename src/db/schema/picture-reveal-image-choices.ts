import {
  datetime,
  foreignKey,
  int,
  mysqlTable,
  timestamp,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";
import { pictureRevealImages } from "./picture-reveal-images";

export const pictureRevealImageChoices = mysqlTable(
  "picture_reveal_image_choices",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    imageId: varchar("image_id", { length: 255 }).notNull(),

    label: varchar("label", { length: 255 }).notNull(),
    isCorrect: tinyint("is_correct").notNull().default(0),
    sortOrder: int("sort_order").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
    deletedAt: datetime("deleted_at"),
  },
  (table) => [
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [pictureRevealImages.id],
      name: "pric_image_fk",
    }).onDelete("cascade"),
  ],
);

export type PictureRevealImageChoice =
  typeof pictureRevealImageChoices.$inferSelect;
export type NewPictureRevealImageChoice =
  typeof pictureRevealImageChoices.$inferInsert;
