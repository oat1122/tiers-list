// src/lib/auth.ts
// Better Auth server instance — ใช้ร่วมกันทั้ง route handlers และ service layer
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * auth — Better Auth instance หลักของ application
 *
 * - ใช้ Drizzle adapter เชื่อมกับ MariaDB ผ่าน schema ที่มีอยู่แล้ว
 * - เปิด emailAndPassword credential provider
 * - ปิด sign-up (disableSignUp) — ต้อง seed user ผ่าน admin เท่านั้น
 * - ใช้ nextCookies() plugin เพื่อให้ cookie ทำงานถูกต้องใน Next.js App Router
 */
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.APP_URL ?? "http://localhost:3000",

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
      },
    },
  },

  // ─── Database ─────────────────────────────────────────────────────────────
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  // ─── Credential Provider ──────────────────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    /**
     * ปิด sign-up endpoint (/api/auth/sign-up/email)
     * ผู้ใช้ต้องถูก seed หรือสร้างโดย admin เท่านั้น
     */
    disableSignUp: true,
  },

  // ─── Plugins ─────────────────────────────────────────────────────────────
  plugins: [
    nextCookies(), // จำเป็นสำหรับ Next.js App Router — sync cookies ผ่าน next/headers
  ],
});

/** Type ของ Better Auth session สำหรับใช้ใน Server Components / Server Actions */
export type Session = typeof auth.$Infer.Session;
