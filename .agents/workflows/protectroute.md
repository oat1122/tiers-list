---
description: /protectroute
---

เมื่อผู้ใช้เรียก `/protectroute [route_name]` หรือ `/addauth [route_name]` ให้ทำตามขั้นตอนนี้:

1. **สำหรับ Server Component (`page.tsx`, `layout.tsx`):**
   - นำเข้า `headers` จาก `next/headers` และดึง Session ผ่าน Better Auth: `await auth.api.getSession({ headers: await headers() })`
   - หากไม่มี Session ให้ใช้ `redirect('/login')` จาก `next/navigation` ทันที
   - ดึงข้อมูลผู้ใช้ (เช่น `session.user.name`) มาแสดงผลใน UI หากจำเป็น
2. **สำหรับ Client Component (`_components/...`):**
   - ให้ใช้ Hook `useSession()` จาก `src/lib/auth-client.ts`
   - จัดการ Loading State ระหว่างตรวจสอบ (`if (isPending) return <Loading />`)
   - หากตรวจสอบแล้วพบว่ายังไม่ล็อกอิน ให้แสดงผล UI ทางเลือก หรือเปลี่ยนเส้นทาง (Router Push)