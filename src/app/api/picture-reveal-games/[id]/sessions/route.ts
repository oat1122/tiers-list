import { NextRequest, NextResponse } from "next/server";
import {
  PictureRevealGameIdParamSchema,
  PictureRevealSessionListQuerySchema,
} from "@/lib/validations";
import {
  getPictureRevealPlayerToken,
  handlePictureRevealRouteError,
  requirePictureRevealAdmin,
  validatePictureRevealRouteInput,
} from "@/lib/picture-reveal-route";
import { PICTURE_REVEAL_PLAYER_TOKEN_COOKIE } from "@/services/picture-reveal-play.service";
import {
  createPictureRevealSession,
  getAdminPictureRevealSessionHistory,
} from "@/services/picture-reveal-play.service";

/**
 * Returns removed-session history compatibility response for admin callers.
 *
 * @param request - Admin request with optional session query filters.
 * @param props - Next route context containing the async game id params.
 * @returns JSON response from the compatibility service or a route error.
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    await requirePictureRevealAdmin(request);
    const paramResult = validatePictureRevealRouteInput(
      PictureRevealGameIdParamSchema,
      params,
    );

    if (paramResult.response) {
      return paramResult.response;
    }

    const queryResult = validatePictureRevealRouteInput(
      PictureRevealSessionListQuerySchema,
      {
        limit: request.nextUrl.searchParams.get("limit"),
        status: request.nextUrl.searchParams.get("status"),
      },
    );

    if (queryResult.response) {
      return queryResult.response;
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

/**
 * Creates a removed-session compatibility response for legacy player callers.
 *
 * @param request - Player request carrying the optional player token cookie.
 * @param props - Next route context containing the async game id params.
 * @returns JSON response from the compatibility service or a route error.
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    const result = validatePictureRevealRouteInput(
      PictureRevealGameIdParamSchema,
      params,
    );

    if (result.response) {
      return result.response;
    }

    const { session, issuedPlayerToken } = await createPictureRevealSession(
      result.data.id,
      getPictureRevealPlayerToken(request),
    );

    const response = NextResponse.json(session, { status: 201 });

    if (issuedPlayerToken) {
      response.cookies.set(
        PICTURE_REVEAL_PLAYER_TOKEN_COOKIE,
        issuedPlayerToken,
        {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        },
      );
    }

    return response;
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}
