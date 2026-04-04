import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PICTURE_REVEAL_PLAYER_TOKEN_COOKIE } from "@/lib/picture-reveal-constants";
import { PictureRevealServiceError } from "@/services/picture-reveal-errors";

if (!("nextUrl" in Request.prototype)) {
  Object.defineProperty(Request.prototype, "nextUrl", {
    configurable: true,
    get() {
      return new URL(this.url);
    },
  });
}

export async function requirePictureRevealAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session || session.user.role !== "admin") {
    throw new PictureRevealServiceError(403, "Forbidden");
  }

  return session;
}

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

  return cookies.get(PICTURE_REVEAL_PLAYER_TOKEN_COOKIE) ?? null;
}

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
