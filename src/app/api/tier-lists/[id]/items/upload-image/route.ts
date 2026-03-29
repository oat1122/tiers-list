import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTierListById } from "@/services/tier-lists.service";
import { createImageTierItem } from "@/services/tier-items.service";
import { UploadTierItemMetaSchema } from "@/lib/validations";

type Params = { id: string };

export async function POST(request: NextRequest, props: { params: Promise<Params> }) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const list = await getTierListById(params.id);
    if (!list || list.deletedAt) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (list.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const image = formData.get("image") as File;
    
    if (!image || typeof image === "string") {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Extract raw metadata fields from FormData
    const rawData = {
      tierListId: params.id,
      label: formData.get("label"),
      tier: formData.get("tier"),
      position: formData.get("position"),
      showCaption: formData.get("showCaption"),
    };

    const result = UploadTierItemMetaSchema.safeParse(rawData);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    await createImageTierItem(result.data, image);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const errMessage = (error as Error).message;
    if (errMessage.includes("ขนาดไฟล์") || errMessage.includes("รองรับเฉพาะไฟล์")) {
      return NextResponse.json({ error: errMessage }, { status: 400 });
    }
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
