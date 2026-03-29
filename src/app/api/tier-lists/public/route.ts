import { NextResponse } from "next/server";
import { getPublicTierLists } from "@/services/tier-lists.service";

export async function GET() {
  try {
    const lists = await getPublicTierLists();
    return NextResponse.json(lists);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
