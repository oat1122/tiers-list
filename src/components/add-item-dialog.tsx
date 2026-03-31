"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Images, ImagePlus, Loader2, Type, X } from "lucide-react";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import { Button } from "@/components/ui/button";
import {
  CROPPABLE_IMAGE_MIME,
  IMAGE_RECOMMENDED_RATIO_LABEL,
  IMAGE_RECOMMENDED_SIZE_LABEL,
  IMAGE_UPLOAD_LIMIT_BYTES,
} from "@/lib/image-upload-config";
import {
  isCroppableImageType,
  isGifImageType,
} from "@/lib/image-processing";
import { useTierStore } from "@/store/useTierStore";
import type { TierItem } from "@/types";

interface AddItemDialogProps {
  open: boolean;
  onClose: () => void;
  uploadContext?: {
    listId: string;
  };
}

type DialogTab = "image" | "text" | "combo";
type PendingCropMode = "batch" | "combo";

interface PendingCropItem {
  file: File;
  label: string;
  showCaption: boolean;
  mode: PendingCropMode;
}

interface ComboDraft {
  file: File;
  url: string;
  name: string;
}

const ACCEPTED_FORMATS_LABEL = "JPEG, PNG, WEBP";

function fileNameToLabel(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

function createLocalItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `item-${crypto.randomUUID()}`;
  }

  return `item-${Date.now()}-${Math.random()}`;
}

function getProcessedImageName(file: File) {
  return fileNameToLabel(file.name);
}

function formatBytes(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

function getUnsupportedTypeMessage(file: File) {
  if (isGifImageType(file)) {
    return "GIF ยังไม่รองรับใน crop flow นี้ กรุณาใช้ JPEG, PNG หรือ WEBP";
  }

  return "รองรับเฉพาะไฟล์ JPEG, PNG และ WEBP สำหรับการครอปรูป";
}

function createImageDraftItem(params: {
  file: File;
  label: string;
  showCaption: boolean;
  tempUploadPath?: string | null;
}): TierItem {
  return {
    id: createLocalItemId(),
    name: params.label,
    itemType: "image",
    imageUrl: URL.createObjectURL(params.file),
    imagePath: null,
    tempUploadPath: params.tempUploadPath ?? null,
    showCaption: params.showCaption,
  };
}

function getServerUploadError(payload: {
  error?: string;
  code?: string;
  limitBytes?: number;
  recommendedSize?: string;
  recommendedMimeTypes?: string[];
}) {
  if (payload.code === "unsupported_type") {
    const supported = payload.recommendedMimeTypes?.length
      ? payload.recommendedMimeTypes
          .map((mime) => mime.replace("image/", "").toUpperCase())
          .join(", ")
      : ACCEPTED_FORMATS_LABEL;

    return `รองรับเฉพาะไฟล์ ${supported}`;
  }

  if (payload.code === "file_too_large") {
    const limit = payload.limitBytes
      ? formatBytes(payload.limitBytes)
      : formatBytes(IMAGE_UPLOAD_LIMIT_BYTES);

    return `ไฟล์หลังครอปต้องไม่เกิน ${limit}`;
  }

  return payload.error ?? "อัปโหลดรูปภาพไม่สำเร็จ";
}

function createHelperText() {
  return `แนะนำ ${IMAGE_RECOMMENDED_SIZE_LABEL} อัตราส่วน ${IMAGE_RECOMMENDED_RATIO_LABEL} ไฟล์สุดท้ายต้องไม่เกิน ${formatBytes(
    IMAGE_UPLOAD_LIMIT_BYTES,
  )} และรองรับ ${ACCEPTED_FORMATS_LABEL}`;
}

export function AddItemDialog({
  open,
  onClose,
  uploadContext,
}: AddItemDialogProps) {
  const addItemToPool = useTierStore((state) => state.addItemToPool);
  const [tab, setTab] = useState<DialogTab>("image");
  const [textValue, setTextValue] = useState("");
  const [comboText, setComboText] = useState("");
  const [comboDraft, setComboDraft] = useState<ComboDraft | null>(null);
  const [pendingCropQueue, setPendingCropQueue] = useState<PendingCropItem[]>([]);
  const [shouldCloseAfterQueue, setShouldCloseAfterQueue] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const comboFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      return;
    }

    setPendingCropQueue([]);
    setShouldCloseAfterQueue(false);
    setUploadError(null);
    setIsUploading(false);
    setTextValue("");
    setComboText("");
    setComboDraft(null);
  }, [open]);

  useEffect(() => {
    return () => {
      if (comboDraft?.url) {
        URL.revokeObjectURL(comboDraft.url);
      }
    };
  }, [comboDraft]);

  useEffect(() => {
    if (
      !open ||
      !shouldCloseAfterQueue ||
      isUploading ||
      pendingCropQueue.length > 0
    ) {
      return;
    }

    setShouldCloseAfterQueue(false);
    onClose();
  }, [isUploading, onClose, open, pendingCropQueue.length, shouldCloseAfterQueue]);

  if (!open) {
    return null;
  }

  const currentCropItem = pendingCropQueue[0] ?? null;

  const uploadTempImage = async (file: File) => {
    if (!uploadContext) {
      return null;
    }

    const formData = new FormData();
    formData.set("image", file);

    const response = await fetch(
      `/api/tier-lists/${uploadContext.listId}/items/upload-image-temp`,
      {
        method: "POST",
        body: formData,
      },
    );

    const payload = (await response.json()) as
      | {
          tempUploadPath?: string;
          error?: string;
          code?: string;
          limitBytes?: number;
          recommendedSize?: string;
          recommendedMimeTypes?: string[];
        }
      | undefined;

    if (!response.ok || !payload?.tempUploadPath) {
      throw new Error(getServerUploadError(payload ?? {}));
    }

    return payload.tempUploadPath;
  };

  const openCropQueue = (items: PendingCropItem[]) => {
    setPendingCropQueue(items);
    setUploadError(null);
  };

  const validateCroppableFiles = (files: File[]) => {
    const invalidFile = files.find((file) => !isCroppableImageType(file));
    if (invalidFile) {
      setUploadError(getUnsupportedTypeMessage(invalidFile));
      return false;
    }

    return true;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;

    const nextFiles = Array.from(files);
    if (!validateCroppableFiles(nextFiles)) {
      return;
    }

    openCropQueue(
      nextFiles.map((file) => ({
        file,
        label: fileNameToLabel(file.name),
        showCaption: false,
        mode: "batch",
      })),
    );
  };

  const handleTextAdd = () => {
    const name = textValue.trim();
    if (!name) return;

    addItemToPool({
      id: createLocalItemId(),
      name,
      itemType: "text",
      showCaption: false,
    });
    setTextValue("");
    setUploadError(null);
    onClose();
  };

  const handleComboFile = (files: FileList | null) => {
    if (!files?.length) return;

    const file = files[0];
    if (!validateCroppableFiles([file])) {
      return;
    }

    openCropQueue([
      {
        file,
        label: fileNameToLabel(file.name),
        showCaption: true,
        mode: "combo",
      },
    ]);
  };

  const handleProcessedFile = async (processedFile: File) => {
    if (!currentCropItem) {
      return;
    }

    if (currentCropItem.mode === "combo") {
      if (comboDraft) {
        URL.revokeObjectURL(comboDraft.url);
      }

      setComboDraft({
        file: processedFile,
        url: URL.createObjectURL(processedFile),
        name: getProcessedImageName(processedFile),
      });
      setComboText((current) =>
        current.trim().length > 0 ? current : currentCropItem.label,
      );
      setPendingCropQueue([]);
      setUploadError(null);
      return;
    }

    setIsUploading(true);

    try {
      const tempUploadPath = uploadContext
        ? await uploadTempImage(processedFile)
        : null;

      addItemToPool(
        createImageDraftItem({
          file: processedFile,
          label: currentCropItem.label,
          showCaption: currentCropItem.showCaption,
          tempUploadPath,
        }),
      );

      setShouldCloseAfterQueue(pendingCropQueue.length <= 1);
      setPendingCropQueue((queue) => queue.slice(1));
    } finally {
      setIsUploading(false);
    }
  };

  const handleComboAdd = async () => {
    if (!comboDraft || !comboText.trim()) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const tempUploadPath = uploadContext
        ? await uploadTempImage(comboDraft.file)
        : null;

      addItemToPool(
        createImageDraftItem({
          file: comboDraft.file,
          label: comboText.trim(),
          showCaption: true,
          tempUploadPath,
        }),
      );

      URL.revokeObjectURL(comboDraft.url);
      setComboDraft(null);
      setComboText("");
      onClose();
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "อัปโหลดรูปภาพไม่สำเร็จ",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const helperText = createHelperText();

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Items</h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 flex gap-2">
              <button
                onClick={() => {
                  setTab("image");
                  setUploadError(null);
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === "image"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <ImagePlus className="h-4 w-4" /> รูปภาพ
              </button>
              <button
                onClick={() => {
                  setTab("text");
                  setUploadError(null);
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === "text"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Type className="h-4 w-4" /> ข้อความ
              </button>
              <button
                onClick={() => {
                  setTab("combo");
                  setUploadError(null);
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === "combo"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Images className="h-4 w-4" /> รูป + ข้อความ
              </button>
            </div>

            {uploadError ? (
              <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {uploadError}
              </p>
            ) : null}

            {tab !== "text" ? (
              <div className="mb-4 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs leading-5 text-muted-foreground">
                {helperText}
              </div>
            ) : null}

            {tab === "image" ? (
              <div>
                <div
                  className="cursor-pointer rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/60"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleFiles(event.dataTransfer.files);
                  }}
                >
                  {isUploading ? (
                    <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-muted-foreground" />
                  ) : (
                    <ImagePlus className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    คลิกหรือลากรูปมาวางที่นี่
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    เลือกได้หลายไฟล์ ระบบจะให้ครอปทีละรูปก่อนเพิ่มเข้า pool
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={CROPPABLE_IMAGE_MIME.join(",")}
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    handleFiles(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />
              </div>
            ) : null}

            {tab === "text" ? (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={textValue}
                  onChange={(event) => setTextValue(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && handleTextAdd()}
                  placeholder="พิมพ์ชื่อ item..."
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                <Button onClick={handleTextAdd} disabled={!textValue.trim()}>
                  เพิ่ม Item
                </Button>
              </div>
            ) : null}

            {tab === "combo" ? (
              <div className="flex flex-col gap-3">
                <div
                  className="relative cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-border p-4 text-center transition-colors hover:border-primary/60"
                  onClick={() => comboFileRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleComboFile(event.dataTransfer.files);
                  }}
                >
                  {comboDraft ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={comboDraft.url}
                      alt="Processed preview"
                      className="mx-auto h-32 rounded object-contain"
                    />
                  ) : (
                    <>
                      <ImagePlus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        คลิกเพื่อเลือกรูป (1 รูป)
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        ระบบจะพาไปครอปรูปก่อนเพิ่ม caption
                      </p>
                    </>
                  )}
                </div>

                <input
                  ref={comboFileRef}
                  type="file"
                  accept={CROPPABLE_IMAGE_MIME.join(",")}
                  className="hidden"
                  onChange={(event) => {
                    handleComboFile(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />

                <input
                  type="text"
                  value={comboText}
                  onChange={(event) => setComboText(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && void handleComboAdd()}
                  placeholder="ชื่อ / caption..."
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />

                <Button
                  onClick={() => void handleComboAdd()}
                  disabled={!comboDraft || !comboText.trim() || isUploading}
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  เพิ่ม Item
                </Button>
              </div>
            ) : null}
          </div>
        </div>,
        document.body,
      )}

      <ImageCropDialog
        open={!!currentCropItem}
        file={currentCropItem?.file ?? null}
        onCancel={() => {
          setPendingCropQueue([]);
        }}
        onConfirm={handleProcessedFile}
      />
    </>
  );
}
