import { NextRequest, NextResponse } from "next/server";
import { savePictureRevealTempImageFile } from "@/lib/picture-reveal-upload";
import {
  handlePictureRevealRouteError,
  requirePictureRevealAdmin,
} from "@/lib/picture-reveal-route";
import { getPictureRevealGameById } from "@/services/picture-reveal-games.service";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    await requirePictureRevealAdmin(request);

    const game = await getPictureRevealGameById(params.id);

    if (!game || game.deletedAt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const originalImage = formData.get("originalImage");

    if (!image || typeof image === "string") {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 },
      );
    }

    const tempImagePath = await savePictureRevealTempImageFile(image);
    const tempOriginalImagePath =
      originalImage && typeof originalImage !== "string"
        ? await savePictureRevealTempImageFile(originalImage)
        : null;

    return NextResponse.json(
      { tempImagePath, tempOriginalImagePath },
      { status: 201 },
    );
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}