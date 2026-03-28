---
description: /createapi
---

เมื่อผู้ใช้เรียก `/createapi [route_name] [methods...]` ให้ทำตามขั้นตอนนี้:

1. **สร้าง Zod Schema:** สร้างไฟล์ `src/lib/validations/[route_name].schema.ts`
   - กำหนด Schema สำหรับ Request Body หรือ Query Params แต่ละ Method ที่รับ input
   - Export type ด้วย `z.infer<typeof Schema>` เพื่อใช้ใน Service และ Route
2. **แยก Business Logic:** สร้างโฟลเดอร์ `src/services/` และสร้างไฟล์ `[route_name].service.ts`
   - เขียนฟังก์ชันหลักสำหรับติดต่อ Database ผ่าน Drizzle ORM
   - รับ Type ที่ infer จาก Zod schema เป็น parameter แทนการใช้ `any`
   - โค้ดส่วนนี้จะต้องไม่ผูกติดกับ NextRequest / NextResponse เพื่อให้สามารถเรียกใช้ซ้ำได้
3. **สร้าง API Route:** สร้างโฟลเดอร์และไฟล์ที่ `src/app/api/[route_name]/route.ts`
   - นำเข้า `NextRequest` และ `NextResponse`
   - นำเข้า Zod schema จากข้อ 1 และ Service functions จากข้อ 2
4. เขียน HTTP Methods (GET, POST, ฯลฯ) ใน `route.ts`:
   - หากต้องใช้ Auth: ดึง Session ผ่าน `auth.api.getSession({ headers: request.headers })` หากไม่มี Session ให้ return `401 Unauthorized` ทันที
   - **Validate ด้วย Zod ก่อนเสมอ:** `const result = Schema.safeParse(await request.json())` — หาก `!result.success` ให้ return `400 Bad Request` พร้อม `result.error.flatten()`
   - ใช้ `try-catch` ห่อหุ้มการทำงานหลักเสมอ
   - ส่ง `result.data` (ที่ผ่าน validate แล้ว) ไปยัง Service function
   - คืนค่า `NextResponse.json(...)` พร้อม HTTP Status Code ที่เหมาะสม (200, 201, 400, 500)