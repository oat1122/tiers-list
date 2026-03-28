---
trigger: always_on
---

1. Tech Stack Core:
   - Framework: Next.js (App Router เท่านั้น)
   - Language: TypeScript (Strict Mode)
   - Database: MariaDB
   - ORM: Drizzle ORM (`drizzle-orm/mysql-core` และ `mysql2`)
   - Auth: Better Auth
   - Styling: Tailwind CSS + shadcn/ui + Lucide React
   - State Management: Zustand
   - Validation: **Zod** (ใช้สำหรับ validate ข้อมูลทุกจุดที่รับ input จากภายนอก)

2. Coding Standards & Architecture:
   - เน้นใช้ **Server Components** เป็นค่าเริ่มต้น (Default) เสมอ
   - แยก Client Components ด้วย `"use client"` เฉพาะเมื่อต้องจัดการ State, Hooks (useState, useEffect) หรือ Event Listeners เท่านั้น
   - จัดการ CSS คลาสด้วย `cn()` (Tailwind Merge + clsx) เสมอเวลาส่งผ่าน Props
   - **Data Fetching & Mutations:** แนะนำให้ใช้ **Server Actions** สำหรับการแก้ไขข้อมูล (Mutations) และดึงข้อมูลผ่าน Server Components โดยตรง หลีกเลี่ยงการสร้าง API Routes (`/api/...`) ยกเว้นแต่จะเป็นการสร้าง Webhook หรือ External API ให้ระบบอื่นเรียกใช้

3. Database Rules (Drizzle + MariaDB):
   - ห้ามใช้ Prisma เด็ดขาด ให้ใช้ Drizzle ORM เสมอ
   - การ Query Database ต้องทำฝั่ง Server (Server Components, Server Actions หรือ Route Handlers) เท่านั้น
   - เวลาเขียน Schema ให้ใช้ `varchar("id", { length: 255 })` แทน `text("id")` สำหรับ Primary Key เสมอ (เพื่อประสิทธิภาพการทำ Indexing ใน MariaDB) แนะนำให้ใช้ `cuid` หรือ `uuid` ในการสร้าง ID

4. Validation Rules (Zod):
   - **บังคับใช้ Zod ทุกครั้ง** ที่รับข้อมูลจากภายนอก เช่น Request Body, Query Params, Form Data, Environment Variables
   - เก็บ Zod schemas ไว้ที่ `src/lib/validations/[name].schema.ts` (แยกไฟล์ตาม domain)
   - ใช้ `z.infer<typeof Schema>` เพื่อ derive TypeScript types แทนการนิยาม type ซ้ำด้วยมือ
   - ใน **Server Actions:** ใช้ `schema.safeParse(formData)` เสมอ และคืน `{ error: ... }` กลับมาหาก invalid
   - ใน **API Routes:** ใช้ `schema.safeParse(await request.json())` และ return `400 Bad Request` พร้อม `error.flatten()` หาก invalid
   - ใน **Client Forms:** ใช้ร่วมกับ `react-hook-form` ผ่าน `@hookform/resolvers/zod`
   - ห้าม cast `as any` หรือ bypass Zod เด็ดขาด — ให้ fix schema แทน