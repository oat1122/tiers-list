import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PictureRevealDashboardClient } from "./_components/picture-reveal-dashboard-client";
import { auth } from "@/lib/auth";
import { getAdminPictureRevealGames } from "@/services/picture-reveal-games.service";
import type { PictureRevealGameSummaryDto } from "@/types/picture-reveal-admin";

export const metadata: Metadata = {
  title: "Picture Reveal Admin | Dashboard",
  description: "จัดการเกม Picture Reveal สำหรับแอดมิน",
};

function serializeGames(
  games: Awaited<ReturnType<typeof getAdminPictureRevealGames>>,
): PictureRevealGameSummaryDto[] {
  return games.map((game) => ({
    ...game,
    status: game.status as PictureRevealGameSummaryDto["status"],
    mode: game.mode as PictureRevealGameSummaryDto["mode"],
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
    deletedAt: game.deletedAt?.toISOString() ?? null,
  }));
}

export default async function PictureRevealDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <PictureRevealDashboardClient
      initialGames={serializeGames(await getAdminPictureRevealGames())}
    />
  );
}
