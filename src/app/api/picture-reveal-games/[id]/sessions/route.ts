import { NextRequest, NextResponse } from "next/server";
import {
  PictureRevealGameIdParamSchema,
  PictureRevealSessionListQuerySchema,
} from "@/lib/validations";
import {
  getPictureRevealPlayerToken,
  handlePictureRevealRouteError,
  requirePictureRevealAdmin,
} from "@/lib/picture-reveal-route";
import { PICTURE_REVEAL_PLAYER_TOKEN_COOKIE } from "@/services/picture-reveal-play.service";
import {
  createPictureRevealSession,
  getAdminPictureRevealSessionHistory,
} from "@/services/picture-reveal-play.service";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    await requirePictureRevealAdmin(request);
    const paramResult = PictureRevealGameIdParamSchema.safeParse(params);

    if (!paramResult.success) {
      return NextResponse.json(
        { error: paramResult.error.flatten() },
        { status: 400 },
      );
    }

    const queryResult = PictureRevealSessionListQuerySchema.safeParse({
      limit: request.nextUrl.searchParams.get("limit"),
      status: request.nextUrl.searchParams.get("status"),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: queryResult.error.flatten() },
        { status: 400 },
      );
    }

    const history = await getAdminPictureRevealSessionHistory(
      paramResult.data.id,
      queryResult.data,
    );

    return NextResponse.json(history, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    const result = PictureRevealGameIdParamSchema.safeParse(params);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    const { session, issuedPlayerToken } = await createPictureRevealSession(
      result.data.id,
      getPictureRevealPlayerToken(request),
    );

    const response = NextResponse.json(session, { status: 201 });

    if (issuedPlayerToken) {
      response.cookies.set(PICTURE_REVEAL_PLAYER_TOKEN_COOKIE, issuedPlayerToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }

    return response;
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}
