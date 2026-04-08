"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Home as HomeIcon, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  buildPlayablePictureRevealFromLocalDraft,
  revokeLocalPictureRevealDraftUrls,
} from "@/lib/picture-reveal-local";
import { loadCurrentDraft } from "@/lib/picture-reveal-local-store";
import type { LocalPictureRevealDraft } from "@/types/picture-reveal-local";
import type { PublicPictureRevealGameDetail } from "@/types/picture-reveal-public";
import { PictureRevealPlayClient } from "@/app/picture-reveal/[id]/_components/picture-reveal-play-client";

const HOME_URL = "https://mavelus-jk.com";

function extractMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Could not load the local picture reveal draft.";
}

export function PictureRevealLocalPlayClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<PublicPictureRevealGameDetail | null>(null);
  const draftRef = useRef<LocalPictureRevealDraft | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDraft = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const storedDraft = await loadCurrentDraft();

        if (!storedDraft) {
          throw new Error("No local draft was found in this browser.");
        }

        const playableGame = buildPlayablePictureRevealFromLocalDraft(storedDraft);

        if (!cancelled) {
          draftRef.current = storedDraft;
          setGame(playableGame);
        } else {
          revokeLocalPictureRevealDraftUrls(storedDraft);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(extractMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDraft();

    return () => {
      cancelled = true;
      revokeLocalPictureRevealDraftUrls(draftRef.current);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-[2rem] border border-border/70 bg-background/90 px-6 py-16 text-center shadow-sm">
        <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          กำลังเตรียมเกมทายภาพของคุณ...
        </p>
      </div>
    );
  }

  if (!game || error) {
    return (
      <Card className="border-border/70 bg-background/92 shadow-sm">
        <CardHeader>
          <CardTitle>ยังไม่พร้อมเล่น</CardTitle>
          <CardDescription>
            {error ?? "ไม่พบแบบร่างเกมทายภาพในเบราว์เซอร์ หรือข้อมูลไม่สมบูรณ์"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link
            href="/picture-reveal/create"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <ArrowLeft className="size-4" />
            กลับไปหน้าสร้างเกม
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <header className="rounded-[2rem] border border-border/70 bg-background/90 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">ทายภาพ (Picture Reveal)</Badge>
              <Badge variant="secondary">แบบร่าง (Local)</Badge>
              <Badge variant="outline">{game.imageCount} ภาพ</Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={HOME_URL}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <HomeIcon className="size-4" />
                กลับหน้าหลัก
              </a>
              <Link
                href="/picture-reveal/create"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                <ArrowLeft className="size-4" />
                กลับไปหน้าสร้างเกม
              </Link>
              <ThemeToggle />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              {game.title || "เกมทายภาพ (Picture Reveal)"}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
              {game.description?.trim() ||
                "เกมทายภาพสำหรับผู้จัดกิจกรรม สร้างและเล่นจากข้อมูลที่บันทึกไว้ในเบราว์เซอร์"}
            </p>
          </div>
        </div>
      </header>

      <PictureRevealPlayClient game={game} />
    </div>
  );
}
