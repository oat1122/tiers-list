"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Music2, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/components/confirm-dialog-provider";
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
import type { SoundGuessGameSummaryDto } from "@/types/sound-guess-admin";
import {
  buildSoundGuessCreatePayload,
  countSoundGuessGamesByStatus,
  extractSoundGuessApiError,
  filterSoundGuessGames,
  readSoundGuessJsonOrNull,
  soundGuessStatusFilters,
  type SoundGuessStatusFilter,
} from "./sound-guess-admin.utils";
import {
  SoundGuessGameCreateDialog,
  type CreateSoundGuessGameFormValues,
} from "./sound-guess-game-create-dialog";
import { SoundGuessGameCard } from "./sound-guess-game-card";

/**
 * Loads the latest admin-visible sound guess games from the API.
 *
 * @returns Admin game summaries returned by the sound guess API.
 * @throws Error when the API rejects the request.
 */
async function fetchGames() {
  const response = await fetch("/api/sound-guess-games", {
    method: "GET",
    cache: "no-store",
  });
  const payload = await readSoundGuessJsonOrNull(response);

  if (!response.ok) {
    throw new Error(
      extractSoundGuessApiError(payload) ?? "โหลดรายการเกมไม่สำเร็จ",
    );
  }

  return payload as SoundGuessGameSummaryDto[];
}

export function SoundGuessDashboardClient({
  initialGames = [],
}: {
  initialGames?: SoundGuessGameSummaryDto[];
}) {
  const router = useRouter();
  const { confirm } = useConfirmDialog();
  const [games, setGames] = useState(initialGames);
  const [loading, setLoading] = useState(initialGames.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<SoundGuessStatusFilter>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [busyGameId, setBusyGameId] = useState<string | null>(null);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);
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

  const counts = useMemo(() => countSoundGuessGamesByStatus(games), [games]);
  const filteredGames = useMemo(
    () => filterSoundGuessGames(games, deferredSearch, statusFilter),
    [deferredSearch, games, statusFilter],
  );

  const handleCreate = async (values: CreateSoundGuessGameFormValues) => {
    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/sound-guess-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSoundGuessCreatePayload(values)),
      });
      const payload = await readSoundGuessJsonOrNull(response);

      if (!response.ok) {
        throw new Error(
          extractSoundGuessApiError(payload) ?? "สร้างเกมไม่สำเร็จ",
        );
      }

      const created = payload as SoundGuessGameSummaryDto;
      setIsCreateOpen(false);
      toast.success("สร้าง draft game สำเร็จ");
      router.push(`/dashboard/sound-guess/${created.id}/edit`);
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "สร้างเกมไม่สำเร็จ";
      setCreateError(message);
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleVisibility = async (game: SoundGuessGameSummaryDto) => {
    setBusyGameId(game.id);

    try {
      const nextStatus = game.status === "published" ? "draft" : "published";
      const response = await fetch(`/api/sound-guess-games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await readSoundGuessJsonOrNull(response);

      if (!response.ok) {
        throw new Error(
          extractSoundGuessApiError(payload) ??
            "เปลี่ยนสถานะเกมไม่สำเร็จ",
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

  const handleDelete = async (game: SoundGuessGameSummaryDto) => {
    const shouldDelete = await confirm({
      title: "ลบเกมนี้หรือไม่?",
      description:
        "เกมจะถูก soft delete และหายจากหน้า admin list แต่ข้อมูลยังคงอยู่ในฐานข้อมูล",
      confirmLabel: "ลบเกม",
      cancelLabel: "ยกเลิก",
      variant: "destructive",
    });

    if (!shouldDelete) {
      return;
    }

    setDeletingGameId(game.id);

    try {
      const response = await fetch(`/api/sound-guess-games/${game.id}`, {
        method: "DELETE",
      });
      const payload = await readSoundGuessJsonOrNull(response);

      if (!response.ok) {
        throw new Error(extractSoundGuessApiError(payload) ?? "ลบเกมไม่สำเร็จ");
      }

      setGames((currentGames) =>
        currentGames.filter((currentGame) => currentGame.id !== game.id),
      );
      toast.success("ลบเกมเรียบร้อยแล้ว");
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "ลบเกมไม่สำเร็จ",
      );
    } finally {
      setDeletingGameId(null);
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
                    <Badge variant="warning">ผู้ดูแลระบบเกมทายเสียง</Badge>
                    <Badge variant="secondary">แผงควบคุมหลัก</Badge>
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                      จัดการเกมทายเสียง
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                      สร้าง draft game, จัดการไฟล์เสียงและคำตอบ แล้ว publish
                      เกมให้พร้อมใช้ใน flow เล่นฝั่งผู้ใช้
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/dashboard"
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
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
                    <Plus className="size-4" />
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
                  {soundGuessStatusFilters.map((filter) => (
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
                  <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full border border-border bg-background">
                    <Music2 className="size-5 text-muted-foreground" />
                  </div>
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
                  <SoundGuessGameCard
                    key={game.id}
                    game={game}
                    toggling={busyGameId === game.id}
                    deleting={deletingGameId === game.id}
                    onToggleVisibility={handleToggleVisibility}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SoundGuessGameCreateDialog
        open={isCreateOpen}
        pending={isCreating}
        error={createError}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
