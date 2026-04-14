import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SoundGuessDashboardClient } from "./_components/sound-guess-dashboard-client";
import { auth } from "@/lib/auth";
import { getAdminSoundGuessGames } from "@/services/sound-guess-games.service";
import type { SoundGuessGameSummaryDto } from "@/types/sound-guess-admin";

export const metadata: Metadata = {
  title: "จัดการเกมทายเสียง | Dashboard",
  description: "ระบบจัดการเกมทายเสียงสำหรับผู้ดูแลระบบ",
};

/**
 * Converts database-backed admin game rows into serializable dashboard DTOs.
 *
 * @param games - Sound guess games loaded from the service layer.
 * @returns Dashboard-ready game summaries with ISO date strings.
 */
function serializeGames(
  games: Awaited<ReturnType<typeof getAdminSoundGuessGames>>,
): SoundGuessGameSummaryDto[] {
  return games.map((game) => ({
    ...game,
    status: game.status as SoundGuessGameSummaryDto["status"],
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
    deletedAt: game.deletedAt?.toISOString() ?? null,
  }));
}

export default async function SoundGuessDashboardPage() {
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
    <SoundGuessDashboardClient
      initialGames={serializeGames(await getAdminSoundGuessGames())}
    />
  );
}

