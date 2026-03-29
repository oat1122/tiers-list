import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  restoreTierList,
  getTierListById,
} from "@/services/tier-lists.service";

type Params = { id: string };

export async function POST(
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
    if (!list)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await restoreTierList(params.id);
    return NextResponse.json({
      success: true,
      message: "Restored successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
