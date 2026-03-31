import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTierListById } from "@/services/tier-lists.service";
import { saveTempImageFile, UploadValidationError } from "@/lib/upload";

type Params = { id: string };

export async function POST(
  request: NextRequest,
  props: { params: Promise<Params> },
) {
  const params = await props.params;

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await getTierListById(params.id);
    if (!list || list.deletedAt || list.isTemplate !== 1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (list.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!image || typeof image === "string") {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 },
      );
    }

    const tempUploadPath = await saveTempImageFile(image);
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

    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
