"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Images, ImagePlus, Loader2, Type, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { POOL_TIER_ID } from "@/lib/tier-editor";
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

function fileNameToLabel(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

export function AddItemDialog({
  open,
  onClose,
  uploadContext,
}: AddItemDialogProps) {
  const addItemToPool = useTierStore((state) => state.addItemToPool);
  const pool = useTierStore((state) => state.pool);
  const [tab, setTab] = useState<DialogTab>("image");
  const [textValue, setTextValue] = useState("");
  const [comboText, setComboText] = useState("");
  const [comboPreview, setComboPreview] = useState<{
    file: File;
    url: string;
    name: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const comboFileRef = useRef<HTMLInputElement>(null);

  if (!open) {
    return null;
  }

  const uploadImageItem = async (params: {
    file: File;
    label: string;
    showCaption: number;
  }) => {
    if (!uploadContext) {
      return null;
    }

    const formData = new FormData();
    formData.set("image", params.file);
    formData.set("label", params.label);
    formData.set("tier", POOL_TIER_ID);
    formData.set("position", String(pool.length));
    formData.set("showCaption", String(params.showCaption));

    const response = await fetch(
      `/api/tier-lists/${uploadContext.listId}/items/upload-image`,
      {
        method: "POST",
        body: formData,
      },
    );

    const payload = (await response.json()) as
      | {
          id?: string;
          label?: string;
          imagePath?: string | null;
          itemType?: "text" | "image";
          showCaption?: number;
          error?: string;
        }
      | undefined;

    if (!response.ok || !payload?.id) {
      throw new Error(payload?.error ?? "อัปโหลดรูปภาพไม่สำเร็จ");
    }

    return {
      id: payload.id,
      persistedId: payload.id,
      name: payload.label ?? params.label,
      itemType: payload.itemType ?? "image",
      imagePath: payload.imagePath ?? null,
      imageUrl: payload.imagePath ?? undefined,
      showCaption: (payload.showCaption ?? params.showCaption) === 1,
    } satisfies TierItem;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;

        if (uploadContext) {
          const uploadedItem = await uploadImageItem({
            file,
            label: fileNameToLabel(file.name),
            showCaption: 0,
          });

          if (uploadedItem) {
            addItemToPool(uploadedItem);
          }
        } else {
          addItemToPool({
            id: `item-${Date.now()}-${Math.random()}`,
            name: fileNameToLabel(file.name),
            itemType: "image",
            imageUrl: URL.createObjectURL(file),
            showCaption: false,
          });
        }
      }

      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextAdd = () => {
    const name = textValue.trim();
    if (!name) return;

    addItemToPool({
      id: `item-${Date.now()}-${Math.random()}`,
      name,
      itemType: "text",
      showCaption: false,
    });
    setTextValue("");
    onClose();
  };

  const handleComboFile = (files: FileList | null) => {
    if (!files?.length) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) return;

    setComboPreview({
      file,
      url: URL.createObjectURL(file),
      name: fileNameToLabel(file.name),
    });

    if (!comboText) {
      setComboText(fileNameToLabel(file.name));
    }
  };

  const handleComboAdd = async () => {
    if (!comboPreview || !comboText.trim()) return;

    setIsUploading(true);

    try {
      if (uploadContext) {
        const uploadedItem = await uploadImageItem({
          file: comboPreview.file,
          label: comboText.trim(),
          showCaption: 1,
        });

        if (uploadedItem) {
          addItemToPool(uploadedItem);
        }
      } else {
        addItemToPool({
          id: `item-${Date.now()}-${Math.random()}`,
          name: comboText.trim(),
          itemType: "image",
          imageUrl: comboPreview.url,
          showCaption: true,
        });
      }

      setComboText("");
      setComboPreview(null);
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  return createPortal(
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
            onClick={() => setTab("image")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "image"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <ImagePlus className="h-4 w-4" /> รูปภาพ
          </button>
          <button
            onClick={() => setTab("text")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "text"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Type className="h-4 w-4" /> ข้อความ
          </button>
          <button
            onClick={() => setTab("combo")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "combo"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Images className="h-4 w-4" /> รูป + ข้อความ
          </button>
        </div>

        {tab === "image" ? (
          <div>
            <div
              className="cursor-pointer rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/60"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void handleFiles(event.dataTransfer.files);
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
                รองรับหลายไฟล์พร้อมกัน
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                void handleFiles(event.target.files);
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
              {comboPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comboPreview.url}
                  alt="preview"
                  className="mx-auto h-32 rounded object-contain"
                />
              ) : (
                <>
                  <ImagePlus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    คลิกเพื่อเลือกรูป (1 รูป)
                  </p>
                </>
              )}
            </div>

            <input
              ref={comboFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleComboFile(event.target.files)}
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
              disabled={!comboPreview || !comboText.trim() || isUploading}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              เพิ่ม Item
            </Button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
