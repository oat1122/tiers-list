import { NextResponse } from "next/server";
import { getPublicPictureRevealGames } from "@/services/picture-reveal-games.service";
import { handlePictureRevealRouteError } from "@/lib/picture-reveal-route";

export async function GET() {
  try {
    const games = await getPublicPictureRevealGames();
    return NextResponse.json(games, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}
