import { NextRequest, NextResponse } from "next/server";
import { PictureRevealGameIdParamSchema } from "@/lib/validations";
import { handlePictureRevealRouteError } from "@/lib/picture-reveal-route";
import { getPublicPictureRevealGameById } from "@/services/picture-reveal-games.service";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    const result = PictureRevealGameIdParamSchema.safeParse(params);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    const game = await getPublicPictureRevealGameById(result.data.id);

    if (!game) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(game, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}
