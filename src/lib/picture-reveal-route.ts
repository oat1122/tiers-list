import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { auth } from "@/lib/auth";
import { PictureRevealServiceError } from "@/services/picture-reveal-errors";

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
 * @throws PictureRevealServiceError when the requester is not an admin.
 */
export async function requirePictureRevealAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session || session.user.role !== "admin") {
    throw new PictureRevealServiceError(403, "Forbidden");
  }

  return session;
}

/**
 * Reads the host/player token from a route request cookie header.
 *
 * @param request - Incoming picture reveal route request.
 * @returns Player token when present, otherwise null.
 */
export function getPictureRevealPlayerToken(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = new Map(
    cookieHeader.split(";").map((part) => {
      const [name, ...rest] = part.trim().split("=");
      return [name, rest.join("=")];
    }),
  );

  return cookies.get("picture_reveal_player_token") ?? null;
}

/**
 * Converts known picture reveal errors into stable JSON responses.
 *
 * @param error - Error thrown by a route handler or service call.
 * @returns JSON response preserving the feature's existing error shape.
 */
export function handlePictureRevealRouteError(error: unknown) {
  if (error instanceof PictureRevealServiceError) {
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
export function validatePictureRevealRouteInput<TSchema extends z.ZodType>(
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
