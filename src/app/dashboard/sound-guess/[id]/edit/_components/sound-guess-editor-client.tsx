"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  SaveSoundGuessGameContentSchema,
  UpdateSoundGuessGameSchema,
  type SaveSoundGuessGameContentInput,
  type UpdateSoundGuessGameInput,
} from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { SoundGuessGameContentDto } from "@/types/sound-guess-admin";
import {
  buildSoundGuessSettingsPayload,
  extractSoundGuessApiError,
  readSoundGuessJsonOrNull,
} from "@/app/dashboard/sound-guess/_components/sound-guess-admin.utils";
import {
  SoundGuessContentForm,
  buildSoundGuessRemoteContentInitialValues,
} from "./sound-guess-content-form";

type TabKey = "settings" | "content";
type SoundGuessGameDetails = Omit<SoundGuessGameContentDto, "sounds">;
type SettingsFormInput = z.input<typeof UpdateSoundGuessGameSchema>;
type SettingsFormValues = UpdateSoundGuessGameInput;

/**
 * Loads one sound guess game for the settings tab.
 *
 * @param gameId - Game id being edited.
 * @returns Admin game details returned by the API.
 * @throws Error when the API rejects the request.
 */
async function fetchGame(gameId: string) {
  const response = await fetch(`/api/sound-guess-games/${gameId}`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await readSoundGuessJsonOrNull(response);

  if (!response.ok) {
    throw new Error(
      extractSoundGuessApiError(payload) ?? "Could not load game details",
    );
  }

  return payload as SoundGuessGameDetails;
}

/**
 * Loads editable sound guess content for the content tab.
 *
 * @param gameId - Game id being edited.
 * @returns Game content returned by the API.
 * @throws Error when the API rejects the request.
 */
async function fetchContent(gameId: string) {
  const response = await fetch(`/api/sound-guess-games/${gameId}/content`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await readSoundGuessJsonOrNull(response);

  if (!response.ok) {
    throw new Error(
      extractSoundGuessApiError(payload) ?? "Could not load game content",
    );
  }

  return payload as SoundGuessGameContentDto;
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

export function SoundGuessEditorClient({ gameId }: { gameId: string }) {
  const { confirm } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<TabKey>("settings");
  const [game, setGame] = useState<SoundGuessGameDetails | null>(null);
  const [content, setContent] = useState<SoundGuessGameContentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [contentDirty, setContentDirty] = useState(false);
  const contentInitialValues = useMemo(
    () => buildSoundGuessRemoteContentInitialValues(content),
    [content],
  );

  const settingsForm = useForm<SettingsFormInput, unknown, SettingsFormValues>({
    resolver: zodResolver(UpdateSoundGuessGameSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
    },
  });

  const isEditorDirty = settingsForm.formState.isDirty || contentDirty;

  const loadEditorData = async (showToast = false) => {
    setLoading(true);
    setPageError(null);

    try {
      const [nextGame, nextContent] = await Promise.all([
        fetchGame(gameId),
        fetchContent(gameId),
      ]);

      setGame(nextGame);
      setContent(nextContent);
      setContentDirty(false);
      settingsForm.reset({
        title: nextGame.title,
        description: nextGame.description ?? "",
        status: nextGame.status,
      });

      if (showToast) {
        toast.success("รีเฟรชข้อมูลสำเร็จ");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลเกมได้";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const handleLeavePage = async (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    if (!isEditorDirty) {
      return;
    }

    event.preventDefault();

    const shouldLeave = await confirm({
      title: "ออกโดยไม่บันทึกหรือไม่?",
      description:
        "มีการแก้ไขการตั้งค่าหรือเนื้อหาเสียงที่ยังไม่ได้บันทึก",
      confirmLabel: "ออกจากหน้านี้",
      cancelLabel: "อยู่หน้าเดิม",
      variant: "destructive",
    });

    if (shouldLeave) {
      window.location.href = "/dashboard/sound-guess";
    }
  };

  const handleSettingsSave = settingsForm.handleSubmit(async (values) => {
    setSettingsSaving(true);
    setSettingsError(null);

    try {
      const response = await fetch(`/api/sound-guess-games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSoundGuessSettingsPayload(values)),
      });
      const payload = await readSoundGuessJsonOrNull(response);

      if (!response.ok) {
        throw new Error(
          extractSoundGuessApiError(payload) ??
            "บันทึกการตั้งค่าไม่สำเร็จ",
        );
      }

      const updated = payload as SoundGuessGameDetails;
      setGame(updated);
      settingsForm.reset({
        title: updated.title,
        description: updated.description ?? "",
        status: updated.status,
      });
      toast.success("บันทึกการตั้งค่าแล้ว");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "บันทึกการตั้งค่าไม่สำเร็จ";
      setSettingsError(message);
      toast.error(message);
    } finally {
      setSettingsSaving(false);
    }
  });

  const handleContentSave = async (values: SaveSoundGuessGameContentInput) => {
    setContentSaving(true);
    setContentError(null);

    try {
      const response = await fetch(`/api/sound-guess-games/${gameId}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(SaveSoundGuessGameContentSchema.parse(values)),
      });
      const payload = await readSoundGuessJsonOrNull(response);

      if (!response.ok) {
        throw new Error(
          extractSoundGuessApiError(payload) ?? "บันทึกข้อมูลเสียงไม่สำเร็จ",
        );
      }

      const saved = payload as SoundGuessGameContentDto;
      setContent(saved);
      setContentDirty(false);
      toast.success("บันทึกข้อมูลเสียงสำเร็จ");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "บันทึกข้อมูลเสียงไม่สำเร็จ";
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
                href="/dashboard/sound-guess"
                onClick={(event) => void handleLeavePage(event)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                <ArrowLeft className="size-4" />
                กลับหน้ารวมเกม
              </Link>
              <Button
                variant="outline"
                onClick={() => void loadEditorData(true)}
              >
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
                <Badge
                  variant={
                    game?.status === "published" ? "success" : "secondary"
                  }
                >
                  {game?.status ?? "loading"}
                </Badge>
                <Badge variant="outline">Sound Guess</Badge>
                <Badge variant="secondary">
                  {content?.sounds.length ?? 0} sounds
                </Badge>
                {isEditorDirty ? (
                  <Badge variant="warning">มีการแก้ไขที่ยังไม่ได้บันทึก</Badge>
                ) : null}
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {game?.title ?? "กำลังโหลดเกมทายเสียง..."}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                  จัดการการตั้งค่า ไฟล์เสียง และคำตอบของเกมทายเสียง
                  โดยใช้รูปแบบ editor เดียวกับ workspace เกมอื่น
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <TabButton
                active={activeTab === "settings"}
                onClick={() => setActiveTab("settings")}
              >
                การตั้งค่าเกม
              </TabButton>
              <TabButton
                active={activeTab === "content"}
                onClick={() => setActiveTab("content")}
              >
                เนื้อหา/เสียง
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
            กำลังโหลดข้อมูล...
          </div>
        ) : null}

        {!loading && game && activeTab === "settings" ? (
          <Card className="border-border/70 bg-background/90 shadow-sm">
            <CardHeader>
              <CardTitle>การตั้งค่าเกม</CardTitle>
              <CardDescription>
                ตั้งชื่อ คำอธิบาย และสถานะการเผยแพร่สำหรับเกมทายเสียงนี้
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSettingsSave}>
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="settings-title">ชื่อเกม</Label>
                    <Input
                      id="settings-title"
                      {...settingsForm.register("title")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-status">สถานะ</Label>
                    <Controller
                      control={settingsForm.control}
                      name="status"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="settings-status">
                            <SelectValue placeholder="เลือกสถานะ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">
                              แบบร่าง (Draft)
                            </SelectItem>
                            <SelectItem value="published">
                              เผยแพร่แล้ว (Published)
                            </SelectItem>
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
                    บันทึกการตั้งค่า
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {!loading && game && activeTab === "content" ? (
          <SoundGuessContentForm
            gameId={gameId}
            initialValues={contentInitialValues}
            saving={contentSaving}
            error={contentError}
            onSave={handleContentSave}
            onDirtyChange={setContentDirty}
          />
        ) : null}
      </div>
    </div>
  );
}
