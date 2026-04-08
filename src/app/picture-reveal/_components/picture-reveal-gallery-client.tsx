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
  return mode === "single"
    ? "แบบข้อเดียว (Single)"
    : "แบบต่อเนื่อง (Marathon)";
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
                placeholder="ค้นหา Picture Reveal..."
                aria-label="Search picture reveal games"
                className="h-10 rounded-xl bg-background pl-9"
              />
            </label>
            <Link
              href="/picture-reveal/create"
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
            ยังไม่มีเกมทายภาพ (Picture Reveal) แบบสาธารณะให้เล่นในตอนนี้
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            เมื่อมีเกมที่ publish แล้ว รายการจะปรากฏที่หน้านี้ทันที
            หรือจะสร้างเกม local ของตัวเองก่อนก็ได้
          </p>
          <Link
            href="/picture-reveal/create"
            className={cn(buttonVariants({ size: "sm" }), "mt-5")}
          >
            สร้างเกมของคุณเอง
            <ArrowRight className="size-4" />
          </Link>
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
                  <Badge variant="secondary">{game.imageCount} ภาพ</Badge>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-lg">{game.title}</CardTitle>
                  <CardDescription className="line-clamp-3 min-h-16 leading-6">
                    {game.description?.trim() ||
                      "เปิดป้ายทีละช่องเพื่อเดาคำตอบให้ถูกก่อนคะแนนจะลดลงไปมากกว่านี้"}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border/70 bg-muted/25">
                  {game.coverImagePath ? (
                    <Image
                      src={game.coverImagePath}
                      alt={`Cover for ${game.title}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full flex-col justify-end bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.15),_transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.82),rgba(241,245,249,0.92))] p-4 dark:bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),_transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.94))]">
                      <p className="text-sm font-semibold text-foreground">
                        ยังไม่มีรูปหน้าปก
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        เกมนี้ยังเล่นได้ตามปกติ สามารถเพิ่มรูปหน้าปกในโหมดแก้ไข
                        เพื่อให้ดูน่าสนใจขึ้นเมื่อเปิดเป็นสาธารณะ
                      </p>
                    </div>
                  )}
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
