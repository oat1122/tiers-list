import { NextResponse } from "next/server";
import { getPublicPictureRevealGames } from "@/services/picture-reveal-games.service";
import { handlePictureRevealRouteError } from "@/lib/picture-reveal-route";

/**
 * Lists published picture reveal games for the public gallery.
 *
 * @returns JSON response containing public game summaries.
 */
export async function GET() {
  try {
    const games = await getPublicPictureRevealGames();
    return NextResponse.json(games, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}
