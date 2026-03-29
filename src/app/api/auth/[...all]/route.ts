// src/app/api/auth/[...all]/route.ts
// Catch-all handler สำหรับ Better Auth built-in endpoints
// ครอบคลุม: /api/auth/get-session, /api/auth/sign-out, /api/auth/sign-up/email ฯลฯ
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/**
 * Better Auth จัดการ routing ภายในของตัวเอง ผ่าน toNextJsHandler
 *
 * Built-in endpoints ที่ใช้งานได้:
 * - GET  /api/auth/get-session        — ดึง session ปัจจุบัน
 * - POST /api/auth/sign-out           — logout และล้าง session cookie
 * - POST /api/auth/sign-up/email      — (ปิดอยู่ — disableSignUp: true)
 * - POST /api/auth/sign-in/email      — internal sign-in (ใช้ผ่าน /api/auth/sign-in แทน)
 */
export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth.handler);
