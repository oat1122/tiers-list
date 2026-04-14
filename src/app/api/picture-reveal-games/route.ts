import { NextRequest, NextResponse } from "next/server";
import {
  handlePictureRevealRouteError,
  requirePictureRevealAdmin,
  validatePictureRevealRouteInput,
} from "@/lib/picture-reveal-route";
import { CreatePictureRevealGameSchema } from "@/lib/validations";
import {
  createPictureRevealGame,
  getAdminPictureRevealGames,
} from "@/services/picture-reveal-games.service";

/**
 * Lists admin-visible picture reveal games.
 *
 * @param request - Admin request used to verify the current session.
 * @returns JSON response containing admin game summaries.
 */
export async function GET(request: NextRequest) {
  try {
    await requirePictureRevealAdmin(request);

    const games = await getAdminPictureRevealGames();
    return NextResponse.json(games, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}

/**
 * Creates a draft picture reveal game for the current admin.
 *
 * @param request - Admin request containing the create-game JSON body.
 * @returns JSON response with the created game or a validation error.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requirePictureRevealAdmin(request);
    const body = await request.json();
    const result = validatePictureRevealRouteInput(
      CreatePictureRevealGameSchema,
      body,
    );

    if (result.response) {
      return result.response;
    }

    const created = await createPictureRevealGame(result.data, session.user.id);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}
