import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { 
  getTierListById, 
  updateTierList, 
  softDeleteTierList 
} from "@/services/tier-lists.service";
import { UpdateTierListSchema } from "@/lib/validations";

type Params = { id: string };

export async function GET(request: NextRequest, props: { params: Promise<Params> }) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const list = await getTierListById(params.id);

    if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (list.deletedAt && (!session || session.user.role !== "admin")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    
    if (list.isPublic === 0 && list.isTemplate === 0) {
      if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (list.userId !== session.user.id && session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, props: { params: Promise<Params> }) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const list = await getTierListById(params.id);
    if (!list || list.deletedAt) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (list.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = UpdateTierListSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    if (result.data.isTemplate !== undefined && session.user.role !== "admin") {
      delete result.data.isTemplate;
    }

    const updated = await updateTierList(params.id, result.data);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<Params> }) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const list = await getTierListById(params.id);
    if (!list || list.deletedAt) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (list.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await softDeleteTierList(params.id);
    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
