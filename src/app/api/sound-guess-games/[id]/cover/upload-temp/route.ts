import { NextRequest, NextResponse } from "next/server";
import { saveSoundGuessTempCoverImageFile } from "@/lib/sound-guess-upload";
import {
  handleSoundGuessRouteError,
  requireSoundGuessAdmin,
  validateSoundGuessRouteInput,
} from "@/lib/sound-guess-route";
import { UploadValidationError } from "@/lib/upload";
import { SoundGuessGameIdParamSchema } from "@/lib/validations";
import { getSoundGuessGameById } from "@/services/sound-guess-games.service";

/**
 * Uploads a temporary cover image for an admin sound guess game.
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
    await requireSoundGuessAdmin(request);
    const result = validateSoundGuessRouteInput(
      SoundGuessGameIdParamSchema,
      params,
    );

    if (result.response) {
      return result.response;
    }

    const game = await getSoundGuessGameById(result.data.id);

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

    const tempUploadPath = await saveSoundGuessTempCoverImageFile(image);
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

    return handleSoundGuessRouteError(error);
  }
}

