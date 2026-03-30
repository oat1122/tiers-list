import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { TierListEditor } from "@/components/tier-list-editor";
import { auth } from "@/lib/auth";
import { getTemplateEditorPageData, getTierListById } from "@/services/tier-lists.service";

export const metadata: Metadata = {
  title: "Edit Template | Tier List",
  description: "แก้ไข template และบันทึกการจัดวางได้จากหน้าเดียว",
};

export default async function EditTemplatePage(
  props: PageProps<"/dashboard/templates/[id]/edit-template">,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const { id } = await props.params;
  const list = await getTierListById(id);

  if (!list || list.deletedAt || list.isTemplate !== 1) {
    notFound();
  }

  const initialTemplateData = await getTemplateEditorPageData(id);

  if (!initialTemplateData) {
    notFound();
  }

  return (
    <TierListEditor
      mode="template"
      initialTemplateData={initialTemplateData}
      backHref="/dashboard"
    />
  );
}
