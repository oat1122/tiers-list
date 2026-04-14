import { NextRequest, NextResponse } from "next/server";
import { PictureRevealGameIdParamSchema } from "@/lib/validations";
import {
  handlePictureRevealRouteError,
  validatePictureRevealRouteInput,
} from "@/lib/picture-reveal-route";
import { getPublicPictureRevealGameById } from "@/services/picture-reveal-games.service";

/**
 * Loads one published picture reveal game for public play.
 *
 * @param _request - Public route request, unused because this endpoint is open.
 * @param props - Next route context containing the async game id params.
 * @returns JSON response containing the public game or a route error.
 */
export async function GET(
  _request: NextRequest,
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

    const game = await getPublicPictureRevealGameById(result.data.id);

    if (!game) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(game, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}
