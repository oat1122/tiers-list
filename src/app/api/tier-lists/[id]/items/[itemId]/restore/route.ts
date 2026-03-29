import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { restoreTierItem, getTierItemById } from "@/services/tier-items.service";

type Params = { id: string; itemId: string };

export async function POST(request: NextRequest, props: { params: Promise<Params> }) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const item = await getTierItemById(params.itemId);
    if (!item || item.tierListId !== params.id) {
       return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await restoreTierItem(params.itemId);
    return NextResponse.json({ success: true, message: "Restored successfully" });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
