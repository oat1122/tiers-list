import { NextRequest, NextResponse } from "next/server";
import {
  SaveSoundGuessGameContentSchema,
  SoundGuessGameIdParamSchema,
} from "@/lib/validations";
import {
  handleSoundGuessRouteError,
  requireSoundGuessAdmin,
  validateSoundGuessRouteInput,
} from "@/lib/sound-guess-route";
import {
  getSoundGuessGameContent,
  saveSoundGuessGameContent,
} from "@/services/sound-guess-games.service";

/**
 * Loads editable content for an admin sound guess game.
 *
 * @param request - Admin request used to verify the current session.
 * @param props - Next route context containing the async game id params.
 * @returns JSON response containing game content or a route error.
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    await requireSoundGuessAdmin(request);
    const result = validateSoundGuessRouteInput(
      SoundGuessGameIdParamSchema,
      params,
    );

    if (result.response) {
      return result.response;
    }

    const content = await getSoundGuessGameContent(result.data.id);

    if (!content) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(content, { status: 200 });
  } catch (error) {
    return handleSoundGuessRouteError(error);
  }
}

/**
 * Saves editable content for an admin sound guess game.
 *
 * @param request - Admin request containing the content JSON body.
 * @param props - Next route context containing the async game id params.
 * @returns JSON response containing saved content or a route error.
 */
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    await requireSoundGuessAdmin(request);
    const paramResult = validateSoundGuessRouteInput(
      SoundGuessGameIdParamSchema,
      params,
    );

    if (paramResult.response) {
      return paramResult.response;
    }

    const body = await request.json();
    const result = validateSoundGuessRouteInput(
      SaveSoundGuessGameContentSchema,
      body,
    );

    if (result.response) {
      return result.response;
    }

    const saved = await saveSoundGuessGameContent(
      paramResult.data.id,
      result.data,
    );

    return NextResponse.json(saved, { status: 200 });
  } catch (error) {
    return handleSoundGuessRouteError(error);
  }
}

