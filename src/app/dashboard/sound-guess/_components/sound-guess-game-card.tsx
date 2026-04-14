"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Loader2, Music2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SoundGuessGameSummaryDto } from "@/types/sound-guess-admin";
import { formatSoundGuessDateTime } from "./sound-guess-admin.utils";

function statusVariant(status: SoundGuessGameSummaryDto["status"]) {
  return status === "published" ? "success" : "secondary";
}

export function SoundGuessGameCard({
  game,
  toggling = false,
  deleting = false,
  onToggleVisibility,
  onDelete,
}: {
  game: SoundGuessGameSummaryDto;
  toggling?: boolean;
  deleting?: boolean;
  onToggleVisibility?: (game: SoundGuessGameSummaryDto) => Promise<void>;
  onDelete?: (game: SoundGuessGameSummaryDto) => Promise<void>;
}) {
  const isBusy = toggling || deleting;

  return (
    <Card className="overflow-hidden border-border/70 bg-background/90 shadow-sm">
      <div className="relative aspect-[2/1] border-b bg-muted/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={game.coverImagePath ?? "/placeholder-vinyl.svg"}
          alt={`${game.title} cover`}
          className="h-full w-full object-cover"
        />
      </div>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant(game.status)}>{game.status}</Badge>
              <Badge variant="outline">Sound Guess</Badge>
            </div>
            <CardTitle>{game.title}</CardTitle>
            <CardDescription>
              {game.description?.trim() || "ยังไม่มีคำอธิบายสำหรับเกมนี้"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-muted/20 px-3 py-3">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Music2 className="size-4" />
            {game.soundCount} เสียงในเกม
          </div>
          <p className="mt-1">
            เพิ่มเสียงและคำตอบในหน้า editor ก่อน publish ให้ผู้เล่นใช้งาน
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/20 px-3 py-3">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Clock3 className="size-4" />
            อัปเดตล่าสุด
          </div>
          <p className="mt-1">{formatSoundGuessDateTime(game.updatedAt)}</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch justify-between gap-3 border-border/70 bg-muted/25 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          พร้อมเข้าไปแก้ settings และ content เสียง
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => void onDelete?.(game)}
            disabled={isBusy}
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            ลบ
          </Button>
          <Button
            type="button"
            size="sm"
            variant={game.status === "published" ? "outline" : "secondary"}
            onClick={() => void onToggleVisibility?.(game)}
            disabled={isBusy}
          >
            {toggling ? <Loader2 className="size-4 animate-spin" /> : null}
            {game.status === "published"
              ? "เปลี่ยนเป็นซ่อน"
              : "เปลี่ยนเป็นสาธารณะ"}
          </Button>
          <Link
            href={`/dashboard/sound-guess/${game.id}/edit`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            เปิด editor
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

