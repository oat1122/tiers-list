---
description: /createstore
---

เมื่อผู้ใช้เรียก `/createstore [store_name] [state_properties...]` ให้ทำตามขั้นตอนนี้:

1. สร้างไฟล์ `src/store/use[StoreName]Store.ts`
2. ใส่ `"use client";` ไว้บรรทัดบนสุด (เพื่อความปลอดภัยหากเผลอโดนเรียกใน Server Component)
3. นิยาม TypeScript `interface` หรือ `type` สำหรับรวบรวม State และ Actions
4. สร้าง Zustand Store (`create<...>()(...)`) พร้อมกำหนด Initial State
5. เขียน Action Functions (เช่น `setSomething`, `updateSomething`, `reset`) ตามที่ผู้ใช้ระบุมาให้ครบถ้วน และ Export ออกไปใช้งาน