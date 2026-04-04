import { NextRequest, NextResponse } from "next/server";
import {
  OpenPictureRevealTileSchema,
  PictureRevealSessionRouteParamsSchema,
} from "@/lib/validations";
import {
  getPictureRevealPlayerToken,
  handlePictureRevealRouteError,
} from "@/lib/picture-reveal-route";
import { openPictureRevealTile } from "@/services/picture-reveal-play.service";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string; sessionId: string }> },
) {
  const params = await props.params;

  try {
    const paramResult = PictureRevealSessionRouteParamsSchema.safeParse(params);

    if (!paramResult.success) {
      return NextResponse.json(
        { error: paramResult.error.flatten() },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = OpenPictureRevealTileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    const session = await openPictureRevealTile(
      paramResult.data.id,
      paramResult.data.sessionId,
      result.data,
      getPictureRevealPlayerToken(request),
    );

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}
