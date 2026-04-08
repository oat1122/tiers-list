"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PictureRevealGameSummaryDto } from "@/types/picture-reveal-admin";
import {
  buildPictureRevealCreatePayload,
  countPictureRevealGamesByStatus,
  extractPictureRevealApiError,
  filterPictureRevealGames,
  pictureRevealStatusFilters,
  readJsonOrNull,
  type PictureRevealStatusFilter,
} from "./picture-reveal-admin.utils";
import {
  PictureRevealGameCreateDialog,
  type CreatePictureRevealGameFormValues,
} from "./picture-reveal-game-create-dialog";
import { PictureRevealGameCard } from "./picture-reveal-game-card";

async function fetchGames() {
  const response = await fetch("/api/picture-reveal-games", {
    method: "GET",
    cache: "no-store",
  });
  const payload = await readJsonOrNull(response);

  if (!response.ok) {
    throw new Error(
      extractPictureRevealApiError(payload) ?? "โหลดรายการเกมไม่สำเร็จ",
    );
  }

  return payload as PictureRevealGameSummaryDto[];
}

export function PictureRevealDashboardClient({
  initialGames = [],
}: {
  initialGames?: PictureRevealGameSummaryDto[];
}) {
  const router = useRouter();
  const [games, setGames] = useState(initialGames);
  const [loading, setLoading] = useState(initialGames.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<PictureRevealStatusFilter>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [busyGameId, setBusyGameId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const refreshGames = async (showToast = true) => {
    setLoading(true);
    setError(null);

    try {
      setGames(await fetchGames());
      if (showToast) {
        toast.success("รีเฟรชรายการเกมล่าสุดแล้ว");
      }
    } catch (refreshError) {
      const message =
        refreshError instanceof Error
          ? refreshError.message
          : "โหลดรายการเกมไม่สำเร็จ";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialGames.length === 0) {
      void refreshGames(false);
    }
  }, [initialGames.length]);

  const counts = useMemo(() => countPictureRevealGamesByStatus(games), [games]);
  const filteredGames = useMemo(
    () => filterPictureRevealGames(games, deferredSearch, statusFilter),
    [deferredSearch, games, statusFilter],
  );

  const handleCreate = async (values: CreatePictureRevealGameFormValues) => {
    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/picture-reveal-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPictureRevealCreatePayload(values)),
      });
      const payload = await readJsonOrNull(response);

      if (!response.ok) {
        throw new Error(
          extractPictureRevealApiError(payload) ?? "สร้างเกมไม่สำเร็จ",
        );
      }

      const created = payload as PictureRevealGameSummaryDto;
      setIsCreateOpen(false);
      toast.success("สร้าง draft game สำเร็จ");
      router.push(`/dashboard/picture-reveal/${created.id}/edit`);
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "สร้างเกมไม่สำเร็จ";
      setCreateError(message);
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleVisibility = async (game: PictureRevealGameSummaryDto) => {
    setBusyGameId(game.id);

    try {
      const nextStatus = game.status === "published" ? "draft" : "published";
      const response = await fetch(`/api/picture-reveal-games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await readJsonOrNull(response);

      if (!response.ok) {
        throw new Error(
          extractPictureRevealApiError(payload) ?? "เปลี่ยนสถานะเกมไม่สำเร็จ",
        );
      }

      setGames((currentGames) =>
        currentGames.map((currentGame) =>
          currentGame.id === game.id
            ? {
                ...currentGame,
                status: nextStatus,
                updatedAt: new Date().toISOString(),
              }
            : currentGame,
        ),
      );
      toast.success(
        nextStatus === "published"
          ? "เปลี่ยนเกมเป็น Public แล้ว"
          : "เปลี่ยนเกมเป็น Private แล้ว",
      );
    } catch (toggleError) {
      toast.error(
        toggleError instanceof Error
          ? toggleError.message
          : "เปลี่ยนสถานะเกมไม่สำเร็จ",
      );
    } finally {
      setBusyGameId(null);
    }
  };

  return (
    <>
      <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.07),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.08),_transparent_28%)] px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <Card className="border-border/70 bg-background/90 shadow-sm">
            <CardContent className="space-y-6 px-6 py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning">ผู้ดูแลระบบเกมทายภาพ</Badge>
                    <Badge variant="secondary">แผงควบคุมหลัก</Badge>
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                      จัดการเกมเดาภาพแบบเปิดป้าย
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                      สร้าง draft game, ปรับ scoring, จัดการรูปและตัวเลือกคำตอบ
                      แล้วดูประวัติ session ของแต่ละเกมได้จาก workspace เดียว
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/dashboard"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <ArrowLeft className="size-4" />
                    กลับหน้า Dashboard
                  </Link>
                  <ThemeToggle />
                  <Button
                    variant="outline"
                    onClick={() => void refreshGames()}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    รีเฟรช
                  </Button>
                  <Button
                    onClick={() => {
                      setCreateError(null);
                      setIsCreateOpen(true);
                    }}
                  >
                    <ImagePlus className="size-4" />
                    สร้างเกมใหม่
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-border/70 bg-background/88 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardDescription>เกมทั้งหมด</CardDescription>
                    <CardTitle className="text-3xl">{counts.total}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="border-border/70 bg-background/88 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardDescription>แบบร่าง (Draft)</CardDescription>
                    <CardTitle className="text-3xl">{counts.draft}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="border-border/70 bg-background/88 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardDescription>เผยแพร่แล้ว (Published)</CardDescription>
                    <CardTitle className="text-3xl">
                      {counts.published}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-background/90 shadow-sm">
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-sm">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="ค้นหาจากชื่อเกมหรือคำอธิบาย"
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {pictureRevealStatusFilters.map((filter) => (
                    <Button
                      key={filter.key}
                      size="sm"
                      variant={
                        statusFilter === filter.key ? "default" : "outline"
                      }
                      onClick={() => setStatusFilter(filter.key)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              {loading && games.length === 0 ? (
                <div className="rounded-2xl border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                  กำลังโหลดรายการเกม...
                </div>
              ) : null}

              {!loading && filteredGames.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
                  <p className="font-medium text-foreground">
                    ยังไม่พบเกมที่ตรงกับเงื่อนไข
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    ลองเปลี่ยนคำค้นหรือสร้างเกม draft ใหม่จากปุ่มด้านบน
                  </p>
                </div>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-2">
                {filteredGames.map((game) => (
                  <PictureRevealGameCard
                    key={game.id}
                    game={game}
                    toggling={busyGameId === game.id}
                    onToggleVisibility={handleToggleVisibility}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PictureRevealGameCreateDialog
        open={isCreateOpen}
        pending={isCreating}
        error={createError}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
