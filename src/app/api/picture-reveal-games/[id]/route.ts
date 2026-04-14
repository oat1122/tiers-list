import { NextRequest, NextResponse } from "next/server";
import {
  PictureRevealGameIdParamSchema,
  UpdatePictureRevealGameSchema,
} from "@/lib/validations";
import {
  handlePictureRevealRouteError,
  requirePictureRevealAdmin,
  validatePictureRevealRouteInput,
} from "@/lib/picture-reveal-route";
import {
  getPictureRevealGameById,
  softDeletePictureRevealGame,
  updatePictureRevealGame,
} from "@/services/picture-reveal-games.service";

/**
 * Loads one admin picture reveal game by id.
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
    await requirePictureRevealAdmin(request);
    const result = validatePictureRevealRouteInput(
      PictureRevealGameIdParamSchema,
      params,
    );

    if (result.response) {
      return result.response;
    }

    const game = await getPictureRevealGameById(result.data.id);

    if (!game || game.deletedAt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(game, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}

/**
 * Updates admin-editable settings for one picture reveal game.
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
    await requirePictureRevealAdmin(request);
    const paramResult = validatePictureRevealRouteInput(
      PictureRevealGameIdParamSchema,
      params,
    );

    if (paramResult.response) {
      return paramResult.response;
    }

    const body = await request.json();
    const result = validatePictureRevealRouteInput(
      UpdatePictureRevealGameSchema,
      body,
    );

    if (result.response) {
      return result.response;
    }

    const game = await getPictureRevealGameById(paramResult.data.id);

    if (!game || game.deletedAt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await updatePictureRevealGame(
      paramResult.data.id,
      result.data,
    );
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}

/**
 * Soft-deletes one admin picture reveal game.
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
    await requirePictureRevealAdmin(request);
    const result = validatePictureRevealRouteInput(
      PictureRevealGameIdParamSchema,
      params,
    );

    if (result.response) {
      return result.response;
    }

    const game = await getPictureRevealGameById(result.data.id);

    if (!game || game.deletedAt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await softDeletePictureRevealGame(result.data.id);
    return NextResponse.json(
      { success: true, message: "Deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}
