"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/components/confirm-dialog-provider";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  UpdatePictureRevealGameSchema,
  type SavePictureRevealGameContentInput,
} from "@/lib/validations";
import { cn } from "@/lib/utils";
import type {
  PictureRevealGameContentDto,
  PictureRevealSessionHistoryDto,
} from "@/types/picture-reveal-admin";
import {
  extractPictureRevealApiError,
  formatDateTime,
  readJsonOrNull,
} from "@/app/dashboard/picture-reveal/_components/picture-reveal-admin.utils";
import { PictureRevealContentForm } from "./picture-reveal-content-form";

type TabKey = "settings" | "content" | "history";
type HistoryStatus = "all" | "active" | "completed";
type PictureRevealGameDetails = Omit<PictureRevealGameContentDto, "images">;
type SettingsFormValues = z.input<typeof UpdatePictureRevealGameSchema>;

async function fetchGame(gameId: string) {
  const response = await fetch(`/api/picture-reveal-games/${gameId}`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await readJsonOrNull(response);

  if (!response.ok) {
    throw new Error(
      extractPictureRevealApiError(payload) ?? "โหลดข้อมูลเกมไม่สำเร็จ",
    );
  }

  return payload as PictureRevealGameDetails;
}

async function fetchContent(gameId: string) {
  const response = await fetch(`/api/picture-reveal-games/${gameId}/content`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await readJsonOrNull(response);

  if (!response.ok) {
    throw new Error(
      extractPictureRevealApiError(payload) ?? "โหลด content ไม่สำเร็จ",
    );
  }

  return payload as PictureRevealGameContentDto;
}

async function fetchHistory(
  gameId: string,
  status: HistoryStatus,
  limit: number,
) {
  const query = new URLSearchParams({ limit: String(limit) });

  if (status !== "all") {
    query.set("status", status);
  }

  const response = await fetch(
    `/api/picture-reveal-games/${gameId}/sessions?${query.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );
  const payload = await readJsonOrNull(response);

  if (!response.ok) {
    throw new Error(
      extractPictureRevealApiError(payload) ?? "โหลดประวัติการเล่นไม่สำเร็จ",
    );
  }

  return payload as PictureRevealSessionHistoryDto[];
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button variant={active ? "default" : "outline"} onClick={onClick}>
      {children}
    </Button>
  );
}

export function PictureRevealEditorClient({ gameId }: { gameId: string }) {
  const { confirm } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<TabKey>("settings");
  const [game, setGame] = useState<PictureRevealGameDetails | null>(null);
  const [content, setContent] = useState<PictureRevealGameContentDto | null>(null);
  const [history, setHistory] = useState<PictureRevealSessionHistoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [historyStatus, setHistoryStatus] = useState<HistoryStatus>("all");
  const [historyLimit, setHistoryLimit] = useState(20);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [contentDirty, setContentDirty] = useState(false);

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(UpdatePictureRevealGameSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
      mode: "single",
      startScore: 1000,
      openTilePenalty: 50,
      specialTilePenalty: 200,
    },
  });

  const isEditorDirty = settingsForm.formState.isDirty || contentDirty;

  useEffect(() => {
    if (!isEditorDirty) {
      return;
    }

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isEditorDirty]);

  const loadEditorData = async (showToast = false) => {
    setLoading(true);
    setPageError(null);

    try {
      const [nextGame, nextContent, nextHistory] = await Promise.all([
        fetchGame(gameId),
        fetchContent(gameId),
        fetchHistory(gameId, historyStatus, historyLimit),
      ]);

      setGame(nextGame);
      setContent(nextContent);
      setHistory(nextHistory);
      setContentDirty(false);
      settingsForm.reset({
        title: nextGame.title,
        description: nextGame.description ?? "",
        status: nextGame.status,
        mode: nextGame.mode,
        startScore: nextGame.startScore,
        openTilePenalty: nextGame.openTilePenalty,
        specialTilePenalty: nextGame.specialTilePenalty,
      });

      if (showToast) {
        toast.success("รีเฟรชข้อมูลเกมล่าสุดแล้ว");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "โหลด editor ไม่สำเร็จ";
      setPageError(message);
      if (showToast) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEditorData(false);
  }, [gameId, historyLimit, historyStatus]);

  const handleLeavePage = async (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    if (!isEditorDirty) {
      return;
    }

    event.preventDefault();

    const shouldLeave = await confirm({
      title: "ออกจากหน้าแก้ไขโดยไม่บันทึก?",
      description:
        "ยังมีการเปลี่ยนแปลงใน settings หรือ content ที่ยังไม่ได้บันทึก",
      confirmLabel: "ออกจากหน้า",
      cancelLabel: "อยู่ต่อ",
      variant: "destructive",
    });

    if (shouldLeave) {
      window.location.href = "/dashboard/picture-reveal";
    }
  };

  const handleSettingsSave = settingsForm.handleSubmit(async (values) => {
    setSettingsSaving(true);
    setSettingsError(null);

    try {
      const response = await fetch(`/api/picture-reveal-games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          title: values.title?.trim(),
          description: values.description?.trim() ?? "",
        }),
      });
      const payload = await readJsonOrNull(response);

      if (!response.ok) {
        throw new Error(
          extractPictureRevealApiError(payload) ?? "บันทึก settings ไม่สำเร็จ",
        );
      }

      const updated = payload as PictureRevealGameDetails;
      setGame(updated);
      settingsForm.reset({
        title: updated.title,
        description: updated.description ?? "",
        status: updated.status,
        mode: updated.mode,
        startScore: updated.startScore,
        openTilePenalty: updated.openTilePenalty,
        specialTilePenalty: updated.specialTilePenalty,
      });
      toast.success("บันทึก settings สำเร็จ");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "บันทึก settings ไม่สำเร็จ";
      setSettingsError(message);
      toast.error(message);
    } finally {
      setSettingsSaving(false);
    }
  });

  const handleContentSave = async (values: SavePictureRevealGameContentInput) => {
    setContentSaving(true);
    setContentError(null);

    try {
      const response = await fetch(`/api/picture-reveal-games/${gameId}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await readJsonOrNull(response);

      if (!response.ok) {
        throw new Error(
          extractPictureRevealApiError(payload) ?? "บันทึก content ไม่สำเร็จ",
        );
      }

      const saved = payload as PictureRevealGameContentDto;
      setContent(saved);
      setContentDirty(false);
      toast.success("บันทึก content สำเร็จ");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "บันทึก content ไม่สำเร็จ";
      setContentError(message);
      toast.error(message);
    } finally {
      setContentSaving(false);
    }
  };

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.07),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.08),_transparent_28%)] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Card className="border-border/70 bg-background/90 shadow-sm">
          <CardContent className="space-y-5 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/dashboard/picture-reveal"
                onClick={(event) => void handleLeavePage(event)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <ArrowLeft className="size-4" />
                กลับไปหน้าเกมทั้งหมด
              </Link>
              <Button variant="outline" onClick={() => void loadEditorData(true)}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                รีเฟรชข้อมูล
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={game?.status === "published" ? "success" : "secondary"}>
                  {game?.status ?? "loading"}
                </Badge>
                <Badge variant="outline">{game?.mode ?? "-"}</Badge>
                <Badge variant="secondary">{content?.images.length ?? 0} รูป</Badge>
                {isEditorDirty ? (
                  <Badge variant="warning">มีการเปลี่ยนแปลงที่ยังไม่บันทึก</Badge>
                ) : null}
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {game?.title ?? "กำลังโหลดเกม..."}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                  แก้ไข settings, content และ session history ของเกมนี้จากหน้าเดียว
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <TabButton
                active={activeTab === "settings"}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </TabButton>
              <TabButton
                active={activeTab === "content"}
                onClick={() => setActiveTab("content")}
              >
                Content
              </TabButton>
              <TabButton
                active={activeTab === "history"}
                onClick={() => setActiveTab("history")}
              >
                History
              </TabButton>
            </div>
          </CardContent>
        </Card>

        {pageError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {pageError}
          </div>
        ) : null}

        {loading && !game ? (
          <div className="rounded-2xl border border-border bg-background/85 px-4 py-10 text-center text-sm text-muted-foreground">
            กำลังโหลด editor...
          </div>
        ) : null}

        {!loading && game && activeTab === "settings" ? (
          <Card className="border-border/70 bg-background/90 shadow-sm">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                ปรับรายละเอียดหลักของเกมและสถานะ draft/published
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSettingsSave}>
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="settings-title">ชื่อเกม</Label>
                    <Input id="settings-title" {...settingsForm.register("title")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-mode">โหมดเกม</Label>
                    <Controller
                      control={settingsForm.control}
                      name="mode"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="settings-mode">
                            <SelectValue placeholder="เลือกโหมดเกม" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="marathon">Marathon</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settings-description">คำอธิบาย</Label>
                  <Textarea
                    id="settings-description"
                    {...settingsForm.register("description")}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="settings-status">สถานะ</Label>
                    <Controller
                      control={settingsForm.control}
                      name="status"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="settings-status">
                            <SelectValue placeholder="เลือกสถานะ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-start-score">คะแนนเริ่มต้น</Label>
                    <Input
                      id="settings-start-score"
                      type="number"
                      {...settingsForm.register("startScore", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-open-penalty">หักต่อการเปิด</Label>
                    <Input
                      id="settings-open-penalty"
                      type="number"
                      {...settingsForm.register("openTilePenalty", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-special-penalty">หักเมื่อเจอพิเศษ</Label>
                    <Input
                      id="settings-special-penalty"
                      type="number"
                      {...settingsForm.register("specialTilePenalty", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>

                {settingsError ? (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {settingsError}
                  </div>
                ) : null}

                <div className="flex justify-end">
                  <Button type="submit" disabled={settingsSaving}>
                    {settingsSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    บันทึก settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {!loading && game && activeTab === "content" ? (
          <PictureRevealContentForm
            gameId={gameId}
            initialContent={content}
            saving={contentSaving}
            error={contentError}
            onSave={handleContentSave}
            onDirtyChange={setContentDirty}
          />
        ) : null}

        {!loading && game && activeTab === "history" ? (
          <Card className="border-border/70 bg-background/90 shadow-sm">
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>History</CardTitle>
                  <CardDescription>
                    ดู summary ของ session ที่ถูกเล่นในเกมนี้
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["all", "active", "completed"] as const).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={historyStatus === status ? "default" : "outline"}
                      onClick={() => setHistoryStatus(status)}
                    >
                      {status}
                    </Button>
                  ))}
                  {[10, 20, 50].map((limit) => (
                    <Button
                      key={limit}
                      size="sm"
                      variant={historyLimit === limit ? "default" : "outline"}
                      onClick={() => setHistoryLimit(limit)}
                    >
                      {limit}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
                  <p className="font-medium text-foreground">
                    ยังไม่มี session ในเงื่อนไขนี้
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    เมื่อผู้เล่นเริ่มเกม ประวัติ summary จะมาแสดงที่นี่
                  </p>
                </div>
              ) : (
                history.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-border bg-background/85 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={
                              session.status === "completed"
                                ? "success"
                                : "warning"
                            }
                          >
                            {session.status}
                          </Badge>
                          <Badge variant="outline">{session.mode}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          เริ่ม {formatDateTime(session.createdAt)} | จบ{" "}
                          {formatDateTime(session.completedAt)}
                        </p>
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                        <div>คะแนนล่าสุด: {session.currentScore}</div>
                        <div>คะแนนสุดท้าย: {session.finalScore ?? "-"}</div>
                        <div>รอบถูก: {session.correctRounds}</div>
                        <div>รอบผิด: {session.wrongRounds}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
