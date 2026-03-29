// src/app/api/auth/sign-in/route.ts
// POST /api/auth/sign-in — Zod validation guard สำหรับ credential sign-in
import { type NextRequest, NextResponse } from "next/server";
import { SignInSchema } from "@/lib/validations";
import { signInWithCredentials } from "@/services/auth.service";

/**
 * POST /api/auth/sign-in
 *
 * Flow:
 * 1. Validate request body ด้วย SignInSchema (Zod)
 * 2. ส่งไปยัง signInWithCredentials service
 * 3. Forward response จาก Better Auth (รวม Set-Cookie session header)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // ─── 1. Validate ────────────────────────────────────────────────────────────
  const body = await request.json().catch(() => null);

  if (body === null) {
    return NextResponse.json(
      { error: "Request body ต้องเป็น JSON" },
      { status: 400 },
    );
  }

  const result = SignInSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "ข้อมูลไม่ถูกต้อง",
        fieldErrors: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // ─── 2. Call Service ─────────────────────────────────────────────────────────
  const serviceResult = await signInWithCredentials(result.data);

  if (!serviceResult.success) {
    return NextResponse.json(
      { error: serviceResult.message },
      { status: serviceResult.status },
    );
  }

  // ─── 3. Forward Better Auth Response ────────────────────────────────────────
  // ดึง body จาก Better Auth response
  const responseData = await serviceResult.response.json();

  // สร้าง NextResponse แล้ว forward Set-Cookie headers จาก Better Auth
  const nextResponse = NextResponse.json(responseData, {
    status: serviceResult.response.status,
  });

  // Forward cookies ทั้งหมดที่ Better Auth ตั้งค่าไว้ (session token ฯลฯ)
  serviceResult.response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      nextResponse.headers.append("Set-Cookie", value);
    }
  });

  return nextResponse;
}
