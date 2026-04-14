import { NextRequest, NextResponse } from "next/server";
import {
  PictureRevealGameIdParamSchema,
  SavePictureRevealGameContentSchema,
} from "@/lib/validations";
import {
  handlePictureRevealRouteError,
  requirePictureRevealAdmin,
  validatePictureRevealRouteInput,
} from "@/lib/picture-reveal-route";
import {
  getPictureRevealGameContent,
  savePictureRevealGameContent,
} from "@/services/picture-reveal-games.service";

/**
 * Loads editable content for an admin picture reveal game.
 *
 * @param request - Admin request used to verify the current session.
 * @param props - Next route context containing the async game id params.
 * @returns JSON response containing game content or a route error.
 */
export async function GET(
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

    const content = await getPictureRevealGameContent(result.data.id);

    if (!content) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(content, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}

/**
 * Saves editable content for an admin picture reveal game.
 *
 * @param request - Admin request containing the content JSON body.
 * @param props - Next route context containing the async game id params.
 * @returns JSON response containing saved content or a route error.
 */
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    await requirePictureRevealAdmin(request);
    const paramResult = validatePictureRevealRouteInput(
      PictureRevealGameIdParamSchema,
      params,
    );

    if (paramResult.response) {
      return paramResult.response;
    }

    const body = await request.json();
    const result = validatePictureRevealRouteInput(
      SavePictureRevealGameContentSchema,
      body,
    );

    if (result.response) {
      return result.response;
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
