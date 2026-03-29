import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMyTierLists, createTierList } from "@/services/tier-lists.service";
import { CreateTierListSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const lists = await getMyTierLists(session.user.id);
    return NextResponse.json(lists);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const result = CreateTierListSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    // Only admin can create templates
    if (result.data.isTemplate && session.user.role !== "admin") {
      result.data.isTemplate = 0;
    }

    const created = await createTierList(result.data, session.user.id);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
