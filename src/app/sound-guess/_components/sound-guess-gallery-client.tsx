"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PublicSoundGuessGameSummary } from "@/types/sound-guess-public";

/**
 * Normalizes gallery search text for locale-aware matching.
 *
 * @param value - Raw search text entered by the player.
 * @returns Trimmed lowercase search text.
 */
function normalizeQuery(value: string) {
  return value.trim().toLocaleLowerCase("th-TH");
}

/**
 * Formats a public game update timestamp for gallery cards.
 *
 * @param updatedAt - ISO timestamp from the public game contract.
 * @returns Thai localized date-time label.
 */
function formatUpdatedAt(updatedAt: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(updatedAt));
}

/**
 * Renders searchable public sound guess games.
 *
 * @param props - Public game summaries loaded by the server page.
 * @returns Searchable gallery for published sound guess games.
 */
export function SoundGuessGalleryClient({
  games,
}: {
  games: PublicSoundGuessGameSummary[];
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filteredGames = useMemo(() => {
    const normalizedQuery = normalizeQuery(deferredQuery);

    if (!normalizedQuery) {
      return games;
    }

    return games.filter((game) => {
      const searchableText = [
        game.title,
        game.description ?? "",
        String(game.soundCount),
      ]
        .join(" ")
        .toLocaleLowerCase("th-TH");

      return searchableText.includes(normalizedQuery);
    });
  }, [deferredQuery, games]);

  return (
    <main className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              เกมสาธารณะที่พร้อมเล่น
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              ค้นหาเกมจากชื่อหรือคำอธิบาย แล้วเข้าเล่นต่อได้ทันที
              หรือสร้างเกมของตัวเองแบบ local ได้จากหน้านี้
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 md:max-w-sm">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ค้นหา Sound Guess..."
                aria-label="Search sound guess games"
                className="h-10 rounded-xl bg-background pl-9"
              />
            </label>
            <Link
              href="/sound-guess/create"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              สร้างเกมของคุณเอง
            </Link>
          </div>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border bg-background/80 px-6 py-16 text-center shadow-sm">
          <p className="text-lg font-semibold text-foreground">
            ยังไม่มีเกมทายเสียงแบบสาธารณะให้เล่นในตอนนี้
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            เมื่อมีเกมที่ publish แล้ว รายการจะปรากฏที่หน้านี้ทันที
          </p>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border bg-background/80 px-6 py-14 text-center shadow-sm">
          <p className="text-lg font-semibold text-foreground">
            ไม่พบเกมที่ตรงกับคำค้นหา
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            ลองเปลี่ยนชื่อเกมหรือค้นหาด้วยคำที่สั้นลง
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {filteredGames.map((game) => (
            <Card
              key={game.id}
              size="sm"
              className="border-border/70 bg-background/92 shadow-sm"
            >
              <CardHeader className="gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="warning">Sound Guess</Badge>
                  <Badge variant="secondary">{game.soundCount} เสียง</Badge>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-lg">{game.title}</CardTitle>
                  <CardDescription className="line-clamp-3 min-h-16 leading-6">
                    {game.description?.trim() ||
                      "ฟังเสียงทีละข้อ แล้วเฉลยคำตอบเพื่อให้คะแนนผู้เล่น"}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border/70 bg-muted/25">
                  <Image
                    src={game.coverImagePath || "/home-vinyl-quiz.svg"}
                    alt={`Cover for ${game.title}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between gap-3 border-border/70 bg-muted/35">
                <p className="text-xs text-muted-foreground">
                  อัปเดตล่าสุด {formatUpdatedAt(game.updatedAt)}
                </p>
                <Link
                  href={`/sound-guess/${game.id}`}
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  เข้าเล่น
                  <ArrowRight className="size-4" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
