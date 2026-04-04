import { redirect } from "next/navigation";

export default async function LegacyEditTemplatePage(
  props: PageProps<"/dashboard/templates/[id]/edit-template">,
) {
  const { id } = await props.params;
  redirect(`/dashboard/tier-lists/templates/${id}/edit-template`);
}
