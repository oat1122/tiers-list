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

const LocalPictureRevealSettingsSchema = z.object({
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
    return "Local draft ready";
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
      title: "Start over?",
      description:
        "This removes the current local picture reveal draft and all uploaded local images from this browser.",
      confirmLabel: "Reset local draft",
      cancelLabel: "Keep editing",
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
    toast.success("Started a fresh local picture reveal draft.");
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
          Loading your local picture reveal draft...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
        <CardHeader>
          <CardTitle>Local draft is unavailable</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link
            href="/picture-reveal"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <ArrowLeft className="size-4" />
            Back to Picture Reveal
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
              <Badge variant="warning">Picture Reveal Creator</Badge>
              <Badge variant="secondary">Local only</Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={HOME_URL}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <HomeIcon className="size-4" />
                Back to home
              </a>
              <Link
                href="/picture-reveal"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                <ArrowLeft className="size-4" />
                Public Games
              </Link>
              <ThemeToggle />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Create Your Own Picture Reveal
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
              Build a host-run picture reveal game in this browser only. Your
              draft and uploaded images stay on this device, and nothing is sent
              to the database.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Local Draft</p>
              <p className="text-sm text-muted-foreground">
                {isAutosaving
                  ? "Autosaving locally..."
                  : `Last local save ${formatSavedAt(lastSavedAt)}`}
              </p>
              {saveError ? (
                <p className="mt-1 text-sm text-destructive">{saveError}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void handleStartOver()}>
                <RotateCcw className="size-4" />
                Start Over
              </Button>
              <Button type="button" onClick={() => void handlePlay()}>
                <Play className="size-4" />
                Play This Game
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/92 shadow-sm">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            These values are saved locally while you edit and used directly by
            the host-run play screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="local-picture-reveal-title">Game Title</Label>
                <Input
                  id="local-picture-reveal-title"
                  {...settingsForm.register("title")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="local-picture-reveal-mode">Mode</Label>
                  <Select
                  value={settingsSnapshot.mode}
                  onValueChange={(value) =>
                    settingsForm.setValue("mode", value as "single" | "marathon", {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="local-picture-reveal-mode">
                    <SelectValue placeholder="Select a mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="marathon">Marathon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="local-picture-reveal-description">Description</Label>
              <Textarea
                id="local-picture-reveal-description"
                {...settingsForm.register("description")}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="local-start-score">Start Score</Label>
                <Input
                  id="local-start-score"
                  type="number"
                  {...settingsForm.register("startScore", {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="local-open-tile-penalty">Open Tile Penalty</Label>
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
                  Special Tile Penalty
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
          Changes are stored locally in this browser only.
        </p>
      ) : null}
    </div>
  );
}
