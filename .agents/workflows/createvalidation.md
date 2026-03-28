---
description: /createvalidation
---

เมื่อผู้ใช้เรียก `/createvalidation [name]` ให้ทำตามขั้นตอนนี้:

1. ตรวจสอบว่ามีโฟลเดอร์ `src/lib/validations/` หรือไม่ หากไม่มีให้สร้างขึ้นมา
2. สร้างไฟล์ `src/lib/validations/[name].schema.ts`
3. นำเข้า Zod ที่บรรทัดแรกเสมอ: `import { z } from "zod";`
4. กำหนด Schema ตามบริบทที่ผู้ใช้ระบุ โดยมีรูปแบบมาตรฐานดังนี้:

   ```ts
   // สำหรับ Create (Insert) — ห้ามรวม id, createdAt, updatedAt
   export const CreateXxxSchema = z.object({
     field: z.string().min(1, "กรุณากรอกข้อมูล"),
     // ...
   });
   export type CreateXxxInput = z.infer<typeof CreateXxxSchema>;

   // สำหรับ Update — ทำให้ทุก field เป็น optional ด้วย .partial()
   export const UpdateXxxSchema = CreateXxxSchema.partial();
   export type UpdateXxxInput = z.infer<typeof UpdateXxxSchema>;
   ```

5. กฎการเขียน Schema ที่ต้องปฏิบัติตาม:
   - `z.string()` — ใส่ `.min(1)` สำหรับ required fields เสมอ (ป้องกัน empty string)
   - `z.string().email()` — สำหรับ email fields
   - `z.string().url()` — สำหรับ URL fields
   - `z.number().int().positive()` — สำหรับตัวเลขจำนวนเต็มบวก
   - `z.enum([...])` — สำหรับ fields ที่มีค่าจำกัด
   - ห้ามใช้ `.optional()` กับ required fields เด็ดขาด
   - ข้อความ Error ให้เป็นภาษาไทยหรือภาษาอังกฤษให้สม่ำเสมอทั้งโปรเจค

6. การใช้งาน Schema ในบริบทต่างๆ:
   - **Server Action:** `const result = CreateXxxSchema.safeParse(rawData)` → คืน `{ error: result.error.flatten() }` หาก invalid
   - **API Route:** `const result = CreateXxxSchema.safeParse(await req.json())` → return `400` พร้อม `result.error.flatten()` หาก invalid
   - **Client Form:** ใช้ร่วมกับ `zodResolver(CreateXxxSchema)` ใน `useForm()`
