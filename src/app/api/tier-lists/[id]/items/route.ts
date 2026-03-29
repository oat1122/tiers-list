import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTierListById } from "@/services/tier-lists.service";
import {
  getTierItems,
  createTextTierItem,
} from "@/services/tier-items.service";
import { CreateTextTierItemSchema } from "@/lib/validations";

type Params = { id: string };

export async function GET(
  request: NextRequest,
  props: { params: Promise<Params> },
) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const list = await getTierListById(params.id);

    if (!list || list.deletedAt)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (list.isPublic === 0 && list.isTemplate === 0) {
      if (!session)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (list.userId !== session.user.id && session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const items = await getTierItems(params.id);
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

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

    const body = await request.json();
    // เพิ่ม tierListId ลงใน body ก่อนตรวจสอบ Validation (มันมาจาก URL param)
    body.tierListId = params.id;

    // API Route นี้รองรับเฉพาะสร้าง Text Item. ถ้ารูปให้ใช้ upload-image endpoint
    if (body.itemType !== "text") {
      return NextResponse.json(
        { error: "Use /upload-image endpoint for images" },
        { status: 400 },
      );
    }

    const result = CreateTextTierItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    await createTextTierItem(result.data);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
