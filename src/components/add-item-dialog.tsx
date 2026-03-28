"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useTierStore } from "@/store/useTierStore";
import { TierItem } from "@/types";
import { ImagePlus, Type, X, Images } from "lucide-react";

interface AddItemDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddItemDialog({ open, onClose }: AddItemDialogProps) {
  const addItemToPool = useTierStore((s) => s.addItemToPool);
  const [tab, setTab] = useState<"image" | "text" | "combo">("image");
  const [textValue, setTextValue] = useState("");
  const [comboText, setComboText] = useState("");
  const [comboPreview, setComboPreview] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const comboFileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      const item: TierItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        name: file.name.replace(/\.[^.]+$/, ""),
        imageUrl: url,
      };
      addItemToPool(item);
    });
    onClose();
  };

  const handleTextAdd = () => {
    const name = textValue.trim();
    if (!name) return;
    const item: TierItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      name,
    };
    addItemToPool(item);
    setTextValue("");
    onClose();
  };

  const handleComboFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setComboPreview({ url, name: file.name.replace(/\.[^.]+$/, "") });
    if (!comboText) setComboText(file.name.replace(/\.[^.]+$/, ""));
  };

  const handleComboAdd = () => {
    if (!comboPreview || !comboText.trim()) return;
    const item: TierItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      name: comboText.trim(),
      imageUrl: comboPreview.url,
      showCaption: true,
    };
    addItemToPool(item);
    setComboText("");
    setComboPreview(null);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Items</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab("image")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === "image"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <ImagePlus className="w-4 h-4" /> รูปภาพ
          </button>
          <button
            onClick={() => setTab("text")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === "text"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Type className="w-4 h-4" /> ข้อความ
          </button>
          <button
            onClick={() => setTab("combo")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === "combo"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Images className="w-4 h-4" /> รูป + ข้อความ
          </button>
        </div>

        {/* Image Tab */}
        {tab === "image" && (
          <div>
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
            >
              <ImagePlus className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                คลิกหรือลากรูปมาวางที่นี่
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                รองรับหลายไฟล์พร้อมกัน
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        )}

        {/* Text Tab */}
        {tab === "text" && (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTextAdd()}
              placeholder="พิมพ์ชื่อ item…"
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <Button onClick={handleTextAdd} disabled={!textValue.trim()}>
              เพิ่ม Item
            </Button>
          </div>
        )}

        {/* Combo Tab */}
        {tab === "combo" && (
          <div className="flex flex-col gap-3">
            <div
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/60 transition-colors relative overflow-hidden"
              onClick={() => comboFileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleComboFile(e.dataTransfer.files);
              }}
            >
              {comboPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comboPreview.url}
                  alt="preview"
                  className="h-32 mx-auto object-contain rounded"
                />
              ) : (
                <>
                  <ImagePlus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
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
              onChange={(e) => handleComboFile(e.target.files)}
            />
            <input
              type="text"
              value={comboText}
              onChange={(e) => setComboText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComboAdd()}
              placeholder="ชื่อ / caption…"
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              onClick={handleComboAdd}
              disabled={!comboPreview || !comboText.trim()}
            >
              เพิ่ม Item
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
