import { NextRequest, NextResponse } from "next/server";
import {
  CreatePictureRevealGameSchema,
} from "@/lib/validations";
import {
  handlePictureRevealRouteError,
  requirePictureRevealAdmin,
} from "@/lib/picture-reveal-route";
import {
  createPictureRevealGame,
  getAdminPictureRevealGames,
} from "@/services/picture-reveal-games.service";

export async function GET(request: NextRequest) {
  try {
    await requirePictureRevealAdmin(request);

    const games = await getAdminPictureRevealGames();
    return NextResponse.json(games, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePictureRevealAdmin(request);
    const body = await request.json();
    const result = CreatePictureRevealGameSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    const created = await createPictureRevealGame(result.data, session.user.id);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}
