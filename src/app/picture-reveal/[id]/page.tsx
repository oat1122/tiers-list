import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Gamepad2, Home as HomeIcon, LogIn } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { serializePublicPictureRevealGameDetail } from "@/lib/picture-reveal-public";
import { getPublicPictureRevealGameById } from "@/services/picture-reveal-games.service";
import { PictureRevealPlayClient } from "./_components/picture-reveal-play-client";

const HOME_URL = "https://mavelus-jk.com";

export const metadata: Metadata = {
  title: "Play Picture Reveal | Public Games",
  description: "Host-run Picture Reveal with hidden answers and live local scoring.",
};

export default async function PictureRevealGamePage(
  props: PageProps<"/picture-reveal/[id]">,
) {
  await connection();

  const { id } = await props.params;
  const game = await getPublicPictureRevealGameById(id);

  if (!game) {
    notFound();
  }

  const publicGame = serializePublicPictureRevealGameDetail(game);

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.07),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.08),_transparent_28%)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 md:py-12">
        <header className="rounded-[2rem] border border-border/70 bg-background/90 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="warning">
                  <Gamepad2 className="mr-1 size-3.5" />
                  Picture Reveal
                </Badge>
                <Badge variant="secondary">{publicGame.imageCount} images</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={HOME_URL}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <HomeIcon className="size-4" />
                  Back to home
                </a>
                <Link
                  href="/"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Public Portal
                </Link>
                <Link
                  href="/picture-reveal"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  All Games
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <LogIn className="size-4" />
                  Login
                </Link>
                <ThemeToggle />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {publicGame.title}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                {publicGame.description?.trim() ||
                  "Host-run hidden-answer mode with local scoring and no saved session history."}
              </p>
            </div>
          </div>
        </header>

        <PictureRevealPlayClient game={publicGame} />
      </section>
    </div>
  );
}
