import { NextRequest, NextResponse } from "next/server";
import {
  PictureRevealGameIdParamSchema,
  SavePictureRevealGameContentSchema,
} from "@/lib/validations";
import {
  handlePictureRevealRouteError,
  requirePictureRevealAdmin,
} from "@/lib/picture-reveal-route";
import {
  getPictureRevealGameContent,
  savePictureRevealGameContent,
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

    const content = await getPictureRevealGameContent(result.data.id);

    if (!content) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(content, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}

export async function PUT(
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
    const result = SavePictureRevealGameContentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    const saved = await savePictureRevealGameContent(
      paramResult.data.id,
      result.data,
    );

    return NextResponse.json(saved, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}
