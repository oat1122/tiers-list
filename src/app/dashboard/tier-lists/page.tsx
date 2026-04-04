import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TierListsDashboardClient } from "./_components/tier-lists-dashboard-client";
import { auth } from "@/lib/auth";
import { getAdminDashboardData } from "@/services/tier-lists.service";
import { serializeAdminDashboardResponse } from "@/types/admin-dashboard";

export const metadata: Metadata = {
  title: "Tier Lists Admin | Dashboard",
  description: "จัดการ tier lists ทั้งหมดของระบบจากหน้า admin โดยเฉพาะ",
};

export default async function TierListsDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const initialData = serializeAdminDashboardResponse(
    await getAdminDashboardData(),
  );

  return (
    <TierListsDashboardClient
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }}
      initialData={initialData}
    />
  );
}
