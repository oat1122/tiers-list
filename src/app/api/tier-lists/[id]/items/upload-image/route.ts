import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTierListById } from "@/services/tier-lists.service";
import { createImageTierItem } from "@/services/tier-items.service";
import { UploadTierItemMetaSchema } from "@/lib/validations";
import { buildTemplateEditorPageData } from "@/lib/tier-editor";

type Params = { id: string };

export async function POST(
  request: NextRequest,
  props: { params: Promise<Params> },
) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const list = await getTierListById(params.id);
    if (!list || list.deletedAt)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (list.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image || typeof image === "string") {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    const created = await createImageTierItem(result.data, image);

    if (!created) {
      return NextResponse.json(
        { error: "Unable to create item" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      buildTemplateEditorPageData({
        listId: params.id,
        title: list.title,
        description: list.description,
        editorConfig: list.editorConfig,
        items: [
          {
            id: created.id,
            label: created.label,
            tier: created.tier,
            position: created.position,
            itemType: created.itemType === "image" ? "image" : "text",
            imagePath: created.imagePath,
            showCaption: created.showCaption,
          },
        ],
        updatedAt: created.updatedAt,
      }).items[0],
      { status: 201 },
    );
  } catch (error) {
    const errMessage = (error as Error).message;
    if (
      errMessage.includes("ขนาดไฟล์") ||
      errMessage.includes("รองรับเฉพาะไฟล์")
    ) {
      return NextResponse.json({ error: errMessage }, { status: 400 });
    }
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
