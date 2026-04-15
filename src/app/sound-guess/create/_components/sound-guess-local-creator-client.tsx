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
import { Textarea } from "@/components/ui/textarea";
import { SoundGuessContentForm } from "@/app/dashboard/sound-guess/[id]/edit/_components/sound-guess-content-form";
import {
  buildLocalSoundGuessDraftFromFormValues,
  buildPlayableSoundGuessFromLocalDraft,
  buildSoundGuessLocalContentFormValues,
  createDefaultLocalSoundGuessDraft,
  revokeLocalSoundGuessDraftUrls,
} from "@/lib/sound-guess-local";
import {
  clearCurrentDraft,
  loadCurrentDraft,
  saveAssetBlob,
  saveCurrentDraft,
} from "@/lib/sound-guess-local-store";
import type { SoundGuessContentFormState } from "@/lib/sound-guess-content-form";
import { cn } from "@/lib/utils";
import type { LocalSoundGuessDraft } from "@/types/sound-guess-local";

const HOME_URL = "https://mavelus-jk.com";

interface LocalSoundGuessSettingsValues {
  title: string;
  description: string;
}

/**
 * Builds local creator settings form values from a draft.
 *
 * @param draft - Local draft loaded from IndexedDB or created by default.
 * @returns Settings values used by react-hook-form.
 */
function buildSettingsValues(
  draft: LocalSoundGuessDraft,
): LocalSoundGuessSettingsValues {
  return {
    title: draft.title,
    description: draft.description,
  };
}

/**
 * Formats the autosave timestamp for the local creator status bar.
 *
 * @param value - ISO timestamp from the saved draft, or null before saving.
 * @returns Localized saved-at label for the current browser locale.
 */
function formatSavedAt(value: string | null) {
  if (!value) {
    return "Draft ready";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/**
 * Revokes preview URLs held by an editor snapshot.
 *
 * @param snapshot - Content snapshot whose blob URLs should be released.
 * @returns Nothing when there is no snapshot or after URLs are revoked.
 */
function revokeContentSnapshotUrls(snapshot: SoundGuessContentFormState | null) {
  if (!snapshot) {
    return;
  }

  if (snapshot.coverImagePath?.startsWith("blob:")) {
    URL.revokeObjectURL(snapshot.coverImagePath);
  }

  snapshot.sounds.forEach((sound) => {
    if (sound.audioPath?.startsWith("blob:")) {
      URL.revokeObjectURL(sound.audioPath);
    }

    if (sound.imagePath?.startsWith("blob:")) {
      URL.revokeObjectURL(sound.imagePath);
    }
  });
}

/**
 * Extracts a useful message from validation and browser storage failures.
 *
 * @param error - Unknown error thrown by draft validation, storage, or routing.
 * @returns Message safe to show in the local creator UI.
 */
function extractErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    const issue = error.issues[0];

    if (issue?.message) {
      return issue.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "Could not use the local sound guess draft.";
}

/**
 * Renders the browser-only local Sound Guess creator.
 *
 * @returns Local draft editor with autosave, reset, upload, and play actions.
 */
export function SoundGuessLocalCreatorClient() {
  const router = useRouter();
  const { confirm } = useConfirmDialog();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [contentInitialValues, setContentInitialValues] =
    useState<SoundGuessContentFormState | null>(null);
  const [contentSnapshot, setContentSnapshot] =
    useState<SoundGuessContentFormState | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [contentDirty, setContentDirty] = useState(false);
  const draftRef = useRef<LocalSoundGuessDraft | null>(null);
  const snapshotRef = useRef<SoundGuessContentFormState | null>(null);

  const settingsForm = useForm<LocalSoundGuessSettingsValues>({
    defaultValues: buildSettingsValues(createDefaultLocalSoundGuessDraft()),
  });
  const watchedTitle = useWatch({
    control: settingsForm.control,
    name: "title",
  });
  const watchedDescription = useWatch({
    control: settingsForm.control,
    name: "description",
  });
  const settingsSnapshot = useMemo<LocalSoundGuessSettingsValues>(
    () => ({
      title: watchedTitle ?? "",
      description: watchedDescription ?? "",
    }),
    [watchedDescription, watchedTitle],
  );

  const localUploadAdapter = useMemo(
    () => ({
      uploadCover: async (file: File) => {
        const asset = await saveAssetBlob(file);

        return {
          previewPath: asset.objectUrl ?? "",
          coverAssetId: asset.assetId,
        };
      },
      uploadAudio: async (file: File) => {
        const asset = await saveAssetBlob(file);

        return {
          previewPath: asset.objectUrl ?? "",
          audioAssetId: asset.assetId,
        };
      },
      uploadSoundImage: async (file: File) => {
        const asset = await saveAssetBlob(file);

        return {
          previewPath: asset.objectUrl ?? "",
          imageAssetId: asset.assetId,
        };
      },
    }),
    [],
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
        const nextDraft = storedDraft ?? createDefaultLocalSoundGuessDraft();

        if (cancelled) {
          revokeLocalSoundGuessDraftUrls(nextDraft);
          return;
        }

        draftRef.current = nextDraft;
        setLastSavedAt(nextDraft.updatedAt);
        settingsForm.reset(buildSettingsValues(nextDraft));

        const initialSnapshot = buildSoundGuessLocalContentFormValues(nextDraft);
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
      revokeContentSnapshotUrls(snapshotRef.current);
    };
  }, [settingsForm]);

  useEffect(() => {
    if (isLoading || !contentSnapshot) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      setIsAutosaving(true);
      setSaveError(null);

      try {
        const nextDraft = buildLocalSoundGuessDraftFromFormValues({
          existingDraft: draftRef.current,
          title: settingsSnapshot.title,
          description: settingsSnapshot.description,
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
      title: "Start over and clear this draft?",
      description:
        "This removes the local Sound Guess draft and every audio or image file saved in this browser.",
      confirmLabel: "Clear draft",
      cancelLabel: "Keep editing",
      variant: "destructive",
    });

    if (!shouldReset) {
      return;
    }

    revokeContentSnapshotUrls(snapshotRef.current);
    await clearCurrentDraft();

    const nextDraft = createDefaultLocalSoundGuessDraft();
    draftRef.current = nextDraft;
    settingsForm.reset(buildSettingsValues(nextDraft));

    const initialSnapshot = buildSoundGuessLocalContentFormValues(nextDraft);
    setContentInitialValues(initialSnapshot);
    setContentSnapshot(initialSnapshot);
    setLastSavedAt(nextDraft.updatedAt);
    setSaveError(null);
    setEditorKey((value) => value + 1);
    toast.success("Started a fresh local Sound Guess draft.");
  };

  const handlePlay = async () => {
    if (!contentSnapshot) {
      return;
    }

    try {
      const nextDraft = buildLocalSoundGuessDraftFromFormValues({
        existingDraft: draftRef.current,
        title: settingsSnapshot.title,
        description: settingsSnapshot.description,
        content: contentSnapshot,
      });

      buildPlayableSoundGuessFromLocalDraft(nextDraft);
      await saveCurrentDraft(nextDraft);
      draftRef.current = nextDraft;
      setLastSavedAt(nextDraft.updatedAt);
      router.push("/sound-guess/create/play");
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
          Loading your local Sound Guess draft...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
        <CardHeader>
          <CardTitle>Local draft is not available</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link
            href="/sound-guess"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <ArrowLeft className="size-4" />
            Back to Sound Guess
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
              <Badge variant="warning">Sound Guess Creator</Badge>
              <Badge variant="secondary">Saved in this browser</Badge>
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
                href="/sound-guess"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                <ArrowLeft className="size-4" />
                Public games
              </Link>
              <ThemeToggle />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Create your own Sound Guess
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
              Upload audio, crop the playable segment, add answers, and run the
              game from this browser without signing in or uploading anything to
              the server.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Local draft
              </p>
              <p className="text-sm text-muted-foreground">
                {isAutosaving
                  ? "Autosaving..."
                  : `Last saved: ${formatSavedAt(lastSavedAt)}`}
              </p>
              {saveError ? (
                <p className="mt-1 text-sm text-destructive">{saveError}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleStartOver()}
              >
                <RotateCcw className="size-4" />
                Start over
              </Button>
              <Button type="button" onClick={() => void handlePlay()}>
                <Play className="size-4" />
                Play this game
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/92 shadow-sm">
        <CardHeader>
          <CardTitle>Game settings</CardTitle>
          <CardDescription>
            These details are saved only in this browser and appear on the local
            play page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="local-sound-guess-title">Game title</Label>
                <Input
                  id="local-sound-guess-title"
                  {...settingsForm.register("title")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="local-sound-guess-description">
                  Description
                </Label>
                <Textarea
                  id="local-sound-guess-description"
                  {...settingsForm.register("description")}
                />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <SoundGuessContentForm
        key={editorKey}
        gameId="local-sound-guess"
        initialValues={contentInitialValues}
        saving={isAutosaving}
        error={saveError}
        onDirtyChange={setContentDirty}
        onSnapshotChange={setContentSnapshot}
        uploadAdapter={localUploadAdapter}
      />

      {contentDirty ? (
        <p className="text-sm text-muted-foreground">
          Changes are autosaved in this browser.
        </p>
      ) : null}
    </div>
  );
}
