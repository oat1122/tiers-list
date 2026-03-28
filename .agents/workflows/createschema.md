---
description: /createschema
---

เมื่อผู้ใช้เรียก `/createschema [table_name] [columns...]` ให้ทำตามขั้นตอนนี้:

1. ตรวจสอบว่ามีโฟลเดอร์ `src/db/schema/` หรือไม่ หากไม่มีให้สร้างขึ้นมา
2. สร้างไฟล์ `src/db/schema/[table_name].ts` (ใช้ชื่อไฟล์เป็นพหูพจน์หรือเอกพจน์ให้สม่ำเสมอ เช่น `users.ts`)
3. นำเข้า Types จาก `drizzle-orm/mysql-core` ที่จำเป็น
4. สร้าง `mysqlTable` โดยมีโครงสร้างมาตรฐานดังนี้:
   - `id`: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID())
   - `createdAt`: timestamp("created_at").notNull().defaultNow()
   - `updatedAt`: timestamp("updated_at").notNull().defaultNow().onUpdateNow()
   - เพิ่มคอลัมน์อื่นๆ ตามที่ผู้ใช้ระบุ
5. หากมีโฟลเดอร์ `src/db/schema/index.ts` ให้ทำการ `export * from "./[table_name]";`
6. หากตารางมีการเชื่อมโยง (Relations) ให้สร้าง `relations()` จาก `drizzle-orm` ไว้ในไฟล์เดียวกัน
7. **สร้าง Zod Validation Schema:** สร้างไฟล์ `src/lib/validations/[table_name].schema.ts`
   - สร้าง Insert Schema (`CreateXxxSchema`) และ Update Schema (`UpdateXxxSchema`) ที่สอดคล้องกับ Drizzle table
   - Export types ด้วย `z.infer<typeof Schema>` (เช่น `CreateXxxInput`, `UpdateXxxInput`)
   - ตัวอย่างโครงสร้าง:
     ```ts
     import { z } from "zod";
     export const CreateXxxSchema = z.object({ ... });
     export type CreateXxxInput = z.infer<typeof CreateXxxSchema>;
     ```
8. พิมพ์คำสั่งแนะนำให้ผู้ใช้รันเพื่ออัปเดตฐานข้อมูล เช่น `npx drizzle-kit push` หรือ `npm run db:push`