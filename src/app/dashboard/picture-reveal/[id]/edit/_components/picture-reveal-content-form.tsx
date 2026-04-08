"use client";

import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Lock,
  LockOpen,
  MoveDown,
  MoveUp,
  Plus,
  Scissors,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  Controller,
  useFieldArray,
  useForm,
  useFormState,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { toast } from "sonner";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import { Button } from "@/components/ui/button";
import { InfoHint } from "@/components/ui/info-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CROPPABLE_IMAGE_MIME } from "@/lib/image-upload-config";
import { isCroppableImageType, isGifImageType } from "@/lib/image-processing";
import { SavePictureRevealGameContentSchema } from "@/lib/validations";
import type { SavePictureRevealGameContentInput } from "@/lib/validations";
import type { PictureRevealGameContentDto } from "@/types/picture-reveal-admin";
import {
  buildPictureRevealContentDefaults,
  createEmptyImageDraft,
  extractPictureRevealApiError,
  formatPictureRevealAspectRatio,
  normalizePictureRevealContentInput,
  pictureRevealImageRatioPresets,
  pictureRevealSpecialPatternOptions,
  readJsonOrNull,
} from "@/app/dashboard/picture-reveal/_components/picture-reveal-admin.utils";

type ContentFormState = z.input<typeof SavePictureRevealGameContentSchema>;

function getUnsupportedTypeMessage(file: File) {
  if (isGifImageType(file)) {
    return "GIF is not supported in this crop flow. Please use JPEG, PNG, or WEBP.";
  }

  return "Only JPEG, PNG, and WEBP files are supported.";
}

function getFieldError(error: unknown) {
  return error && typeof error === "object" && "message" in error
    ? String(error.message)
    : null;
}

function PictureRevealImageCard({
  gameId,
  index,
  total,
  control,
  register,
  setValue,
  removeImage,
  moveUp,
  moveDown,
  appendNextImage,
  targetWidth,
  targetHeight,
}: {
  gameId: string;
  index: number;
  total: number;
  control: Control<ContentFormState>;
  register: UseFormRegister<ContentFormState>;
  setValue: UseFormSetValue<ContentFormState>;
  removeImage: () => void;
  moveUp: () => void;
  moveDown: () => void;
  appendNextImage: () => void;
  targetWidth: number;
  targetHeight: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);

  const image = useWatch({
    control,
    name: `images.${index}`,
  });
  const { errors } = useFormState({
    control,
    name: [
      `images.${index}.answer`,
      `images.${index}.rows`,
      `images.${index}.cols`,
      `images.${index}.specialTileCount`,
    ],
  });

  const imageErrors = errors.images?.[index];
  const previewPath = image?.tempImagePath || image?.imagePath || null;
  const answerError = getFieldError(imageErrors?.answer);
  const rowsError = getFieldError(imageErrors?.rows);
  const colsError = getFieldError(imageErrors?.cols);
  const specialTilesError = getFieldError(imageErrors?.specialTileCount);

  const handleUpload = async (file: File, originalFile?: File | null) => {
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      if (originalFile) {
        formData.append("originalImage", originalFile);
      }

      const response = await fetch(
        `/api/picture-reveal-games/${gameId}/images/upload-temp`,
        {
          method: "POST",
          body: formData,
        },
      );
      const payload = await readJsonOrNull(response);

      if (!response.ok) {
        throw new Error(
          extractPictureRevealApiError(payload) ?? "Image upload failed",
        );
      }

      const result = payload as {
        tempImagePath: string;
        tempOriginalImagePath?: string | null;
      };

      setValue(`images.${index}.tempImagePath`, result.tempImagePath, {
        shouldDirty: true,
      });
      setValue(
        `images.${index}.tempOriginalImagePath`,
        result.tempOriginalImagePath ?? undefined,
        {
          shouldDirty: true,
        },
      );
      toast.success(`Uploaded image ${index + 1}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Image upload failed";
      setUploadError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelection = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!isCroppableImageType(file)) {
      const message = getUnsupportedTypeMessage(file);
      setUploadError(message);
      toast.error(message);
      return;
    }

    if (targetWidth < 100 || targetHeight < 100) {
      const message = "Set a valid image size before uploading.";
      setUploadError(message);
      toast.error(message);
      return;
    }

    setUploadError(null);
    setSourceImageFile(file);
    setPendingCropFile(file);
  };

  const canRecropFromPreview = Boolean(
    sourceImageFile || image?.originalImagePath || image?.imagePath,
  );

  const handleRecropPreview = async () => {
    const recropSourcePath = image?.originalImagePath ?? image?.imagePath;

    if (!sourceImageFile && !recropSourcePath) {
      return;
    }

    if (sourceImageFile) {
      setPendingCropFile(sourceImageFile);
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const response = await fetch(recropSourcePath!, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Could not load the current image for recropping.");
      }

      const blob = await response.blob();
      const extension = blob.type === "image/png" ? "png" : "webp";
      const file = new File([blob], `picture-reveal-${index + 1}.${extension}`, {
        type: blob.type || "image/webp",
      });

      setSourceImageFile(file);
      setPendingCropFile(file);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load the current image for recropping.";
      setUploadError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="group rounded-3xl border border-border bg-background/80 p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="w-full xl:max-w-sm">
            <button
              type="button"
              className="relative block aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted/20 text-left transition hover:border-primary/50 disabled:cursor-default"
              onClick={() => void handleRecropPreview()}
              disabled={!canRecropFromPreview || uploading}
            >
              {previewPath ? (
                <>
                  <Image
                    src={previewPath}
                    alt={`Picture reveal image ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-x-3 bottom-3 rounded-lg bg-background/80 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur-sm">
                    {canRecropFromPreview
                      ? "Click the image to crop again."
                      : "Save first to crop from the stored original image."}
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No image uploaded yet
                </div>
              )}
            </button>

            <div className="mt-3 flex flex-wrap gap-2">
              <Label
                htmlFor={`image-upload-${index}`}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-input px-3 py-2 text-sm font-medium"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Scissors className="size-4" />
                )}
                {previewPath ? "Replace Image" : "Upload Image"}
              </Label>
              <input
                id={`image-upload-${index}`}
                type="file"
                accept={CROPPABLE_IMAGE_MIME.join(",")}
                className="hidden"
                onChange={(event) => {
                  handleFileSelection(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={moveUp}
                disabled={index === 0}
              >
                <MoveUp className="size-4" />
                Up
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={moveDown}
                disabled={index === total - 1}
              >
                <MoveDown className="size-4" />
                Down
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removeImage}
              >
                <Trash2 className="size-4" />
                Remove
              </Button>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Every image will be cropped to {targetWidth}x{targetHeight}px.
            </p>
            {uploadError ? (
              <p className="mt-2 text-sm text-destructive">{uploadError}</p>
            ) : null}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Image {index + 1}</h3>
              <p className="text-sm text-muted-foreground">
                Configure the board and store the single hidden answer for this
                image.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Answer</Label>
              <Input
                {...register(`images.${index}.answer`)}
                placeholder="Type the correct answer"
              />
              {answerError ? (
                <p className="text-sm text-destructive">{answerError}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Rows</Label>
                <Input
                  type="number"
                  aria-invalid={rowsError ? "true" : "false"}
                  {...register(`images.${index}.rows`, {
                    valueAsNumber: true,
                  })}
                />
                {rowsError ? (
                  <p className="text-sm text-destructive">{rowsError}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Cols</Label>
                <Input
                  type="number"
                  aria-invalid={colsError ? "true" : "false"}
                  {...register(`images.${index}.cols`, {
                    valueAsNumber: true,
                  })}
                />
                {colsError ? (
                  <p className="text-sm text-destructive">{colsError}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>
                  Special Tiles
                  <InfoHint label="Special tile count">
                    <span>
                      When a host opens a special tile, nearby tiles are opened
                      automatically based on the selected pattern.
                    </span>
                  </InfoHint>
                </Label>
                <Input
                  type="number"
                  aria-invalid={specialTilesError ? "true" : "false"}
                  {...register(`images.${index}.specialTileCount`, {
                    valueAsNumber: true,
                  })}
                />
                {specialTilesError ? (
                  <p className="text-sm text-destructive">
                    {specialTilesError}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>
                  Pattern
                  <InfoHint label="Special tile pattern">
                    <span>
                      This controls which neighboring tiles are revealed when a
                      special tile is opened.
                    </span>
                  </InfoHint>
                </Label>
                <Controller
                  control={control}
                  name={`images.${index}.specialPattern`}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        {pictureRevealSpecialPatternOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="space-y-0.5">
                              <div>{option.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {option.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {index === total - 1 ? (
          <div className="mt-4 flex justify-end opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <Button type="button" variant="outline" onClick={appendNextImage}>
              <Plus className="size-4" />
              Add Next Image
            </Button>
          </div>
        ) : null}
      </div>

      <ImageCropDialog
        open={!!pendingCropFile}
        file={pendingCropFile}
        targetWidth={targetWidth}
        targetHeight={targetHeight}
        onCancel={() => setPendingCropFile(null)}
        onConfirm={async (processedFile) => {
          await handleUpload(processedFile, sourceImageFile ?? pendingCropFile);
          setPendingCropFile(null);
        }}
      />
    </>
  );
}

export function PictureRevealContentForm({
  gameId,
  initialContent,
  saving,
  error,
  onSave,
  onDirtyChange,
}: {
  gameId: string;
  initialContent: PictureRevealGameContentDto | null;
  saving: boolean;
  error: string | null;
  onSave: (values: SavePictureRevealGameContentInput) => Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
}) {
  const form = useForm<ContentFormState>({
    resolver: zodResolver(SavePictureRevealGameContentSchema),
    defaultValues: buildPictureRevealContentDefaults(initialContent),
  });
  const imagesFieldArray = useFieldArray({
    control: form.control,
    name: "images",
  });

  const watchedImages = useWatch({
    control: form.control,
    name: "images",
  });
  const watchedImageWidth = useWatch({
    control: form.control,
    name: "imageWidth",
  });
  const watchedImageHeight = useWatch({
    control: form.control,
    name: "imageHeight",
  });
  const [ratioEditingEnabled, setRatioEditingEnabled] = useState(false);

  useEffect(() => {
    form.reset(buildPictureRevealContentDefaults(initialContent));
  }, [form, initialContent]);

  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);

  const imageWidthError = form.formState.errors.imageWidth?.message;
  const imageHeightError = form.formState.errors.imageHeight?.message;
  const parsedImageWidth = Number(watchedImageWidth) || 1080;
  const parsedImageHeight = Number(watchedImageHeight) || 1080;
  const hasUploadedImages = useMemo(
    () =>
      (watchedImages ?? []).some((image) =>
        Boolean(image?.imagePath || image?.tempImagePath),
      ),
    [watchedImages],
  );

  const updateImageSize = (nextWidth: number, nextHeight: number) => {
    form.setValue("imageWidth", nextWidth, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("imageHeight", nextHeight, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (!hasUploadedImages) {
      return;
    }

    const clearedImages = (watchedImages ?? []).map((image) => ({
      ...image,
      imagePath: undefined,
      originalImagePath: undefined,
      tempImagePath: undefined,
      tempOriginalImagePath: undefined,
    }));

    form.setValue("images", clearedImages, {
      shouldDirty: true,
      shouldValidate: true,
    });
    toast.warning(
      "Image size changed. Re-upload images so they match the new crop size.",
    );
  };

  const applyRatioPreset = (preset: {
    label: string;
    width: number;
    height: number;
  }) => {
    updateImageSize(preset.width, preset.height);
    toast.success(
      `Applied ${preset.label} (${preset.width}x${preset.height}).`,
    );
  };

  const aspectRatioLabel = formatPictureRevealAspectRatio(
    parsedImageWidth,
    parsedImageHeight,
  );
  const activeRatio = pictureRevealImageRatioPresets.find(
    (preset) =>
      formatPictureRevealAspectRatio(preset.width, preset.height) ===
      aspectRatioLabel,
  )?.key;

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSave(normalizePictureRevealContentInput(values));
      })}
    >
      <div className="space-y-4 rounded-2xl border border-border bg-background/85 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Content</h2>
            <p className="text-sm text-muted-foreground">
              Configure image size, upload images, and store one hidden answer
              for each board.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                imagesFieldArray.append(
                  createEmptyImageDraft(imagesFieldArray.fields.length),
                )
              }
            >
              <Plus className="size-4" />
              Add Image
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save Content
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Label>Ratio Presets</Label>
                <InfoHint label="Ratio presets">
                  <span>
                    Pick a preset crop ratio or unlock manual editing for custom
                    dimensions.
                  </span>
                </InfoHint>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2">
                {ratioEditingEnabled ? (
                  <LockOpen className="size-4 text-muted-foreground" />
                ) : (
                  <Lock className="size-4 text-muted-foreground" />
                )}
                <Label htmlFor="toggle-ratio-editing" className="text-xs">
                  Unlock custom size
                </Label>
                <Switch
                  id="toggle-ratio-editing"
                  checked={ratioEditingEnabled}
                  onCheckedChange={setRatioEditingEnabled}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {pictureRevealImageRatioPresets.map((preset) => (
                <Button
                  key={preset.key}
                  type="button"
                  size="sm"
                  variant={activeRatio === preset.key ? "default" : "outline"}
                  disabled={!ratioEditingEnabled}
                  onClick={() => applyRatioPreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <Label htmlFor="content-image-width">Image Width (px)</Label>
              <Input
                id="content-image-width"
                type="number"
                aria-invalid={imageWidthError ? "true" : "false"}
                disabled={!ratioEditingEnabled}
                {...form.register("imageWidth", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-image-height">Image Height (px)</Label>
              <Input
                id="content-image-height"
                type="number"
                aria-invalid={imageHeightError ? "true" : "false"}
                disabled={!ratioEditingEnabled}
                {...form.register("imageHeight", { valueAsNumber: true })}
              />
            </div>
            <div className="flex items-end">
              <div className="rounded-xl border border-border bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                Current size: {parsedImageWidth}x{parsedImageHeight}px
              </div>
            </div>
          </div>

          {imageWidthError || imageHeightError ? (
            <p className="text-sm text-destructive">
              {imageWidthError ?? imageHeightError}
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {form.formState.errors.images?.message ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {form.formState.errors.images.message}
        </div>
      ) : null}

      {imagesFieldArray.fields.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
          <p className="font-medium text-foreground">No images yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add at least one image before publishing the game.
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {imagesFieldArray.fields.map((field, index) => (
          <PictureRevealImageCard
            key={field.id}
            gameId={gameId}
            index={index}
            total={imagesFieldArray.fields.length}
            control={form.control}
            register={form.register}
            setValue={form.setValue}
            removeImage={() => imagesFieldArray.remove(index)}
            moveUp={() => index > 0 && imagesFieldArray.move(index, index - 1)}
            moveDown={() =>
              index < imagesFieldArray.fields.length - 1 &&
              imagesFieldArray.move(index, index + 1)
            }
            appendNextImage={() =>
              imagesFieldArray.append(
                createEmptyImageDraft(imagesFieldArray.fields.length),
              )
            }
            targetWidth={parsedImageWidth}
            targetHeight={parsedImageHeight}
          />
        ))}
      </div>
    </form>
  );
}
