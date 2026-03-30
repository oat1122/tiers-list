import type { Metadata } from "next";
import { TierListApp } from "@/components/tier-list-app";
import { getPublicTierListEditorData } from "@/services/tier-lists.service";

export const metadata: Metadata = {
  title: "Create | Tier List",
  description: "เริ่มจัดอันดับจากหน้าเปล่าหรือโหลด public tier list มาแก้ต่อใน local editor",
};

function readSourceParam(value: string | string[] | undefined) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (Array.isArray(value) && value[0]?.trim()) {
    return value[0].trim();
  }

  return null;
}

export default async function CreatePage(props: PageProps<"/create">) {
  const searchParams = await props.searchParams;
  const sourceId = readSourceParam(searchParams.source);

  const initialData = sourceId
    ? await getPublicTierListEditorData(sourceId)
    : null;

  const warningMessage =
    sourceId && !initialData
      ? "ไม่พบ public tier list ต้นทางแล้ว ระบบจึงเปิด local editor แบบหน้าเปล่าให้แทน"
      : null;

  return (
    <TierListApp
      initialData={initialData ?? undefined}
      warningMessage={warningMessage}
    />
  );
}
