import { NextRequest, NextResponse } from "next/server";
import { TierListIdParamSchema } from "@/lib/validations";
import { getPublicTierListEditorData } from "@/services/tier-lists.service";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    const result = TierListIdParamSchema.safeParse(params);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    const data = await getPublicTierListEditorData(result.data.id);

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
