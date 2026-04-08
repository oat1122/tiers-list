"use client";

import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ImagePlus,
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
import {
  Controller,
  useFieldArray,
  useForm,
  useFormState,
  useWatch,
  type Control,
  type Resolver,
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
import {
  CROPPABLE_IMAGE_MIME,
  IMAGE_UPLOAD_LIMIT_BYTES,
} from "@/lib/image-upload-config";
import { isCroppableImageType, isGifImageType } from "@/lib/image-processing";
import {
  buildPictureRevealContentFormSnapshot,
  type PictureRevealContentFormImageState,
  type PictureRevealContentFormState,
} from "@/lib/picture-reveal-content-form";
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

const PICTURE_REVEAL_COVER_WIDTH = 1600;
const PICTURE_REVEAL_COVER_HEIGHT = 900;
const COVER_ACCEPTED_FORMATS_LABEL = "JPEG, PNG, WEBP";

function formatBytes(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

function createPictureRevealCoverHelperText() {
  return `Cropped to ${PICTURE_REVEAL_COVER_WIDTH}x${PICTURE_REVEAL_COVER_HEIGHT}px (16:9), max ${formatBytes(
    IMAGE_UPLOAD_LIMIT_BYTES,
  )}, supports ${COVER_ACCEPTED_FORMATS_LABEL}.`;
}

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

async function uploadRemoteCover(gameId: string, file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `/api/picture-reveal-games/${gameId}/cover/upload-temp`,
    {
      method: "POST",
      body: formData,
    },
  );
  const payload = await readJsonOrNull(response);

  if (!response.ok) {
    throw new Error(extractPictureRevealApiError(payload) ?? "อัปโหลดรูปภาพหน้าปกไม่สำเร็จ");
  }

  const result = payload as { tempUploadPath: string };

  return {
    previewPath: result.tempUploadPath,
    coverAssetId: null,
  };
}

async function uploadRemoteImage(
  gameId: string,
  file: File,
  originalFile?: File | null,
) {
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
    throw new Error(extractPictureRevealApiError(payload) ?? "อัปโหลดรูปภาพไม่สำเร็จ");
  }

  const result = payload as {
    tempImagePath: string;
    tempOriginalImagePath?: string | null;
  };

  return {
    previewPath: result.tempImagePath,
    originalPreviewPath: result.tempOriginalImagePath ?? null,
    imageAssetId: null,
    originalImageAssetId: null,
  };
}

async function loadRemoteRecropFile(
  image: PictureRevealContentFormImageState,
  index: number,
) {
  const recropSourcePath = image.originalImagePath ?? image.imagePath;

  if (!recropSourcePath) {
    return null;
  }

  const response = await fetch(recropSourcePath, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("ไม่สามารถโหลดรูปภาพเดิมเพื่อทำการครอปใหม่ได้");
  }

  const blob = await response.blob();
  const extension = blob.type === "image/png" ? "png" : "webp";

  return new File([blob], `picture-reveal-${index + 1}.${extension}`, {
    type: blob.type || "image/webp",
  });
}

export interface PictureRevealContentUploadAdapter {
  uploadCover: (file: File) => Promise<{
    previewPath: string;
    coverAssetId?: string | null;
  }>;
  uploadImage: (params: {
    index: number;
    file: File;
    originalFile?: File | null;
  }) => Promise<{
    previewPath: string;
    originalPreviewPath?: string | null;
    imageAssetId?: string | null;
    originalImageAssetId?: string | null;
  }>;
  loadImageSourceFile?: (params: {
    index: number;
    image: PictureRevealContentFormImageState;
  }) => Promise<File | null>;
}

function PictureRevealCoverCard({
  gameId,
  control,
  setValue,
  uploadAdapter,
}: {
  gameId?: string;
  control: Control<PictureRevealContentFormState>;
  setValue: UseFormSetValue<PictureRevealContentFormState>;
  uploadAdapter?: PictureRevealContentUploadAdapter;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);

  const coverImagePath = useWatch({
    control,
    name: "coverImagePath",
  });
  const coverTempUploadPath = useWatch({
    control,
    name: "coverTempUploadPath",
  });
  const previewPath = coverTempUploadPath || coverImagePath || null;

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);

    try {
      const result = uploadAdapter
        ? await uploadAdapter.uploadCover(file)
        : await uploadRemoteCover(gameId!, file);
      const previousPreviewPath = previewPath;

      setValue("coverAssetId", result.coverAssetId ?? null, {
        shouldDirty: true,
      });
      setValue(
        "coverTempUploadPath",
        result.coverAssetId ? null : result.previewPath,
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
      setValue("coverImagePath", result.previewPath, {
        shouldDirty: true,
        shouldValidate: true,
      });

      if (
        previousPreviewPath?.startsWith("blob:") &&
        previousPreviewPath !== result.previewPath
      ) {
        URL.revokeObjectURL(previousPreviewPath);
      }

      toast.success("อัปโหลดรูปภาพหน้าปกแล้ว");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "อัปโหลดรูปภาพหน้าปกไม่สำเร็จ";
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

    setUploadError(null);
    setPendingCropFile(file);
  };

  const handleRemoveCover = () => {
    if (previewPath?.startsWith("blob:")) {
      URL.revokeObjectURL(previewPath);
    }

    setValue("coverImagePath", null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("coverTempUploadPath", null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("coverAssetId", null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setUploadError(null);
    toast.success("ลบรูปภาพหน้าปกออกจากแบบร่างแล้ว");
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-muted/20 p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">รูปภาพหน้าปกเกม</h3>
            <p className="text-sm text-muted-foreground">
              อัปโหลดรูปภาพหน้าปกสำหรับแสดงในหน้าแกลเลอรีรวมเกม
            </p>
          </div>

          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-background/70">
            {previewPath ? (
              <Image
                src={previewPath}
                alt="รูปภาพหน้าปกเกมทายภาพ"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                ยังไม่ได้อัปโหลดรูปหน้าปก
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Label
              htmlFor="picture-reveal-cover-upload"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-input px-3 py-2 text-sm font-medium"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {previewPath ? "เปลี่ยนรูปหน้าปก" : "อัปโหลดรูปหน้าปก"}
            </Label>
            <input
              id="picture-reveal-cover-upload"
              type="file"
              accept={CROPPABLE_IMAGE_MIME.join(",")}
              className="hidden"
              onChange={(event) => {
                handleFileSelection(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
            {previewPath ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemoveCover}
                disabled={uploading}
              >
                <Trash2 className="size-4" />
                ลบรูปหน้าปก
              </Button>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            {createPictureRevealCoverHelperText()}
          </p>
          {uploadError ? (
            <p className="text-sm text-destructive">{uploadError}</p>
          ) : null}
        </div>
      </div>

      <ImageCropDialog
        open={!!pendingCropFile}
        file={pendingCropFile}
        targetWidth={PICTURE_REVEAL_COVER_WIDTH}
        targetHeight={PICTURE_REVEAL_COVER_HEIGHT}
        onCancel={() => setPendingCropFile(null)}
        onConfirm={async (processedFile) => {
          await handleUpload(processedFile);
          setPendingCropFile(null);
        }}
      />
    </>
  );
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
  uploadAdapter,
}: {
  gameId?: string;
  index: number;
  total: number;
  control: Control<PictureRevealContentFormState>;
  register: UseFormRegister<PictureRevealContentFormState>;
  setValue: UseFormSetValue<PictureRevealContentFormState>;
  removeImage: () => void;
  moveUp: () => void;
  moveDown: () => void;
  appendNextImage: () => void;
  targetWidth: number;
  targetHeight: number;
  uploadAdapter?: PictureRevealContentUploadAdapter;
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
      const result = uploadAdapter
        ? await uploadAdapter.uploadImage({
            index,
            file,
            originalFile,
          })
        : await uploadRemoteImage(gameId!, file, originalFile);
      const previousPreviewPath = previewPath;
      const previousOriginalPath = image?.originalImagePath ?? null;

      if (uploadAdapter) {
        setValue(`images.${index}.imageAssetId`, result.imageAssetId ?? null, {
          shouldDirty: true,
        });
        setValue(
          `images.${index}.originalImageAssetId`,
          result.originalImageAssetId ?? result.imageAssetId ?? null,
          {
            shouldDirty: true,
          },
        );
        setValue(`images.${index}.tempImagePath`, undefined, {
          shouldDirty: true,
        });
        setValue(`images.${index}.tempOriginalImagePath`, undefined, {
          shouldDirty: true,
        });
        setValue(`images.${index}.imagePath`, result.previewPath, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue(
          `images.${index}.originalImagePath`,
          result.originalPreviewPath ?? result.previewPath,
          {
            shouldDirty: true,
          },
        );
      } else {
        setValue(`images.${index}.imageAssetId`, null, {
          shouldDirty: true,
        });
        setValue(`images.${index}.originalImageAssetId`, null, {
          shouldDirty: true,
        });
        setValue(`images.${index}.tempImagePath`, result.previewPath, {
          shouldDirty: true,
        });
        setValue(
          `images.${index}.tempOriginalImagePath`,
          result.originalPreviewPath ?? undefined,
          {
            shouldDirty: true,
          },
        );
      }

      if (
        previousPreviewPath?.startsWith("blob:") &&
        previousPreviewPath !== result.previewPath
      ) {
        URL.revokeObjectURL(previousPreviewPath);
      }

      if (
        previousOriginalPath?.startsWith("blob:") &&
        previousOriginalPath !== result.originalPreviewPath &&
        previousOriginalPath !== result.previewPath
      ) {
        URL.revokeObjectURL(previousOriginalPath);
      }

      toast.success(`อัปโหลดรูปภาพที่ ${index + 1} แล้ว`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "อัปโหลดรูปภาพไม่สำเร็จ";
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
      const message = "กรุณากำหนดขนาดรูปภาพให้ถูกต้องก่อนทำการอัปโหลด";
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
    if (!image) {
      return;
    }

    if (!sourceImageFile && !image?.originalImagePath && !image?.imagePath) {
      return;
    }

    if (sourceImageFile) {
      setPendingCropFile(sourceImageFile);
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const file = uploadAdapter?.loadImageSourceFile
        ? await uploadAdapter.loadImageSourceFile({
            index,
            image,
          })
        : await loadRemoteRecropFile(image, index);

      if (!file) {
        throw new Error("ไม่สามารถโหลดรูปภาพเดิมเพื่อทำการครอปใหม่ได้");
      }

      setSourceImageFile(file);
      setPendingCropFile(file);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "ไม่สามารถโหลดรูปภาพเดิมเพื่อทำการครอปใหม่ได้";
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
                    alt={`รูปภาพเกมทายภาพที่ ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-x-3 bottom-3 rounded-lg bg-background/80 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur-sm">
                    {canRecropFromPreview
                      ? "คลิกที่รูปภาพเพื่อครอปใหม่"
                      : "กรุณาบันทึกข้อมูลก่อนเพื่อครอปรูปจากต้นฉบับ"}
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  ยังไม่ได้อัปโหลดรูปภาพ
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
                {previewPath ? "เปลี่ยนรูปภาพ" : "อัปโหลดรูปภาพ"}
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
                เลื่อนขึ้น
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={moveDown}
                disabled={index === total - 1}
              >
                <MoveDown className="size-4" />
                เลื่อนลง
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removeImage}
              >
                <Trash2 className="size-4" />
                ลบรูปนี้
              </Button>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              ทุกๆ รูปภาพจะถูกครอปให้เป็นขนาด {targetWidth}x{targetHeight} พิกเซล
            </p>
            {uploadError ? (
              <p className="mt-2 text-sm text-destructive">{uploadError}</p>
            ) : null}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">รูปที่ {index + 1}</h3>
              <p className="text-sm text-muted-foreground">
                ตั้งค่าแผ่นป้ายและกำหนดคำตอบของรูปภาพนี้ (มีเพียง 1 คำตอบต่อรูป)
              </p>
            </div>

            <div className="space-y-2">
              <Label>คำตอบ</Label>
              <Input
                {...register(`images.${index}.answer`)}
                placeholder="พิมพ์ข้อความคำตอบที่ถูกต้อง"
              />
              {answerError ? (
                <p className="text-sm text-destructive">{answerError}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>จำนวนแถว (แนวนอน)</Label>
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
                <Label>จำนวนคอลัมน์ (แนวตั้ง)</Label>
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
                  จำนวนแผ่นป้ายพิเศษ
                  <InfoHint label="Special tile count">
                    <span>
                      เมื่อผู้จัดรายการเปิดแผ่นป้ายพิเศษ แผ่นป้ายรอบๆ จะถูกเปิดให้อัตโนมัติตามรูปแบบที่เลือก
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
                  รูปแบบการเปิดแผ่นป้ายพิเศษ
                  <InfoHint label="Special tile pattern">
                    <span>
                      ควบคุมว่าแผ่นป้ายใดรอบๆ แผ่นป้ายพิเศษจะถูกเปิดบ้าง
                    </span>
                  </InfoHint>
                </Label>
                <Controller
                  control={control}
                  name={`images.${index}.specialPattern`}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกรูปแบบ" />
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
              เพิ่มรูปภาพถัดไป
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

export interface PictureRevealContentFormProps {
  gameId?: string;
  initialValues: PictureRevealContentFormState;
  saving?: boolean;
  error?: string | null;
  onSave?: (values: SavePictureRevealGameContentInput) => Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
  onSnapshotChange?: (values: PictureRevealContentFormState) => void;
  uploadAdapter?: PictureRevealContentUploadAdapter;
  submitLabel?: string;
}

export function PictureRevealContentForm({
  gameId,
  initialValues,
  saving = false,
  error = null,
  onSave,
  onDirtyChange,
  onSnapshotChange,
  uploadAdapter,
  submitLabel = "บันทึกข้อมูล",
}: PictureRevealContentFormProps) {
  const form = useForm<PictureRevealContentFormState>({
    resolver: zodResolver(
      SavePictureRevealGameContentSchema,
    ) as Resolver<PictureRevealContentFormState>,
    defaultValues: initialValues,
  });
  const imagesFieldArray = useFieldArray({
    control: form.control,
    name: "images",
  });

  const watchedValues =
    useWatch({
      control: form.control,
    }) ?? initialValues;
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
    form.reset(initialValues);
  }, [form, initialValues]);

  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);

  useEffect(() => {
    onSnapshotChange?.(
      buildPictureRevealContentFormSnapshot(
        watchedValues as PictureRevealContentFormState,
      ),
    );
  }, [onSnapshotChange, watchedValues]);

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
      imageAssetId: null,
      originalImageAssetId: null,
    }));

    form.setValue("images", clearedImages, {
      shouldDirty: true,
      shouldValidate: true,
    });
    toast.warning(
      "เปลี่ยนขนาดรูปภาพแล้ว กรุณาอัปโหลดรูปภาพทั้งหมดอีกครั้งเพื่อให้ตรงกับขนาดใหม่",
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
        if (!onSave) {
          return;
        }

        await onSave(normalizePictureRevealContentInput(values));
      })}
    >
      <div className="space-y-4 rounded-2xl border border-border bg-background/85 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">เนื้อหา/รูปภาพ</h2>
            <p className="text-sm text-muted-foreground">
              ตั้งค่ารูปหน้าปก, ขนาดรูปภาพของเกม, อัปโหลดรูปรวมถึงกำหนดคำตอบให้แต่ละรูป
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
              เพิ่มรูปภาพ
            </Button>
            {onSave ? (
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {submitLabel}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <PictureRevealCoverCard
            gameId={gameId}
            control={form.control}
            setValue={form.setValue}
            uploadAdapter={uploadAdapter}
          />

          <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Label>รูปแบบขนาดสัดส่วน (Ratio)</Label>
                  <InfoHint label="Ratio presets">
                    <span>
                      เลือกสัดส่วนจากรูปแบบสำเร็จรูป หรือปลดล็อกเพื่อแก้ไขขนาดโดยกำหนดเอง
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
                    อัปเดตขนาดเอง
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
                <Label htmlFor="content-image-width">ความกว้าง (px)</Label>
                <Input
                  id="content-image-width"
                  type="number"
                  aria-invalid={imageWidthError ? "true" : "false"}
                  disabled={!ratioEditingEnabled}
                  {...form.register("imageWidth", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content-image-height">ความสูง (px)</Label>
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
                  ขนาดปัจจุบัน: {parsedImageWidth}x{parsedImageHeight} พิกเซล
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
          <p className="font-medium text-foreground">ยังไม่มีรูปภาพ</p>
          <p className="mt-1 text-sm text-muted-foreground">
            กรุณาเพิ่มรูปภาพอย่างน้อย 1 รูปภาพ ก่อนทำการนำไปเล่นจริงหรือเผยแพร่
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
            removeImage={() => {
              const currentImage = watchedImages?.[index];

              if (currentImage?.imagePath?.startsWith("blob:")) {
                URL.revokeObjectURL(currentImage.imagePath);
              }

              if (currentImage?.originalImagePath?.startsWith("blob:")) {
                URL.revokeObjectURL(currentImage.originalImagePath);
              }

              imagesFieldArray.remove(index);
            }}
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
            uploadAdapter={uploadAdapter}
          />
        ))}
      </div>
    </form>
  );
}

export function buildPictureRevealRemoteContentInitialValues(
  initialContent?: PictureRevealGameContentDto | null,
) {
  return buildPictureRevealContentDefaults(initialContent);
}
