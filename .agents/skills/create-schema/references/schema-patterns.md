# Schema Patterns

ใช้ไฟล์นี้เป็น reference หลักเวลาสร้าง `/createschema [table_name] [columns...]`

## Quick Checklist

- สร้างไฟล์ที่ `src/db/schema/[table_name].ts`
- ใช้ Drizzle MySQL builders จาก `drizzle-orm/mysql-core`
- ใส่ `id`, `createdAt`, `updatedAt` เป็นค่าพื้นฐาน ถ้า requirement ไม่ได้บอกให้ตัดออก
- export type จาก table file
- เพิ่ม `export * from "./[table_name]"` ใน `src/db/schema/index.ts`
- ถ้ามี relation ให้เพิ่มใน `src/db/schema/index.ts`
- สร้าง validation file ที่ `src/lib/validations/[table_name].schema.ts`
- export type ด้วย `z.infer<typeof Schema>`
- ถ้าจำเป็น ให้เพิ่ม export ใน `src/lib/validations/index.ts`
- แนะนำ command สำหรับ sync database เช่น `npx drizzle-kit push`

## Table File Pattern

```ts
import {
  mysqlTable,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

export const posts = mysqlTable("posts", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

## Foreign Key Pattern

```ts
import {
  mysqlTable,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";
import { users } from "./users";

export const posts = mysqlTable("posts", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});
```

ใช้ `onDelete` ให้สอดคล้องกับความสัมพันธ์จริงของข้อมูล

## Index Barrel Pattern

ใน repo นี้ relation ไม่ได้อยู่ในไฟล์ table เสมอไป แต่รวมไว้ใน `src/db/schema/index.ts`

```ts
import { relations } from "drizzle-orm";
import { users } from "./users";
import { posts } from "./posts";

export * from "./users";
export * from "./posts";

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));
```

ถ้ามี table ใหม่ที่เชื่อมกับ table เดิม ให้เพิ่ม relation ฝั่งที่เกี่ยวข้องทั้งหมดในไฟล์นี้

## Validation Pattern

```ts
import { z } from "zod";

export const CreatePostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export const UpdatePostSchema = CreatePostSchema.partial();

export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
```

## Numeric And Enum Pattern

```ts
export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  priority: z.coerce.number().int().min(1).max(5),
  status: z.enum(["draft", "published", "archived"]),
});
```

ใช้ `z.coerce.number()` เมื่อค่ามีแนวโน้มมาจาก form หรือ query string

## Boolean-Like MySQL Pattern

ใน repo นี้มีหลาย field ที่เก็บเป็น `tinyint` หรือ number-like flags

```ts
export const CreatePostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  isPublished: z.coerce.number().int().min(0).max(1).default(0),
});
```

ให้ทำตาม pattern เดิมของ repo ถ้าตารางอื่นใช้ `0 | 1` แทน boolean จริง

## Naming Pattern

- table constant ใช้พหูพจน์ เช่น `users`, `posts`, `tierLists`
- file name ให้สอดคล้องกับ table constant เช่น `users.ts`, `posts.ts`, `tier-lists.ts`
- validation schema ใช้ singular domain name ใน class-like type:
  - `CreatePostSchema`
  - `UpdatePostSchema`
  - `CreatePostInput`
  - `UpdatePostInput`

## Command Suggestion Pattern

หลังสร้าง schema เสร็จ ให้แนะนำผู้ใช้รัน command ถัดไป เช่น:

```bash
npx drizzle-kit push
```

ถ้า repo มี script เฉพาะค่อยแนะนำ script นั้นแทน ตอนนี้ `package.json` ยังไม่มี `db:push`
