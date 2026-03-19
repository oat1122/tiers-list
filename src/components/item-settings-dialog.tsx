"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useTierStore } from "@/store/useTierStore";
import { CardSize, TierItem } from "@/types";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";
import Image from "next/image";

interface ItemSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SIZE_OPTIONS: { value: CardSize; label: string; desc: string }[] = [
  { value: "sm", label: "เล็ก", desc: "64px" },
  { value: "md", label: "กลาง", desc: "80px" },
  { value: "lg", label: "ใหญ่", desc: "96px" },
];

export function ItemSettingsDialog({ open, onClose }: ItemSettingsDialogProps) {
  const { tiers, pool, cardSize, setCardSize, removeItem, renameItem } =
    useTierStore();
  const [nameValues, setNameValues] = useState<Record<string, string>>({});

  if (!open) return null;

  const allItems: { item: TierItem; source: string }[] = [
    ...pool.map((item) => ({ item, source: "Pool" })),
    ...tiers.flatMap((t) =>
      t.items.map((item) => ({ item, source: `Tier: ${t.label}` })),
    ),
  ];

  const getName = (id: string, fallback: string) =>
    nameValues[id] !== undefined ? nameValues[id] : fallback;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Item Settings</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
          {/* Card Size */}
          <div>
            <p className="text-sm font-semibold mb-2">ขนาด Card</p>
            <div className="flex gap-2">
              {SIZE_OPTIONS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setCardSize(value)}
                  className={`flex-1 flex flex-col items-center py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                    cardSize === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <span className="font-bold">{label}</span>
                  <span className="text-xs opacity-70">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Item List */}
          <div>
            <p className="text-sm font-semibold mb-2">
              จัดการ Items ({allItems.length})
            </p>
            {allItems.length === 0 && (
              <p className="text-sm text-muted-foreground/50 text-center py-6">
                ยังไม่มี item
              </p>
            )}
            <div className="flex flex-col gap-2">
              {allItems.map(({ item, source }) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 border border-border/50 hover:border-border transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 shrink-0 rounded-md overflow-hidden border border-border/40 bg-muted flex items-center justify-center">
                    {item.imageUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <span className="text-[9px] text-muted-foreground text-center px-0.5 leading-tight break-all">
                        {item.name.slice(0, 6)}
                      </span>
                    )}
                  </div>

                  {/* Name input */}
                  <input
                    type="text"
                    value={getName(item.id, item.name)}
                    onChange={(e) =>
                      setNameValues((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                    onBlur={() => {
                      const val = (nameValues[item.id] ?? item.name).trim();
                      if (val) renameItem(item.id, val);
                      else
                        setNameValues((prev) => ({
                          ...prev,
                          [item.id]: item.name,
                        }));
                    }}
                    className="flex-1 px-2 py-1 bg-background border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-ring transition-all"
                  />

                  {/* Source badge */}
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                    {source}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-4 border-t border-border">
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
