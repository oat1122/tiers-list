import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PictureRevealEditorClient } from "./_components/picture-reveal-editor-client";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Edit Picture Reveal Game | Admin",
  description: "แก้ไข settings, content และ history ของ Picture Reveal Game",
};

export default async function PictureRevealEditorPage(
  props: PageProps<"/dashboard/picture-reveal/[id]/edit">,
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

  return <PictureRevealEditorClient gameId={id} />;
}
