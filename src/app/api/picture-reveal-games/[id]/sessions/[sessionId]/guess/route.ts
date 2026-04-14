import { NextRequest, NextResponse } from "next/server";
import {
  GuessPictureRevealChoiceSchema,
  PictureRevealSessionRouteParamsSchema,
} from "@/lib/validations";
import {
  getPictureRevealPlayerToken,
  handlePictureRevealRouteError,
  validatePictureRevealRouteInput,
} from "@/lib/picture-reveal-route";
import { guessPictureRevealChoice } from "@/services/picture-reveal-play.service";

/**
 * Returns removed-session compatibility response for legacy guess submissions.
 *
 * @param request - Player request containing the legacy guess JSON body.
 * @param props - Next route context containing async game and session params.
 * @returns JSON response from the compatibility service or a route error.
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string; sessionId: string }> },
) {
  const params = await props.params;

  try {
    const paramResult = validatePictureRevealRouteInput(
      PictureRevealSessionRouteParamsSchema,
      params,
    );

    if (paramResult.response) {
      return paramResult.response;
    }

    const body = await request.json();
    const result = validatePictureRevealRouteInput(
      GuessPictureRevealChoiceSchema,
      body,
    );

    if (result.response) {
      return result.response;
    }

    const session = await guessPictureRevealChoice(
      paramResult.data.id,
      paramResult.data.sessionId,
      result.data,
      getPictureRevealPlayerToken(request),
    );

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}
