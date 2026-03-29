import {
  mysqlTable,
  varchar,
  int,
  tinyint,
  timestamp,
  datetime,
} from "drizzle-orm/mysql-core";
import { tierLists } from "./tier-lists";

/**
 * tier_items — เก็บรายการที่อยู่ในแต่ละ Tier List
 */
export const tierItems = mysqlTable("tier_items", {
  /** UUID (Primary Key) */
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  /** สังกัด tier list ไหน (Foreign Key) */
  tierListId: varchar("tier_list_id", { length: 255 })
    .notNull()
    .references(() => tierLists.id, { onDelete: "cascade" }),

  /** ชื่อของ Item / ข้อความ (Label) */
  label: varchar("label", { length: 255 }).notNull(),

  /** ระดับ (S, A, B, C, D, F) */
  tier: varchar("tier", { length: 10 }).notNull(),

  /** ลำดับภายใน tier (เผื่อการจัดเรียง) */
  position: int("position").notNull().default(0),

  /**
   * ชนิดของข้อมูล: "text" | "image"
   */
  itemType: varchar("item_type", { length: 20 }).notNull().default("text"),

  /**
   * พาธของไฟล์ที่ถูกอัพโหลด (เฉพาะ itemType="image")
   * เช่น "/uploads/tier-items/uuid.jpg"
   */
  imagePath: varchar("image_path", { length: 500 }),

  /** 1 = แสดง Label เป็น Caption, 0 = ซ่อน Label */
  showCaption: tinyint("show_caption").notNull().default(1),

  /** วันเวลาที่สร้าง */
  createdAt: timestamp("created_at").notNull().defaultNow(),

  /** วันเวลาที่แก้ไขข้อมูลล่าสุด */
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),

  /** Soft Delete */
  deletedAt: datetime("deleted_at"),
});

export type TierItem = typeof tierItems.$inferSelect;
export type NewTierItem = typeof tierItems.$inferInsert;
