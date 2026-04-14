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
 * Uploads a temporary cover image for an admin picture reveal game.
 *
 * @param request - Admin multipart request containing the cover image file.
 * @param props - Next route context containing the async game id params.
 * @returns JSON response containing the temporary cover upload path.
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

    if (!image || typeof image === "string") {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 },
      );
    }

    const tempUploadPath = await savePictureRevealTempImageFile(image);
    return NextResponse.json({ tempUploadPath }, { status: 201 });
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
