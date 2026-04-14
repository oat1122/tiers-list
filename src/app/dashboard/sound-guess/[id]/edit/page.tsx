import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SoundGuessEditorClient } from "./_components/sound-guess-editor-client";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "แก้ไขเกมทายเสียง | แผงควบคุมผู้ดูแลระบบ",
  description: "แก้ไขการตั้งค่า ไฟล์เสียง และคำตอบของเกมทายเสียง",
};

export default async function SoundGuessEditorPage(
  props: PageProps<"/dashboard/sound-guess/[id]/edit">,
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

  return <SoundGuessEditorClient gameId={id} />;
}

