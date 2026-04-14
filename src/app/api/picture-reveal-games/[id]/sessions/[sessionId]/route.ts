import { NextRequest, NextResponse } from "next/server";
import { PictureRevealSessionRouteParamsSchema } from "@/lib/validations";
import {
  getPictureRevealPlayerToken,
  handlePictureRevealRouteError,
  validatePictureRevealRouteInput,
} from "@/lib/picture-reveal-route";
import { auth } from "@/lib/auth";
import { getPictureRevealSessionView } from "@/services/picture-reveal-play.service";

/**
 * Returns removed-session compatibility response for a legacy session view.
 *
 * @param request - Player or admin request carrying auth and cookie context.
 * @param props - Next route context containing async game and session params.
 * @returns JSON response from the compatibility service or a route error.
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string; sessionId: string }> },
) {
  const params = await props.params;

  try {
    const result = validatePictureRevealRouteInput(
      PictureRevealSessionRouteParamsSchema,
      params,
    );

    if (result.response) {
      return result.response;
    }

    const session = await auth.api.getSession({ headers: request.headers });
    const data = await getPictureRevealSessionView(
      result.data.id,
      result.data.sessionId,
      getPictureRevealPlayerToken(request),
      session?.user.role === "admin",
    );

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}
