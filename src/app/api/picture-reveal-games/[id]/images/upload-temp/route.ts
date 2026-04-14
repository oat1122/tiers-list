import { NextRequest, NextResponse } from "next/server";
import { savePictureRevealTempImageFile } from "@/lib/picture-reveal-upload";
import {
  handlePictureRevealRouteError,
  requirePictureRevealAdmin,
  validatePictureRevealRouteInput,
} from "@/lib/picture-reveal-route";
import { UploadValidationError } from "@/lib/upload";
import { PictureRevealGameIdParamSchema } from "@/lib/validations";
import { getPictureRevealGameById } from "@/services/picture-reveal-games.service";

/**
 * Uploads a temporary cropped image and optional original image for a game item.
 *
 * @param request - Admin multipart request containing image files.
 * @param props - Next route context containing the async game id params.
 * @returns JSON response containing temporary image upload paths.
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    await requirePictureRevealAdmin(request);
    const result = validatePictureRevealRouteInput(
      PictureRevealGameIdParamSchema,
      params,
    );

    if (result.response) {
      return result.response;
    }

    const game = await getPictureRevealGameById(result.data.id);

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
    if (error instanceof UploadValidationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          limitBytes: error.limitBytes,
          recommendedSize: error.recommendedSize,
          recommendedMimeTypes: error.recommendedMimeTypes,
        },
        { status: 400 },
      );
    }

    return handlePictureRevealRouteError(error);
  }
}
