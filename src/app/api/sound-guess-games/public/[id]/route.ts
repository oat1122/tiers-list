import { NextRequest, NextResponse } from "next/server";
import { SoundGuessGameIdParamSchema } from "@/lib/validations";
import {
  handleSoundGuessRouteError,
  validateSoundGuessRouteInput,
} from "@/lib/sound-guess-route";
import { getPublicSoundGuessGameById } from "@/services/sound-guess-games.service";

/**
 * Loads one published sound guess game for public play.
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
    const result = validateSoundGuessRouteInput(
      SoundGuessGameIdParamSchema,
      params,
    );

    if (result.response) {
      return result.response;
    }

    const game = await getPublicSoundGuessGameById(result.data.id);

    if (!game) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(game, { status: 200 });
  } catch (error) {
    return handleSoundGuessRouteError(error);
  }
}

