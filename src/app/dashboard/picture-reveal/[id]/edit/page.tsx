import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PictureRevealEditorClient } from "./_components/picture-reveal-editor-client";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "แก้ไขเกมทายภาพ | แผงควบคุมผู้ดูแลระบบ",
  description: "แก้ไขการตั้งค่า ข้อมูลรูปภาพ และเนื้อหาของเกมทายภาพ",
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
