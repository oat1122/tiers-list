import { NextResponse } from "next/server";
import { handleSoundGuessRouteError } from "@/lib/sound-guess-route";
import { getPublicSoundGuessGames } from "@/services/sound-guess-games.service";

/**
 * Lists published sound guess games for the public gallery.
 *
 * @returns JSON response containing public game summaries.
 */
export async function GET() {
  try {
    const games = await getPublicSoundGuessGames();
    return NextResponse.json(games, { status: 200 });
  } catch (error) {
    return handleSoundGuessRouteError(error);
  }
}

