"use client";

import Image from "next/image";
import {
  ImagePlus,
  Loader2,
  MoveDown,
  MoveUp,
  Music2,
  Plus,
  Scissors,
  Trash2,
  Upload,
} from "lucide-react";
import { memo, useState } from "react";
import {
  useFormState,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { toast } from "sonner";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CROPPABLE_IMAGE_MIME } from "@/lib/image-upload-config";
import { isCroppableImageType } from "@/lib/image-processing";
import type { SoundGuessContentFormState } from "@/lib/sound-guess-content-form";
import { AUDIO_ACCEPTED_MIME, SOUND_GUESS_SOUND_IMAGE_SIZE } from "./sound-guess-content-form.constants";
import { formatAudioRangeLabel } from "./sound-guess-audio-utils";
import {
  getFieldError,
  getUnsupportedImageTypeMessage,
} from "./sound-guess-content-form.utils";
import { uploadRemoteAudio, uploadRemoteSoundImage } from "./sound-guess-upload-api";
import { SoundAudioCropDialog } from "./sound-audio-crop-dialog";
import { SoundAudioSegmentPreview } from "./sound-audio-segment-preview";

/**
 * Renders one editable sound item with upload, preview, and answer inputs.
 *
 * @param props - Sound index, form bindings, ordering actions, and game id.
 * @returns Editor card for one sound guess item.
 */
export const SoundGuessSoundCard = memo(function SoundGuessSoundCard({
  gameId,
  index,
  total,
  control,
  register,
  setValue,
  removeSound,
  moveUp,
  moveDown,
  appendNextSound,
}: {
  gameId: string;
  index: number;
  total: number;
  control: Control<SoundGuessContentFormState>;
  register: UseFormRegister<SoundGuessContentFormState>;
  setValue: UseFormSetValue<SoundGuessContentFormState>;
  removeSound: () => void;
  moveUp: () => void;
  moveDown: () => void;
  appendNextSound: () => void;
}) {
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [pendingImageCropFile, setPendingImageCropFile] =
    useState<File | null>(null);
  const [audioCropOpen, setAudioCropOpen] = useState(false);
  const sound = useWatch({ control, name: `sounds.${index}` });
  const { errors } = useFormState({
    control,
    name: [
      `sounds.${index}.answer`,
      `sounds.${index}.audioPath`,
      `sounds.${index}.audioEndMs`,
    ],
  });
  const soundErrors = errors.sounds?.[index];
  const answerError = getFieldError(soundErrors?.answer);
  const audioPathError = getFieldError(soundErrors?.audioPath);
  const audioEndError = getFieldError(soundErrors?.audioEndMs);
  const previewPath = sound?.tempAudioPath || sound?.audioPath || null;
  const soundImagePreviewPath =
    sound?.tempImagePath || sound?.imagePath || "/placeholder-vinyl.svg";
  const audioRangeLabel = formatAudioRangeLabel(
    sound?.audioStartMs ?? 0,
    sound?.audioEndMs ?? null,
  );

  const handleAudioSelection = async (file: File | null) => {
    if (!file) {
      return;
    }

    setUploadingAudio(true);
    setAudioUploadError(null);

    try {
      const result = await uploadRemoteAudio(gameId, file);

      setValue(`sounds.${index}.tempAudioPath`, result.tempAudioPath, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(`sounds.${index}.audioPath`, result.tempAudioPath, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(`sounds.${index}.audioStartMs`, 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(`sounds.${index}.audioEndMs`, null, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success(`อัปโหลดเสียงที่ ${index + 1} แล้ว`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "อัปโหลดไฟล์เสียงไม่สำเร็จ";
      setAudioUploadError(message);
      toast.error(message);
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleRemoveAudio = () => {
    setValue(`sounds.${index}.audioPath`, undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(`sounds.${index}.tempAudioPath`, undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(`sounds.${index}.audioStartMs`, 0, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(`sounds.${index}.audioEndMs`, null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setAudioUploadError(null);
    toast.success(`ลบไฟล์เสียงที่ ${index + 1} ออกจากแบบร่างแล้ว`);
  };

  const handleSoundImageSelection = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!isCroppableImageType(file)) {
      const message = getUnsupportedImageTypeMessage(file);
      setImageUploadError(message);
      toast.error(message);
      return;
    }

    setImageUploadError(null);
    setPendingImageCropFile(file);
  };

  const handleSoundImageUpload = async (file: File) => {
    setUploadingImage(true);
    setImageUploadError(null);

    try {
      const result = await uploadRemoteSoundImage(gameId, file);

      setValue(`sounds.${index}.tempImagePath`, result.tempImagePath, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(`sounds.${index}.imagePath`, result.tempImagePath, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success(`อัปโหลดรูปแผ่นเสียงที่ ${index + 1} แล้ว`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "อัปโหลดรูปแผ่นเสียงไม่สำเร็จ";
      setImageUploadError(message);
      toast.error(message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveSoundImage = () => {
    setValue(`sounds.${index}.imagePath`, null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(`sounds.${index}.tempImagePath`, null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setImageUploadError(null);
    toast.success(`ลบรูปแผ่นเสียงที่ ${index + 1} ออกจากแบบร่างแล้ว`);
  };

  const isUploading = uploadingAudio || uploadingImage;

  return (
    <div className="group rounded-2xl border border-border bg-background/85 p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/30 text-sm font-semibold">
          {index + 1}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">เสียงที่ {index + 1}</h3>
              <p className="text-sm text-muted-foreground">
                อัปโหลดเสียงและใส่คำตอบที่ถูกต้องสำหรับรอบนี้
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={moveUp}
                disabled={index === 0 || isUploading}
                aria-label="Move sound up"
              >
                <MoveUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={moveDown}
                disabled={index === total - 1 || isUploading}
                aria-label="Move sound down"
              >
                <MoveDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                onClick={removeSound}
                disabled={isUploading}
                aria-label="Remove sound"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]">
            <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Label
                  htmlFor={`sound-guess-audio-upload-${index}`}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium"
                >
                  {uploadingAudio ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {previewPath ? "เปลี่ยนไฟล์เสียง" : "อัปโหลดไฟล์เสียง"}
                </Label>
                <input
                  id={`sound-guess-audio-upload-${index}`}
                  type="file"
                  accept={AUDIO_ACCEPTED_MIME.join(",")}
                  className="hidden"
                  onChange={(event) => {
                    void handleAudioSelection(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                />
                {previewPath ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAudioCropOpen(true)}
                      disabled={uploadingAudio}
                    >
                      <Scissors className="size-4" />
                      กำหนดช่วงเสียง
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveAudio}
                      disabled={uploadingAudio}
                    >
                      <Trash2 className="size-4" />
                      ลบเสียง
                    </Button>
                  </>
                ) : null}
              </div>

              {previewPath ? (
                <SoundAudioSegmentPreview
                  audioPath={previewPath}
                  endMs={sound?.audioEndMs ?? null}
                  rangeLabel={audioRangeLabel}
                  startMs={sound?.audioStartMs ?? 0}
                />
              ) : (
                <div className="flex min-h-20 items-center justify-center rounded-2xl border border-dashed border-border bg-background/70 text-sm text-muted-foreground">
                  <Music2 className="mr-2 size-4" />
                  ยังไม่ได้อัปโหลดไฟล์เสียง
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Supports MP3, WAV, OGG, WEBM, MP4/M4A. Max 20MB per file.
              </p>
              {audioUploadError || audioPathError || audioEndError ? (
                <p className="text-sm text-destructive">
                  {audioUploadError ?? audioPathError ?? audioEndError}
                </p>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
                <div className="relative mx-auto aspect-square w-full max-w-48 overflow-hidden rounded-2xl border border-border bg-background/70">
                  <Image
                    src={soundImagePreviewPath}
                    alt={`รูปแผ่นเสียงที่ ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Label
                    htmlFor={`sound-guess-image-upload-${index}`}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium"
                  >
                    {uploadingImage ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ImagePlus className="size-4" />
                    )}
                    {sound?.imagePath || sound?.tempImagePath ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
                  </Label>
                  <input
                    id={`sound-guess-image-upload-${index}`}
                    type="file"
                    accept={CROPPABLE_IMAGE_MIME.join(",")}
                    className="hidden"
                    onChange={(event) => {
                      handleSoundImageSelection(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                  />
                  {sound?.imagePath || sound?.tempImagePath ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveSoundImage}
                      disabled={uploadingImage}
                    >
                      <Trash2 className="size-4" />
                      ลบรูป
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Optional square image. If empty, the vinyl placeholder is used.
                </p>
                {imageUploadError ? (
                  <p className="text-sm text-destructive">{imageUploadError}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`sound-answer-${index}`}>คำตอบ</Label>
                <Input
                  id={`sound-answer-${index}`}
                  placeholder="เช่น เสียงฝนตก"
                  aria-invalid={answerError ? "true" : "false"}
                  {...register(`sounds.${index}.answer`)}
                />
                {answerError ? (
                  <p className="text-sm text-destructive">{answerError}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {index === total - 1 ? (
        <div className="mt-4 flex justify-end opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Button type="button" variant="outline" onClick={appendNextSound}>
            <Plus className="size-4" />
            เพิ่มเสียงถัดไป
          </Button>
        </div>
      ) : null}

      <ImageCropDialog
        open={!!pendingImageCropFile}
        file={pendingImageCropFile}
        targetWidth={SOUND_GUESS_SOUND_IMAGE_SIZE}
        targetHeight={SOUND_GUESS_SOUND_IMAGE_SIZE}
        onCancel={() => setPendingImageCropFile(null)}
        onConfirm={async (processedFile) => {
          await handleSoundImageUpload(processedFile);
          setPendingImageCropFile(null);
        }}
      />
      {audioCropOpen ? (
        <SoundAudioCropDialog
          open={audioCropOpen}
          audioPath={previewPath}
          initialStartMs={sound?.audioStartMs ?? 0}
          initialEndMs={sound?.audioEndMs ?? null}
          onCancel={() => setAudioCropOpen(false)}
          onConfirm={(range) => {
            setValue(`sounds.${index}.audioStartMs`, range.audioStartMs, {
              shouldDirty: true,
              shouldValidate: true,
            });
            setValue(`sounds.${index}.audioEndMs`, range.audioEndMs, {
              shouldDirty: true,
              shouldValidate: true,
            });
            setAudioCropOpen(false);
            toast.success(`กำหนดช่วงเสียงที่ ${index + 1} แล้ว`);
          }}
        />
      ) : null}
    </div>
  );
});
