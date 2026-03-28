"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useTierStore } from "@/store/useTierStore";
import { TierRow } from "@/types";
import { Button } from "@/components/ui/button";
import { X, Trash2, PlusCircle } from "lucide-react";

const PRESET_COLORS = [
  "#ff7f7f",
  "#ffbf7f",
  "#ffdf7f",
  "#ffff7f",
  "#bfff7f",
  "#7fff7f",
  "#7fffff",
  "#7fbfff",
  "#7f7fff",
  "#ff7fff",
];

const TIER_LABELS = ["S", "A", "B", "C", "D", "E", "F", "G"];

interface TierSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function TierSettingsDialog({ open, onClose }: TierSettingsDialogProps) {
  const { tiers, renameTier, setTierColor, addTier, removeTier } =
    useTierStore();

  const [labelValues, setLabelValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(tiers.map((t) => [t.id, t.label])),
  );
  const [labelErrors, setLabelErrors] = useState<Record<string, boolean>>({});

  if (!open) return null;

  const handleAddTier = () => {
    const usedLabels = new Set(tiers.map((t) => t.label));
    const nextLabel =
      TIER_LABELS.find((l) => !usedLabels.has(l)) ?? `T${tiers.length + 1}`;
    const color = PRESET_COLORS[tiers.length % PRESET_COLORS.length];
    const newTier: TierRow = {
      id: `tier-${Date.now()}`,
      label: nextLabel,
      color,
      items: [],
    };
    addTier(newTier);
    setLabelValues((prev) => ({ ...prev, [newTier.id]: newTier.label }));
  };

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
          <h2 className="text-lg font-semibold">Tier Settings</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tier list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50 hover:border-border transition-colors"
            >
              {/* Color badge preview */}
              <div
                className="w-10 h-10 rounded-md shrink-0 border border-black/10"
                style={{ backgroundColor: tier.color }}
              />

              {/* Label input */}
              <div className="flex flex-col gap-0.5 shrink-0 w-20">
                <textarea
                  value={labelValues[tier.id] ?? tier.label}
                  rows={1}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLabelValues((prev) => ({ ...prev, [tier.id]: val }));
                    if (val.trim()) {
                      setLabelErrors((prev) => ({ ...prev, [tier.id]: false }));
                      renameTier(tier.id, val.trim());
                    } else {
                      setLabelErrors((prev) => ({ ...prev, [tier.id]: true }));
                    }
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onBlur={() => {
                    const val = (labelValues[tier.id] ?? tier.label).trim();
                    if (!val)
                      setLabelErrors((prev) => ({ ...prev, [tier.id]: true }));
                  }}
                  className={`w-full px-2 py-1.5 bg-background border rounded-md text-sm font-bold text-center outline-none focus:ring-2 transition-all resize-none overflow-hidden ${
                    labelErrors[tier.id]
                      ? "border-destructive focus:ring-destructive"
                      : "border-border focus:ring-ring"
                  }`}
                  placeholder="Label"
                />
                {labelErrors[tier.id] && (
                  <p className="text-[10px] text-destructive whitespace-nowrap">
                    ใส่อย่างน้อย 1 ตัวอักษร
                  </p>
                )}
              </div>

              {/* Color swatches */}
              <div className="flex flex-wrap gap-1 flex-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setTierColor(tier.id, c)}
                    title={c}
                    className={`w-6 h-6 rounded-sm border transition-transform hover:scale-110 ${
                      tier.color === c
                        ? "border-foreground ring-2 ring-foreground/30 scale-110"
                        : "border-border/40"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                {/* Custom color */}
                <label
                  className="w-6 h-6 rounded-sm border border-dashed border-border flex items-center justify-center cursor-pointer text-[10px] text-muted-foreground hover:scale-110 transition-transform"
                  title="Custom color"
                >
                  +
                  <input
                    type="color"
                    className="sr-only"
                    value={tier.color}
                    onChange={(e) => setTierColor(tier.id, e.target.value)}
                  />
                </label>
              </div>

              {/* Item count badge */}
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                {tier.items.length} items
              </span>

              {/* Delete */}
              <button
                onClick={() => removeTier(tier.id)}
                className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
                aria-label={`Remove tier ${tier.label}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {tiers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No tiers yet. Add one below.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddTier}
            className="gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Add Tier
          </Button>
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
