import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { TierListEditor } from "@/components/tier-list-editor";
import { auth } from "@/lib/auth";
import {
  getTemplateEditorPageData,
  getTierListById,
} from "@/services/tier-lists.service";

export const metadata: Metadata = {
  title: "Edit Template | Tier Lists Admin",
  description: "แก้ไข template ของ tier list จาก workspace ฝั่งแอดมิน",
};

export default async function EditTierListTemplatePage(
  props: PageProps<"/dashboard/tier-lists/templates/[id]/edit-template">,
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
      initialData={initialTemplateData}
      backHref="/dashboard/tier-lists"
    />
  );
}
