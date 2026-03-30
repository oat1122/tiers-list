import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardPanel } from "./_components/dashboard-panel";
import { auth } from "@/lib/auth";
import { getAdminDashboardData } from "@/services/tier-lists.service";
import { serializeAdminDashboardResponse } from "@/types/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard | Tier List",
  description: "ศูนย์จัดการระบบ tier lists สำหรับผู้ดูแล",
};

export default async function DashboardPage() {
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
    <DashboardPanel
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
