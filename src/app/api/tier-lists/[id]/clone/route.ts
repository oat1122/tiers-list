import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createFromTemplate } from "@/services/tier-lists.service";

type Params = { id: string };

export async function POST(request: NextRequest, props: { params: Promise<Params> }) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cloned = await createFromTemplate(params.id, session.user.id);
    return NextResponse.json(cloned, { status: 201 });
  } catch (error) {
    const err = error as Error;
    if (err.message === "Template not found") {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
