"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowRight, Search, Sparkles } from "lucide-react";
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
import type { PublicPictureRevealGameSummary } from "@/types/picture-reveal-public";

function normalizeQuery(value: string) {
  return value.trim().toLocaleLowerCase("th-TH");
}

function formatUpdatedAt(updatedAt: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(updatedAt));
}

function modeLabel(mode: PublicPictureRevealGameSummary["mode"]) {
  return mode === "single" ? "Single" : "Marathon";
}

function modeDescription(mode: PublicPictureRevealGameSummary["mode"]) {
  return mode === "single"
    ? "เล่นหนึ่งภาพต่อหนึ่ง session เหมาะกับการแชร์โจทย์เร็ว ๆ"
    : "เล่นต่อเนื่องหลายภาพใน session เดียวแล้วเก็บคะแนนรวมจนจบ";
}

export function PictureRevealGalleryClient({
  games,
}: {
  games: PublicPictureRevealGameSummary[];
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filteredGames = useMemo(() => {
    const normalizedQuery = normalizeQuery(deferredQuery);

    if (!normalizedQuery) {
      return games;
    }

    return games.filter((game) => {
      const searchableText = [game.title, game.description ?? "", game.mode]
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
              Public games พร้อมเล่น
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              ค้นหาเกมจากชื่อหรือคำอธิบาย แล้วเข้าเล่นต่อได้ทันทีโดยไม่ต้องผ่านหน้าแอดมิน
            </p>
          </div>

          <label className="relative block w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาเกม Picture Reveal..."
              aria-label="Search picture reveal games"
              className="h-10 rounded-xl bg-background pl-9"
            />
          </label>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border bg-background/80 px-6 py-16 text-center shadow-sm">
          <p className="text-lg font-semibold text-foreground">
            ยังไม่มี public Picture Reveal ให้เล่นในตอนนี้
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
            ลองเปลี่ยนชื่อเกม, คำอธิบาย หรือค้นหาด้วยคำที่สั้นลง
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
                  <Badge variant="warning">{modeLabel(game.mode)}</Badge>
                  <Badge variant="secondary">{game.imageCount} images</Badge>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-lg">{game.title}</CardTitle>
                  <CardDescription className="line-clamp-3 min-h-16 leading-6">
                    {game.description?.trim() ||
                      "เปิดป้ายทีละช่องเพื่อเดาคำตอบให้ถูกก่อนคะแนนจะลดลงไปมากกว่านี้"}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Sparkles className="size-4 text-primary" />
                    {modeDescription(game.mode)}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Start
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {game.startScore}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Open Tile
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      -{game.openTilePenalty}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Special
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      -{game.specialTilePenalty}
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between gap-3 border-border/70 bg-muted/35">
                <p className="text-xs text-muted-foreground">
                  อัปเดตล่าสุด {formatUpdatedAt(game.updatedAt)}
                </p>
                <Link
                  href={`/picture-reveal/${game.id}`}
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
