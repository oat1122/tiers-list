"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Layers3, Loader2 } from "lucide-react";
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
import type { PictureRevealGameSummaryDto } from "@/types/picture-reveal-admin";
import { formatDateTime } from "./picture-reveal-admin.utils";

function statusVariant(status: PictureRevealGameSummaryDto["status"]) {
  return status === "published" ? "success" : "secondary";
}

export function PictureRevealGameCard({
  game,
  toggling = false,
  onToggleVisibility,
}: {
  game: PictureRevealGameSummaryDto;
  toggling?: boolean;
  onToggleVisibility?: (game: PictureRevealGameSummaryDto) => Promise<void>;
}) {
  return (
    <Card className="border-border/70 bg-background/90 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant(game.status)}>{game.status}</Badge>
              <Badge variant="outline">{game.mode === "single" ? "แบบข้อเดียว (Single)" : "แบบต่อเนื่อง (Marathon)"}</Badge>
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
            <Layers3 className="size-4" />
            {game.imageCount} รูปในเกม
          </div>
          <p className="mt-1">
            เริ่ม {game.startScore} คะแนน, เปิดป้าย -{game.openTilePenalty},
            พิเศษเพิ่ม -{game.specialTilePenalty}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/20 px-3 py-3">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Clock3 className="size-4" />
            อัปเดตล่าสุด
          </div>
          <p className="mt-1">{formatDateTime(game.updatedAt)}</p>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3 border-border/70 bg-muted/25">
        <p className="text-sm text-muted-foreground">
          พร้อมเข้าไปแก้ settings, content และ history
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={game.status === "published" ? "outline" : "secondary"}
            onClick={() => void onToggleVisibility?.(game)}
            disabled={toggling}
          >
            {toggling ? <Loader2 className="size-4 animate-spin" /> : null}
            {game.status === "published" ? "เปลี่ยนเป็นซ่อน" : "เปลี่ยนเป็นสาธารณะ"}
          </Button>
          <Link
            href={`/dashboard/picture-reveal/${game.id}/edit`}
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
