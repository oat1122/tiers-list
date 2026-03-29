import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTierListById } from "@/services/tier-lists.service";
import { getTierItemById, updateTierItem, softDeleteTierItem } from "@/services/tier-items.service";
import { UpdateTierItemSchema } from "@/lib/validations";

type Params = { id: string; itemId: string };

async function checkPermissions(
  params: { id: string; itemId: string },
  request: NextRequest
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { error: "Unauthorized", status: 401 };

  const list = await getTierListById(params.id);
  if (!list || list.deletedAt) return { error: "Not found", status: 404 };

  if (list.userId !== session.user.id && session.user.role !== "admin") {
    return { error: "Forbidden", status: 403 };
  }

  const item = await getTierItemById(params.itemId);
  if (!item || item.tierListId !== params.id || item.deletedAt) {
    return { error: "Not found", status: 404 };
  }

  return null; // OK
}

export async function PATCH(request: NextRequest, props: { params: Promise<Params> }) {
  const params = await props.params;
  try {
    const errorResponse = await checkPermissions(params, request);
    if (errorResponse) {
      return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.status });
    }

    const body = await request.json();
    const result = UpdateTierItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    await updateTierItem(params.itemId, result.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<Params> }) {
  const params = await props.params;
  try {
    const errorResponse = await checkPermissions(params, request);
    if (errorResponse) {
      return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.status });
    }

    await softDeleteTierItem(params.itemId);
    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
