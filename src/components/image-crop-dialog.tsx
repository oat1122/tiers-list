"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Crop, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IMAGE_CROP_PREVIEW_SIZE } from "@/lib/image-upload-config";
import {
  clampCropState,
  createCroppedImageFile,
  getCenteredCropState,
  getCropBounds,
  loadImageMetrics,
  nextCropStateForZoom,
  type LoadedImageMetrics,
  type SquareCropState,
} from "@/lib/image-processing";

interface ImageCropDialogProps {
  open: boolean;
  file: File | null;
  targetWidth?: number;
  targetHeight?: number;
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void> | void;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  originOffsetX: number;
  originOffsetY: number;
}

function formatAspectRatioLabel(width: number, height: number) {
  const gcd = (left: number, right: number): number =>
    right === 0 ? left : gcd(right, left % right);
  const divisor = gcd(width, height);

  return `${width / divisor}:${height / divisor}`;
}

export function ImageCropDialog({
  open,
  file,
  targetWidth = 1080,
  targetHeight = 1080,
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const [imageMetrics, setImageMetrics] = useState<LoadedImageMetrics | null>(null);
  const [crop, setCrop] = useState<SquareCropState | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !file) {
      setImageMetrics(null);
      setCrop(null);
      setErrorMessage(null);
      return;
    }

    let cancelled = false;

    setIsPreparing(true);
    setErrorMessage(null);

    void loadImageMetrics(file)
      .then((metrics) => {
        if (cancelled) {
          URL.revokeObjectURL(metrics.src);
          return;
        }

        setImageMetrics(metrics);
        setCrop(
          getCenteredCropState(
            metrics.width,
            metrics.height,
            1,
            targetWidth,
            targetHeight,
          ),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage("ไม่สามารถโหลดรูปภาพเพื่อครอปได้");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsPreparing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file, open, targetHeight, targetWidth]);

  useEffect(() => {
    return () => {
      if (imageMetrics?.src) {
        URL.revokeObjectURL(imageMetrics.src);
      }
    };
  }, [imageMetrics]);

  const bounds = useMemo(() => {
    if (!imageMetrics || !crop) {
      return null;
    }

    return getCropBounds(
      imageMetrics.width,
      imageMetrics.height,
      crop.zoom,
      targetWidth,
      targetHeight,
    );
  }, [crop, imageMetrics, targetHeight, targetWidth]);

  const previewViewport = useMemo(() => {
    const scale = Math.min(
      IMAGE_CROP_PREVIEW_SIZE / Math.max(targetWidth, targetHeight),
      1,
    );

    return {
      width: targetWidth * scale,
      height: targetHeight * scale,
    };
  }, [targetHeight, targetWidth]);

  const previewScale = bounds ? previewViewport.width / bounds.cropWidth : 1;

  const previewStyle = useMemo(() => {
    if (!imageMetrics || !crop) {
      return undefined;
    }

    return {
      width: imageMetrics.width * previewScale,
      height: imageMetrics.height * previewScale,
      left: -(crop.offsetX * previewScale),
      top: -(crop.offsetY * previewScale),
    };
  }, [crop, imageMetrics, previewScale]);

  if (!open || !file) {
    return null;
  }

  const handleZoomChange = (nextZoom: number) => {
    if (!imageMetrics || !crop) {
      return;
    }

    setCrop(
      nextCropStateForZoom(
        imageMetrics.width,
        imageMetrics.height,
        crop,
        nextZoom,
        targetWidth,
        targetHeight,
      ),
    );
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!crop) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originOffsetX: crop.offsetX,
      originOffsetY: crop.offsetY,
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || !crop || !imageMetrics) {
      return;
    }

    const deltaX = (event.clientX - dragState.startX) / previewScale;
    const deltaY = (event.clientY - dragState.startY) / previewScale;

    setCrop(
      clampCropState(
        imageMetrics.width,
        imageMetrics.height,
        {
          zoom: crop.zoom,
          offsetX: dragState.originOffsetX - deltaX,
          offsetY: dragState.originOffsetY - deltaY,
        },
        targetWidth,
        targetHeight,
      ),
    );
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragState?.pointerId === event.pointerId) {
      setDragState(null);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleConfirm = async () => {
    if (!file || !crop) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const processedFile = await createCroppedImageFile({
        file,
        crop,
        targetWidth,
        targetHeight,
      });

      await onConfirm(processedFile);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "ไม่สามารถครอปรูปภาพได้",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const sizeLabel = `${targetWidth}x${targetHeight}`;
  const ratioLabel = formatAspectRatioLabel(targetWidth, targetHeight);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="relative z-10 flex w-full max-w-4xl flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-2xl lg:flex-row">
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Crop className="size-4" />
              ครอปรูปก่อนใช้งาน
            </div>
            <p className="text-sm text-muted-foreground">
              เลื่อนภาพเพื่อเลือกตำแหน่งที่ต้องการแสดง ระบบจะบันทึกผลลัพธ์เป็น{" "}
              {sizeLabel} อัตราส่วน {ratioLabel}
            </p>
          </div>

          {errorMessage ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-col items-center gap-4">
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl border border-border bg-muted shadow-inner",
                dragState ? "cursor-grabbing" : "cursor-grab",
              )}
              style={previewViewport}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
            >
              {isPreparing || !previewStyle || !imageMetrics ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageMetrics.src}
                    alt="Crop preview"
                    className="pointer-events-none absolute max-w-none select-none"
                    style={previewStyle}
                    draggable={false}
                  />
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-white/60" />
                  <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/35" />
                  <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/35" />
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              ลากเพื่อเลื่อนตำแหน่งภาพ แล้วใช้ตัวเลื่อนด้านล่างเพื่อซูมเข้า/ออก
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-5">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-semibold text-foreground">ผลลัพธ์ที่จะได้</p>
            <p className="mt-1 text-sm text-muted-foreground">
              รูปปลายทาง {sizeLabel} อัตราส่วน {ratioLabel} และบันทึกเป็น WEBP
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-background/60 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Zoom</span>
              <span className="text-muted-foreground">
                {crop?.zoom.toFixed(2)}x
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ZoomOut className="size-4 text-muted-foreground" />
              <input
                type="range"
                min="1"
                max="4"
                step="0.05"
                value={crop?.zoom ?? 1}
                onChange={(event) => handleZoomChange(Number(event.target.value))}
                className="flex-1 accent-primary"
              />
              <ZoomIn className="size-4 text-muted-foreground" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            <p>คำแนะนำ</p>
            <p className="mt-1">
              รูปต้นฉบับควรใหญ่พอสำหรับสัดส่วนที่เลือก เพื่อให้ภาพหลังครอปยังคมชัด
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              ยกเลิก
            </Button>
            <Button onClick={() => void handleConfirm()} disabled={isPreparing || isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              ใช้รูปนี้
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
