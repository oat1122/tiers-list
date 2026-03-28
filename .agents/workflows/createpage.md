---
description: /createpage
---

เมื่อผู้ใช้เรียก `/createpage [route_name]` ให้ทำตามขั้นตอนนี้:

1. สร้างโฟลเดอร์ `src/app/[route_name]`
2. สร้างไฟล์ `page.tsx` โดยบังคับให้เป็น **Server Component**
3. เพิ่ม Next.js Metadata (Title, Description) ไว้ด้านบนสุดของไฟล์ `page.tsx`
4. ร่างโครงสร้าง UI เบื้องต้นด้วย Tailwind CSS (เช่น มี Header, Main Content)
5. หากหน้าเว็บจำเป็นต้องมีการตอบสนอง (Interactivity / State):
   - ให้สร้าง Private Folder ชื่อ `_components` (เช่น `src/app/[route_name]/_components/`)
   - สร้างไฟล์ Client Component เช่น `[route_name]-form.tsx` หรือ `[route_name]-client.tsx` โดยใส่ `"use client";` ไว้บรรทัดแรก
   - นำเข้า (Import) Client Component นั้นมาประกอบร่างใน `page.tsx`
6. หากหน้าเว็บมี **Form:** ให้ใช้ Zod + react-hook-form ร่วมกันเสมอ
   - สร้าง Zod schema สำหรับ Form ที่ `src/lib/validations/[route_name].schema.ts`
   - ใน Client Component ให้ใช้ `useForm` จาก `react-hook-form` พร้อม `zodResolver` จาก `@hookform/resolvers/zod`
   - การ Submit Form ให้ผ่าน **Server Action** ที่ validate ด้วย `schema.safeParse()` อีกครั้งฝั่ง Server