import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UpdateTierListEditorSchema } from "@/lib/validations";
import {
  getTemplateEditorPageData,
  getTierListById,
  saveTierListEditor,
} from "@/services/tier-lists.service";

type Params = { id: string };

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<Params> },
) {
  const params = await props.params;

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const list = await getTierListById(params.id);
    if (!list || list.deletedAt || list.isTemplate !== 1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const result = UpdateTierListEditorSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    const saved = await saveTierListEditor(params.id, result.data);

    if (!saved) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<Params> },
) {
  const params = await props.params;

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await getTemplateEditorPageData(params.id);
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
