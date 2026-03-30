import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminDashboardData } from "@/services/tier-lists.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await getAdminDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
