import { NextRequest, NextResponse } from "next/server";
import { getDeletedTierLists } from "@/services/tier-lists.service";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const lists = await getDeletedTierLists();
    return NextResponse.json(lists);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
