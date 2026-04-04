import { NextRequest, NextResponse } from "next/server";
import { PictureRevealSessionRouteParamsSchema } from "@/lib/validations";
import {
  getPictureRevealPlayerToken,
  handlePictureRevealRouteError,
} from "@/lib/picture-reveal-route";
import { auth } from "@/lib/auth";
import { getPictureRevealSessionView } from "@/services/picture-reveal-play.service";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string; sessionId: string }> },
) {
  const params = await props.params;

  try {
    const result = PictureRevealSessionRouteParamsSchema.safeParse(params);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    const session = await auth.api.getSession({ headers: request.headers });
    const data = await getPictureRevealSessionView(
      result.data.id,
      result.data.sessionId,
      getPictureRevealPlayerToken(request),
      session?.user.role === "admin",
    );

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return handlePictureRevealRouteError(error);
  }
}
