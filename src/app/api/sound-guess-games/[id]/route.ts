import { NextRequest, NextResponse } from "next/server";
import {
  SoundGuessGameIdParamSchema,
  UpdateSoundGuessGameSchema,
} from "@/lib/validations";
import {
  handleSoundGuessRouteError,
  requireSoundGuessAdmin,
  validateSoundGuessRouteInput,
} from "@/lib/sound-guess-route";
import {
  getSoundGuessGameById,
  softDeleteSoundGuessGame,
  updateSoundGuessGame,
} from "@/services/sound-guess-games.service";

/**
 * Loads one admin sound guess game by id.
 *
 * @param request - Admin request used to verify the current session.
 * @param props - Next route context containing the async game id params.
 * @returns JSON response containing the game or a route error.
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

    const game = await getSoundGuessGameById(result.data.id);

    if (!game || game.deletedAt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(game, { status: 200 });
  } catch (error) {
    return handleSoundGuessRouteError(error);
  }
}

/**
 * Updates admin-editable settings for one sound guess game.
 *
 * @param request - Admin request containing the settings JSON body.
 * @param props - Next route context containing the async game id params.
 * @returns JSON response containing the updated game or a route error.
 */
export async function PATCH(
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
      UpdateSoundGuessGameSchema,
      body,
    );

    if (result.response) {
      return result.response;
    }

    const game = await getSoundGuessGameById(paramResult.data.id);

    if (!game || game.deletedAt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await updateSoundGuessGame(paramResult.data.id, result.data);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return handleSoundGuessRouteError(error);
  }
}

/**
 * Soft-deletes one admin sound guess game.
 *
 * @param request - Admin request used to verify the current session.
 * @param props - Next route context containing the async game id params.
 * @returns JSON response confirming deletion or a route error.
 */
export async function DELETE(
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

    const game = await getSoundGuessGameById(result.data.id);

    if (!game || game.deletedAt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await softDeleteSoundGuessGame(result.data.id);
    return NextResponse.json(
      { success: true, message: "Deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    return handleSoundGuessRouteError(error);
  }
}

