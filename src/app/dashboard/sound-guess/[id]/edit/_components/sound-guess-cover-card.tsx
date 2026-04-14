"use client";

import Image from "next/image";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { memo, useState } from "react";
import { useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { toast } from "sonner";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  CROPPABLE_IMAGE_MIME,
  IMAGE_UPLOAD_LIMIT_BYTES,
} from "@/lib/image-upload-config";
import { isCroppableImageType } from "@/lib/image-processing";
import type { SoundGuessContentFormState } from "@/lib/sound-guess-content-form";
import {
  formatBytes,
  getUnsupportedImageTypeMessage,
} from "./sound-guess-content-form.utils";
import { uploadRemoteCover } from "./sound-guess-upload-api";
/**
 * Renders cover upload, crop, preview, and removal controls.
 *
 * @param props - Form control, setter, and game id for upload requests.
 * @returns Cover editor card for the sound guess content editor.
 */
export const SoundGuessCoverCard = memo(function SoundGuessCoverCard({
  gameId,
  control,
  setValue,
  targetWidth,
  targetHeight,
}: {
  gameId: string;
  control: Control<SoundGuessContentFormState>;
  setValue: UseFormSetValue<SoundGuessContentFormState>;
  targetWidth: number;
  targetHeight: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
  const coverImagePath = useWatch({ control, name: "coverImagePath" });
  const coverTempUploadPath = useWatch({
    control,
    name: "coverTempUploadPath",
  });
  const previewPath = coverTempUploadPath || coverImagePath || null;

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);

    try {
      const result = await uploadRemoteCover(gameId, file);

      setValue("coverTempUploadPath", result.tempUploadPath, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("coverImagePath", result.tempUploadPath, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success("อัปโหลดรูปหน้าปกแล้ว");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "อัปโหลดรูปหน้าปกไม่สำเร็จ";
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
      const message = getUnsupportedImageTypeMessage(file);
      setUploadError(message);
      toast.error(message);
      return;
    }

    setUploadError(null);
    setPendingCropFile(file);
  };

  const handleRemoveCover = () => {
    setValue("coverImagePath", null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("coverTempUploadPath", null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setUploadError(null);
    toast.success("ลบรูปหน้าปกออกจากแบบร่างแล้ว");
  };


  return (
    <>
      <div className="rounded-2xl border border-border bg-muted/20 p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">รูปภาพหน้าปกเกม</h3>
            <p className="text-sm text-muted-foreground">
              อัปโหลดรูปหน้าปกสำหรับแสดงในหน้าแกลเลอรี หากไม่อัปโหลด ระบบจะแสดงแผ่นเสียงแทน
            </p>
          </div>

          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-background/70">
            {previewPath ? (
              <Image
                src={previewPath}
                alt="รูปภาพหน้าปกเกมทายเสียง"
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
              htmlFor="sound-guess-cover-upload"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-input px-3 py-2 text-sm font-medium"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {coverImagePath ? "เปลี่ยนรูปหน้าปก" : "อัปโหลดรูปหน้าปก"}
            </Label>
            <input
              id="sound-guess-cover-upload"
              type="file"
              accept={CROPPABLE_IMAGE_MIME.join(",")}
              className="hidden"
              onChange={(event) => {
                handleFileSelection(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
            {coverImagePath ? (
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
            Cropped to {targetWidth}x{targetHeight}px
            (16:9), max {formatBytes(IMAGE_UPLOAD_LIMIT_BYTES)}, supports JPEG,
            PNG, WEBP.
          </p>
          {uploadError ? (
            <p className="text-sm text-destructive">{uploadError}</p>
          ) : null}
        </div>
      </div>

      <ImageCropDialog
        open={!!pendingCropFile}
        file={pendingCropFile}
        targetWidth={targetWidth}
        targetHeight={targetHeight}
        onCancel={() => setPendingCropFile(null)}
        onConfirm={async (processedFile) => {
          await handleUpload(processedFile);
          setPendingCropFile(null);
        }}
      />
    </>
  );
});
