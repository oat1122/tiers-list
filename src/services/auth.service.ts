// src/services/auth.service.ts
// Business logic สำหรับ authentication — ไม่ผูกกับ NextRequest/NextResponse
import { auth } from "@/lib/auth";
import type { SignInInput } from "@/lib/validations";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SignInResult {
  success: true;
  /** Raw Web API Response จาก Better Auth (มี Set-Cookie header พร้อม session token) */
  response: Response;
}

export interface SignInError {
  success: false;
  /** HTTP status code จาก Better Auth */
  status: number;
  /** ข้อความ error */
  message: string;
}

export type SignInServiceResult = SignInResult | SignInError;

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * signInWithCredentials — ส่ง email + password ไปยัง Better Auth sign-in endpoint
 *
 * Better Auth จัดการ credential verification, password hashing check,
 * และสร้าง session token ให้อัตโนมัติ
 *
 * @param data - SignInInput ที่ผ่าน Zod validation แล้ว
 * @returns SignInServiceResult พร้อม raw Response จาก Better Auth
 */
export async function signInWithCredentials(
  data: SignInInput
): Promise<SignInServiceResult> {
  try {
    const response = await auth.api.signInEmail({
      body: {
        email: data.email,
        password: data.password,
      },
      asResponse: true, // คืน raw Response เพื่อ forward Set-Cookie header ไปยัง client
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return {
        success: false,
        status: response.status,
        message:
          (errorBody as { message?: string }).message ??
          "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      };
    }

    return { success: true, response };
  } catch (error) {
    console.error("[auth.service] signInWithCredentials error:", error);
    return {
      success: false,
      status: 500,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    };
  }
}
