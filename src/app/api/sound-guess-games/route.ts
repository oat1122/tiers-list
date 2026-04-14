import { NextRequest, NextResponse } from "next/server";
import {
  handleSoundGuessRouteError,
  requireSoundGuessAdmin,
  validateSoundGuessRouteInput,
} from "@/lib/sound-guess-route";
import { CreateSoundGuessGameSchema } from "@/lib/validations";
import {
  createSoundGuessGame,
  getAdminSoundGuessGames,
} from "@/services/sound-guess-games.service";

/**
 * Lists admin-visible sound guess games.
 *
 * @param request - Admin request used to verify the current session.
 * @returns JSON response containing admin game summaries.
 */
export async function GET(request: NextRequest) {
  try {
    await requireSoundGuessAdmin(request);

    const games = await getAdminSoundGuessGames();
    return NextResponse.json(games, { status: 200 });
  } catch (error) {
    return handleSoundGuessRouteError(error);
  }
}

/**
 * Creates a draft sound guess game for the current admin.
 *
 * @param request - Admin request containing the create-game JSON body.
 * @returns JSON response with the created game or a validation error.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireSoundGuessAdmin(request);
    const body = await request.json();
    const result = validateSoundGuessRouteInput(
      CreateSoundGuessGameSchema,
      body,
    );

    if (result.response) {
      return result.response;
    }

    const created = await createSoundGuessGame(result.data, session.user.id);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleSoundGuessRouteError(error);
  }
}

