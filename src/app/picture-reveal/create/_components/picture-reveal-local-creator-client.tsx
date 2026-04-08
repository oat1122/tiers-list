"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ArrowLeft, Home as HomeIcon, Loader2, Play, RotateCcw } from "lucide-react";
import { z } from "zod";
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
  buildLocalPictureRevealDraftFromFormValues,
  buildPictureRevealLocalContentFormValues,
  buildPlayablePictureRevealFromLocalDraft,
  createDefaultLocalPictureRevealDraft,
} from "@/lib/picture-reveal-local";
import {
  clearCurrentDraft,
  loadCurrentDraft,
  readAssetBlob,
  saveAssetBlob,
  saveCurrentDraft,
} from "@/lib/picture-reveal-local-store";
import { cn } from "@/lib/utils";
import type { PictureRevealContentFormState } from "@/lib/picture-reveal-content-form";
import type { LocalPictureRevealDraft } from "@/types/picture-reveal-local";
import { PictureRevealContentForm } from "@/app/dashboard/picture-reveal/[id]/edit/_components/picture-reveal-content-form";

const HOME_URL = "https://mavelus-jk.com";

export const LocalPictureRevealSettingsSchema = z.object({
  title: z.string().default(""),
  description: z.string().default(""),
  mode: z.enum(["single", "marathon"]),
  startScore: z.coerce.number().int().min(1).default(1000),
  openTilePenalty: z.coerce.number().int().min(0).default(50),
  specialTilePenalty: z.coerce.number().int().min(0).default(200),
});

type LocalPictureRevealSettingsValues = z.infer<
  typeof LocalPictureRevealSettingsSchema
>;

function buildSettingsValues(draft: LocalPictureRevealDraft): LocalPictureRevealSettingsValues {
  return {
    title: draft.title,
    description: draft.description,
    mode: draft.mode,
    startScore: draft.startScore,
    openTilePenalty: draft.openTilePenalty,
    specialTilePenalty: draft.specialTilePenalty,
  };
}

function formatSavedAt(value: string | null) {
  if (!value) {
    return "แบบร่างพร้อมใช้งาน";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function revokeSnapshotUrls(snapshot: PictureRevealContentFormState | null) {
  if (!snapshot) {
    return;
  }

  if (snapshot.coverImagePath?.startsWith("blob:")) {
    URL.revokeObjectURL(snapshot.coverImagePath);
  }

  snapshot.images.forEach((image) => {
    if (image.imagePath?.startsWith("blob:")) {
      URL.revokeObjectURL(image.imagePath);
    }

    if (image.originalImagePath?.startsWith("blob:")) {
      URL.revokeObjectURL(image.originalImagePath);
    }
  });
}

function extractErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    const issue = error.issues[0];

    if (issue?.message) {
      return issue.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "Could not use the local picture reveal draft.";
}

export function PictureRevealLocalCreatorClient() {
  const router = useRouter();
  const { confirm } = useConfirmDialog();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [contentInitialValues, setContentInitialValues] =
    useState<PictureRevealContentFormState | null>(null);
  const [contentSnapshot, setContentSnapshot] =
    useState<PictureRevealContentFormState | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [contentDirty, setContentDirty] = useState(false);
  const draftRef = useRef<LocalPictureRevealDraft | null>(null);
  const snapshotRef = useRef<PictureRevealContentFormState | null>(null);

  const settingsForm = useForm<LocalPictureRevealSettingsValues>({
    defaultValues: buildSettingsValues(createDefaultLocalPictureRevealDraft()),
  });
  const watchedTitle = useWatch({
    control: settingsForm.control,
    name: "title",
  });
  const watchedDescription = useWatch({
    control: settingsForm.control,
    name: "description",
  });
  const watchedMode = useWatch({
    control: settingsForm.control,
    name: "mode",
  });
  const watchedStartScore = useWatch({
    control: settingsForm.control,
    name: "startScore",
  });
  const watchedOpenTilePenalty = useWatch({
    control: settingsForm.control,
    name: "openTilePenalty",
  });
  const watchedSpecialTilePenalty = useWatch({
    control: settingsForm.control,
    name: "specialTilePenalty",
  });
  const settingsSnapshot = useMemo<LocalPictureRevealSettingsValues>(
    () => ({
      title: watchedTitle ?? "",
      description: watchedDescription ?? "",
      mode: watchedMode ?? "single",
      startScore: Number(watchedStartScore) || 1000,
      openTilePenalty: Number(watchedOpenTilePenalty) || 0,
      specialTilePenalty: Number(watchedSpecialTilePenalty) || 0,
    }),
    [
      watchedDescription,
      watchedMode,
      watchedOpenTilePenalty,
      watchedSpecialTilePenalty,
      watchedStartScore,
      watchedTitle,
    ],
  );

  useEffect(() => {
    snapshotRef.current = contentSnapshot;
  }, [contentSnapshot]);

  useEffect(() => {
    let cancelled = false;

    const loadDraft = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const storedDraft = await loadCurrentDraft();
        const nextDraft = storedDraft ?? createDefaultLocalPictureRevealDraft();

        if (cancelled) {
          revokeSnapshotUrls(buildPictureRevealLocalContentFormValues(nextDraft));
          return;
        }

        draftRef.current = nextDraft;
        setLastSavedAt(nextDraft.updatedAt);
        settingsForm.reset(buildSettingsValues(nextDraft));

        const initialSnapshot = buildPictureRevealLocalContentFormValues(nextDraft);
        setContentInitialValues(initialSnapshot);
        setContentSnapshot(initialSnapshot);
        setEditorKey((value) => value + 1);
      } catch (error) {
        if (!cancelled) {
          setLoadError(extractErrorMessage(error));
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
      revokeSnapshotUrls(snapshotRef.current);
    };
  }, [settingsForm]);

  const localUploadAdapter = useMemo(
    () => ({
      uploadCover: async (file: File) => {
        const asset = await saveAssetBlob(file);

        return {
          previewPath: asset.objectUrl ?? "",
          coverAssetId: asset.assetId,
        };
      },
      uploadImage: async ({
        file,
        originalFile,
      }: {
        index: number;
        file: File;
        originalFile?: File | null;
      }) => {
        const imageAsset = await saveAssetBlob(file);
        const originalAsset = originalFile
          ? await saveAssetBlob(originalFile)
          : imageAsset;

        return {
          previewPath: imageAsset.objectUrl ?? "",
          originalPreviewPath:
            originalAsset.objectUrl ?? imageAsset.objectUrl ?? "",
          imageAssetId: imageAsset.assetId,
          originalImageAssetId: originalAsset.assetId,
        };
      },
      loadImageSourceFile: async ({
        image,
      }: {
        index: number;
        image: PictureRevealContentFormState["images"][number];
      }) => {
        const assetId = image.originalImageAssetId ?? image.imageAssetId;

        return assetId ? readAssetBlob(assetId) : null;
      },
    }),
    [],
  );

  useEffect(() => {
    if (isLoading || !contentSnapshot) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      setIsAutosaving(true);
      setSaveError(null);

      try {
        const nextDraft = buildLocalPictureRevealDraftFromFormValues({
          existingDraft: draftRef.current,
          title: settingsSnapshot.title,
          description: settingsSnapshot.description,
          mode: settingsSnapshot.mode,
          startScore: settingsSnapshot.startScore,
          openTilePenalty: settingsSnapshot.openTilePenalty,
          specialTilePenalty: settingsSnapshot.specialTilePenalty,
          content: contentSnapshot,
        });

        await saveCurrentDraft(nextDraft);
        draftRef.current = nextDraft;
        setLastSavedAt(nextDraft.updatedAt);
      } catch (error) {
        setSaveError(extractErrorMessage(error));
      } finally {
        setIsAutosaving(false);
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [contentSnapshot, isLoading, settingsSnapshot]);

  const handleStartOver = async () => {
    const shouldReset = await confirm({
      title: "เริ่มใหม่ทั้งหมดหรือไม่?",
      description:
        "การกระทำนี้จะลบแบบร่างเกมทายภาพและรูปภาพทั้งหมดที่คุณอัปโหลดไว้ในเบราว์เซอร์นี้ทิ้งถาวร",
      confirmLabel: "ลบแบบร่างและเริ่มใหม่",
      cancelLabel: "แก้ไขต่อ",
      variant: "destructive",
    });

    if (!shouldReset) {
      return;
    }

    revokeSnapshotUrls(snapshotRef.current);
    await clearCurrentDraft();

    const nextDraft = createDefaultLocalPictureRevealDraft();
    draftRef.current = nextDraft;
    settingsForm.reset(buildSettingsValues(nextDraft));

    const initialSnapshot = buildPictureRevealLocalContentFormValues(nextDraft);
    setContentInitialValues(initialSnapshot);
    setContentSnapshot(initialSnapshot);
    setLastSavedAt(nextDraft.updatedAt);
    setSaveError(null);
    setEditorKey((value) => value + 1);
    toast.success("เริ่มสร้างแบบร่างเกมทายภาพใหม่เรียบร้อยแล้ว");
  };

  const handlePlay = async () => {
    if (!contentSnapshot) {
      return;
    }

    try {
      const nextDraft = buildLocalPictureRevealDraftFromFormValues({
        existingDraft: draftRef.current,
        title: settingsSnapshot.title,
        description: settingsSnapshot.description,
        mode: settingsSnapshot.mode,
        startScore: settingsSnapshot.startScore,
        openTilePenalty: settingsSnapshot.openTilePenalty,
        specialTilePenalty: settingsSnapshot.specialTilePenalty,
        content: contentSnapshot,
      });

      buildPlayablePictureRevealFromLocalDraft(nextDraft);
      await saveCurrentDraft(nextDraft);
      draftRef.current = nextDraft;
      setLastSavedAt(nextDraft.updatedAt);
      router.push("/picture-reveal/create/play");
    } catch (error) {
      const message = extractErrorMessage(error);
      setSaveError(message);
      toast.error(message);
    }
  };

  if (isLoading || !contentInitialValues) {
    return (
      <div className="rounded-[2rem] border border-border/70 bg-background/90 px-6 py-16 text-center shadow-sm">
        <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          กำลังโหลดแบบร่างเกมทายภาพของคุณ...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
        <CardHeader>
          <CardTitle>ไม่พบแบบร่างในเบราว์เซอร์</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link
            href="/picture-reveal"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <ArrowLeft className="size-4" />
            กลับหน้าเกมทายภาพ
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-background/92 shadow-sm">
        <CardContent className="space-y-6 px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">เครื่องมือสร้างเกมทายภาพ</Badge>
              <Badge variant="secondary">บันทึกเฉพาะในเบราว์เซอร์</Badge>
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
                href="/picture-reveal"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                <ArrowLeft className="size-4" />
                เกมสาธารณะ
              </Link>
              <ThemeToggle />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              สร้างเกมทายภาพของคุณเอง
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
              สร้างเกมทายภาพ (Picture Reveal) สำหรับนำไปใช้จัดกิจกรรม ข้อมูลแบบร่างและรูปภาพทั้งหมดที่คุณอัปโหลดจะถูกบันทึกไว้ในเบราว์เซอร์ของอุปกรณ์นี้เท่านั้น ไม่มีการส่งข้อมูลใด ๆ ไปยังเซิร์ฟเวอร์
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">สถานะแบบร่าง (Local Draft)</p>
              <p className="text-sm text-muted-foreground">
                {isAutosaving
                  ? "กำลังบันทึกอัตโนมัติ..."
                  : `บันทึกล่าสุดเมื่อ: ${formatSavedAt(lastSavedAt)}`}
              </p>
              {saveError ? (
                <p className="mt-1 text-sm text-destructive">{saveError}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void handleStartOver()}>
                <RotateCcw className="size-4" />
                เริ่มใหม่ทั้งหมด
              </Button>
              <Button type="button" onClick={() => void handlePlay()}>
                <Play className="size-4" />
                เริ่มเล่นเกมนี้
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/92 shadow-sm">
        <CardHeader>
          <CardTitle>การตั้งค่าเกม</CardTitle>
          <CardDescription>
            ค่าเหล่านี้จะถูกบันทึกไว้ในเบราว์เซอร์ขณะที่คุณแก้ไข และจะถูกนำไปใช้ในหน้าเล่นเกมสำหรับผู้จัดกิจกรรมทันที
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="local-picture-reveal-title">ชื่อเกม</Label>
                <Input
                  id="local-picture-reveal-title"
                  {...settingsForm.register("title")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="local-picture-reveal-mode">โหมดการเล่น</Label>
                  <Select
                  value={settingsSnapshot.mode}
                  onValueChange={(value) =>
                    settingsForm.setValue("mode", value as "single" | "marathon", {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="local-picture-reveal-mode">
                    <SelectValue placeholder="เลือกโหมดการเล่น" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">แบบข้อเดียว (Single)</SelectItem>
                    <SelectItem value="marathon">แบบต่อเนื่อง (Marathon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="local-picture-reveal-description">คำอธิบายเกม</Label>
              <Textarea
                id="local-picture-reveal-description"
                {...settingsForm.register("description")}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="local-start-score">คะแนนเริ่มต้น (เต็ม)</Label>
                <Input
                  id="local-start-score"
                  type="number"
                  {...settingsForm.register("startScore", {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="local-open-tile-penalty">คะแนนที่ลดลงเมื่อเปิด 1 ป้าย</Label>
                <Input
                  id="local-open-tile-penalty"
                  type="number"
                  {...settingsForm.register("openTilePenalty", {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="local-special-tile-penalty">
                  คะแนนที่ลดลงสำหรับป้ายพิเศษ
                </Label>
                <Input
                  id="local-special-tile-penalty"
                  type="number"
                  {...settingsForm.register("specialTilePenalty", {
                    valueAsNumber: true,
                  })}
                />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <PictureRevealContentForm
        key={editorKey}
        initialValues={contentInitialValues}
        saving={isAutosaving}
        error={saveError}
        onDirtyChange={setContentDirty}
        onSnapshotChange={setContentSnapshot}
        uploadAdapter={localUploadAdapter}
      />

      {contentDirty ? (
        <p className="text-sm text-muted-foreground">
          การแก้ไขของคุณจะถูกบันทึกไว้ในเบราว์เซอร์นี้โดยอัตโนมัติ
        </p>
      ) : null}
    </div>
  );
}
