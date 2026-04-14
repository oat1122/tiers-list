import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { auth } from "@/lib/auth";
import { SoundGuessServiceError } from "@/services/sound-guess-errors";

if (!("nextUrl" in Request.prototype)) {
  Object.defineProperty(Request.prototype, "nextUrl", {
    configurable: true,
    get() {
      return new URL(this.url);
    },
  });
}

/**
 * Requires an authenticated admin session before allowing admin-only game edits.
 *
 * @param request - Incoming admin route request with auth headers.
 * @returns Auth session for the current admin user.
 * @throws SoundGuessServiceError when the requester is not an admin.
 */
export async function requireSoundGuessAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session || session.user.role !== "admin") {
    throw new SoundGuessServiceError(403, "Forbidden");
  }

  return session;
}

/**
 * Converts known sound guess errors into stable JSON responses.
 *
 * @param error - Error thrown by a route handler or service call.
 * @returns JSON response preserving the feature's error shape.
 */
export function handleSoundGuessRouteError(error: unknown) {
  if (error instanceof SoundGuessServiceError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  return NextResponse.json(
    { error: (error as Error).message },
    { status: 500 },
  );
}

/**
 * Validates route params or request bodies and returns a route-compatible error.
 *
 * @param schema - Zod schema that defines the accepted route input.
 * @param value - Unknown value read from params, JSON, or form data.
 * @returns Parsed data when valid, otherwise a 400 JSON response.
 */
export function validateSoundGuessRouteInput<TSchema extends z.ZodType>(
  schema: TSchema,
  value: unknown,
):
  | { data: z.infer<TSchema>; response: null }
  | { data: null; response: NextResponse } {
  const result = schema.safeParse(value);

  if (!result.success) {
    return {
      data: null,
      response: NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      ),
    };
  }

  return { data: result.data, response: null };
}

