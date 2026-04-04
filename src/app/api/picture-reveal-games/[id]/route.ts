import { NextRequest, NextResponse } from "next/server";
import {
  PictureRevealGameIdParamSchema,
  UpdatePictureRevealGameSchema,
} from "@/lib/validations";
import {
  handlePictureRevealRouteError,
  requirePictureRevealAdmin,
} from "@/lib/picture-reveal-route";
import {
  getPictureRevealGameById,
  softDeletePictureRevealGame,
  updatePictureRevealGame,
} from "@/services/picture-reveal-games.service";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    await requirePictureRevealAdmin(request);
    const result = PictureRevealGameIdParamSchema.safeParse(params);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
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

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    await requirePictureRevealAdmin(request);
    const paramResult = PictureRevealGameIdParamSchema.safeParse(params);

    if (!paramResult.success) {
      return NextResponse.json(
        { error: paramResult.error.flatten() },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = UpdatePictureRevealGameSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    const game = await getPictureRevealGameById(paramResult.data.id);

    if (!game || game.deletedAt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await updatePictureRevealGame(paramResult.data.id, result.data);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    await requirePictureRevealAdmin(request);
    const result = PictureRevealGameIdParamSchema.safeParse(params);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
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
