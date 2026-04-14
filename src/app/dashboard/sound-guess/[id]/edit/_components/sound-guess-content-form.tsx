"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  buildSoundGuessContentFormSnapshot,
  createEmptySoundGuessSoundDraft,
  type SoundGuessContentFormState,
} from "@/lib/sound-guess-content-form";
import { SaveSoundGuessGameContentSchema } from "@/lib/validations";
import type { SaveSoundGuessGameContentInput } from "@/lib/validations";
import type { SoundGuessGameContentDto } from "@/types/sound-guess-admin";
import {
  buildSoundGuessContentDefaults,
  formatSoundGuessAspectRatio,
  normalizeSoundGuessContentForSubmit,
  soundGuessImageRatioPresets,
} from "@/app/dashboard/sound-guess/_components/sound-guess-admin.utils";
import {
  SOUND_GUESS_DEFAULT_COVER_HEIGHT,
  SOUND_GUESS_DEFAULT_COVER_WIDTH,
} from "./sound-guess-content-form.constants";
import { SoundGuessCoverCard } from "./sound-guess-cover-card";
import { SoundGuessRatioSettings } from "./sound-guess-ratio-settings";
import { SoundGuessSoundCard } from "./sound-guess-sound-card";

export interface SoundGuessContentFormProps {
  gameId: string;
  initialValues: SoundGuessContentFormState;
  saving?: boolean;
  error?: string | null;
  onSave?: (values: SaveSoundGuessGameContentInput) => Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
  submitLabel?: string;
}

/**
 * Renders the sound guess content editor for cover, audio, and answer content.
 *
 * @param props - Initial form values, save callbacks, and status flags.
 * @returns Content form for a remote sound guess game.
 */
export function SoundGuessContentForm({
  gameId,
  initialValues,
  saving = false,
  error = null,
  onSave,
  onDirtyChange,
  submitLabel = "บันทึกข้อมูล",
}: SoundGuessContentFormProps) {
  const normalizedInitialValues = useMemo(
    () => buildSoundGuessContentFormSnapshot(initialValues),
    [initialValues],
  );
  const initialValuesSignature = useMemo(
    () => JSON.stringify(normalizedInitialValues),
    [normalizedInitialValues],
  );
  const latestInitialValuesRef = useRef(normalizedInitialValues);
  const [ratioEditingEnabled, setRatioEditingEnabled] = useState(false);
  const form = useForm<SoundGuessContentFormState>({
    resolver: zodResolver(
      SaveSoundGuessGameContentSchema,
    ) as Resolver<SoundGuessContentFormState>,
    defaultValues: normalizedInitialValues,
  });
  const soundsFieldArray = useFieldArray({
    control: form.control,
    name: "sounds",
    keyName: "fieldKey",
  });
  const watchedSounds = useWatch({
    control: form.control,
    name: "sounds",
  });
  const watchedImageWidth =
    useWatch({ control: form.control, name: "imageWidth" }) ??
    SOUND_GUESS_DEFAULT_COVER_WIDTH;
  const watchedImageHeight =
    useWatch({ control: form.control, name: "imageHeight" }) ??
    SOUND_GUESS_DEFAULT_COVER_HEIGHT;
  const parsedImageWidth =
    Number(watchedImageWidth) || SOUND_GUESS_DEFAULT_COVER_WIDTH;
  const parsedImageHeight =
    Number(watchedImageHeight) || SOUND_GUESS_DEFAULT_COVER_HEIGHT;

  useEffect(() => {
    latestInitialValuesRef.current = normalizedInitialValues;
  }, [normalizedInitialValues]);

  useEffect(() => {
    form.reset(latestInitialValuesRef.current);
  }, [form, initialValuesSignature]);

  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);

  const imageWidthError = form.formState.errors.imageWidth?.message;
  const imageHeightError = form.formState.errors.imageHeight?.message;
  const aspectRatioLabel = formatSoundGuessAspectRatio(
    parsedImageWidth,
    parsedImageHeight,
  );
  const activeRatio = soundGuessImageRatioPresets.find(
    (preset) =>
      formatSoundGuessAspectRatio(preset.width, preset.height) ===
      aspectRatioLabel,
  )?.key;

  const clearCoverAfterSizeChange = () => {
    const currentCoverImagePath = form.getValues("coverImagePath");
    const currentCoverTempUploadPath = form.getValues("coverTempUploadPath");

    if (!currentCoverImagePath && !currentCoverTempUploadPath) {
      return;
    }

    form.setValue("coverImagePath", null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("coverTempUploadPath", null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    toast.warning(
      "เปลี่ยนขนาดรูปหน้าปกแล้ว กรุณาอัปโหลดรูปหน้าปกใหม่ให้ตรงกับขนาดล่าสุด",
    );
  };

  const updateImageSize = (nextWidth: number, nextHeight: number) => {
    form.setValue("imageWidth", nextWidth, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("imageHeight", nextHeight, {
      shouldDirty: true,
      shouldValidate: true,
    });
    clearCoverAfterSizeChange();
  };

  const applyRatioPreset = (preset: {
    label: string;
    width: number;
    height: number;
  }) => {
    if (!ratioEditingEnabled) {
      return;
    }

    updateImageSize(preset.width, preset.height);
    toast.success(`Applied ${preset.label} (${preset.width}x${preset.height}).`);
  };

  const imageWidthField = form.register("imageWidth", {
    valueAsNumber: true,
    onChange: clearCoverAfterSizeChange,
  });
  const imageHeightField = form.register("imageHeight", {
    valueAsNumber: true,
    onChange: clearCoverAfterSizeChange,
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        if (!onSave) {
          return;
        }

        await onSave(normalizeSoundGuessContentForSubmit(values));
      })}
    >
      <div className="space-y-4 rounded-2xl border border-border bg-background/85 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">เนื้อหา/เสียง</h2>
            <p className="text-sm text-muted-foreground">
              ตั้งค่ารูปหน้าปก อัปโหลดเสียง และใส่คำตอบของแต่ละรอบ
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              aria-label="Add sound"
              variant="outline"
              onClick={() =>
                soundsFieldArray.append(
                  createEmptySoundGuessSoundDraft(
                    soundsFieldArray.fields.length,
                  ),
                )
              }
            >
              <Plus className="size-4" />
              เพิ่มเสียง
            </Button>
            {onSave ? (
              <Button type="submit" aria-label="Save sound content" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {submitLabel}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <SoundGuessCoverCard
            gameId={gameId}
            control={form.control}
            setValue={form.setValue}
            targetWidth={parsedImageWidth}
            targetHeight={parsedImageHeight}
          />

          <SoundGuessRatioSettings
            activeRatio={activeRatio}
            applyRatioPreset={applyRatioPreset}
            imageHeightError={imageHeightError}
            imageHeightField={imageHeightField}
            imageWidthError={imageWidthError}
            imageWidthField={imageWidthField}
            parsedImageHeight={parsedImageHeight}
            parsedImageWidth={parsedImageWidth}
            presets={soundGuessImageRatioPresets}
            ratioEditingEnabled={ratioEditingEnabled}
            setRatioEditingEnabled={setRatioEditingEnabled}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {form.formState.errors.sounds?.message ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {form.formState.errors.sounds.message}
        </div>
      ) : null}

      {soundsFieldArray.fields.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
          <p className="font-medium text-foreground">ยังไม่มีเสียง</p>
          <p className="mt-1 text-sm text-muted-foreground">
            กรุณาเพิ่มเสียงอย่างน้อย 1 รายการ ก่อนนำไปเล่นจริงหรือเผยแพร่
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {soundsFieldArray.fields.map((field, index) => (
          <SoundGuessSoundCard
            key={field.fieldKey}
            gameId={gameId}
            index={index}
            total={soundsFieldArray.fields.length}
            control={form.control}
            register={form.register}
            setValue={form.setValue}
            removeSound={() => soundsFieldArray.remove(index)}
            moveUp={() => index > 0 && soundsFieldArray.move(index, index - 1)}
            moveDown={() =>
              index < soundsFieldArray.fields.length - 1 &&
              soundsFieldArray.move(index, index + 1)
            }
            appendNextSound={() =>
              soundsFieldArray.append(
                createEmptySoundGuessSoundDraft(
                  (watchedSounds ?? []).length,
                ),
              )
            }
          />
        ))}
      </div>
    </form>
  );
}

/**
 * Builds initial form values for the remote admin content editor.
 *
 * @param initialContent - Content loaded from the admin API, or null for defaults.
 * @returns Normalized content form state for react-hook-form.
 */
export function buildSoundGuessRemoteContentInitialValues(
  initialContent?: SoundGuessGameContentDto | null,
) {
  return buildSoundGuessContentDefaults(initialContent);
}
