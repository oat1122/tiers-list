"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import {
  ArrowLeft,
  Download,
  ImagePlus,
  PlusCircle,
  RotateCcw,
  Save,
  Settings2,
} from "lucide-react";
import { AddItemDialog } from "@/components/add-item-dialog";
import { ItemSettingsDialog } from "@/components/item-settings-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { TierSettingsDialog } from "@/components/tier-settings-dialog";
import { Button } from "@/components/ui/button";
import { useTierStore } from "@/store/useTierStore";
import { useUIStore } from "@/store/useUIStore";
import { TierRow } from "@/types";

interface ToolbarProps {
  captureRef: React.RefObject<HTMLDivElement | null>;
  mode?: "local" | "template";
  listId?: string;
  backHref?: string;
  onBeforeNavigate?: () => Promise<boolean> | boolean;
  onBeforeReset?: () => Promise<boolean> | boolean;
  onSave?: () => Promise<void>;
  isDirty?: boolean;
  isSaving?: boolean;
  saveStatusText?: string | null;
}

const TIER_COLORS = [
  "#ff7f7f",
  "#ffbf7f",
  "#ffdf7f",
  "#bfff7f",
  "#7fbfff",
  "#cf7fff",
];

const TIER_LABELS = ["S", "A", "B", "C", "D", "E", "F", "G"];

export function Toolbar({
  captureRef,
  mode = "local",
  listId,
  backHref,
  onBeforeNavigate,
  onBeforeReset,
  onSave,
  isDirty = false,
  isSaving = false,
  saveStatusText,
}: ToolbarProps) {
  const router = useRouter();
  const { tiers, addTier, reset } = useTierStore();
  const {
    title,
    isAddItemOpen,
    isTierSettingsOpen,
    isItemSettingsOpen,
    isExporting,
    setAddItemOpen,
    setTierSettingsOpen,
    setItemSettingsOpen,
    setExporting,
    resetTitle,
  } = useUIStore();
  const handleAddTier = () => {
    const usedLabels = new Set(tiers.map((tier) => tier.label));
    const nextLabel =
      TIER_LABELS.find((label) => !usedLabels.has(label)) ??
      `T${tiers.length + 1}`;
    const color = TIER_COLORS[tiers.length % TIER_COLORS.length];
    const newTier: TierRow = {
      id: `tier-${Date.now()}`,
      label: nextLabel,
      color,
      items: [],
    };

    addTier(newTier);
  };

  const handleExport = async () => {
    if (!captureRef.current) return;

    setExporting(true);
    const exportOnlyElements =
      captureRef.current.querySelectorAll<HTMLElement>("[data-export-only]");
    exportOnlyElements.forEach((element) => element.classList.remove("hidden"));

    try {
      const dataUrl = await toPng(captureRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: undefined,
      });
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      const safeName =
        title
          .trim()
          .replace(/[/\\:*?"<>|]/g, "")
          .replace(/\s+/g, "-") || "tier-list";
      anchor.download = `${safeName}.png`;
      anchor.click();
    } finally {
      exportOnlyElements.forEach((element) => element.classList.add("hidden"));
      setExporting(false);
    }
  };

  const handleReset = async () => {
    if (onBeforeReset && !(await onBeforeReset())) {
      return;
    }

    reset();
    resetTitle();
  };

  const handleSave = async () => {
    if (!onSave || isSaving) return;
    await onSave();
  };

  const renderBackButton = () => {
    if (!backHref) {
      return (
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Link>
      );
    }

    return (
        <button
          type="button"
          onClick={async () => {
            if (onBeforeNavigate && !(await onBeforeNavigate())) {
              return;
            }

            router.push(backHref);
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
            {renderBackButton()}

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddTier}
              className="gap-1.5 px-2 sm:px-2.5"
              title="Add Tier"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Add Tier</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddItemOpen(true)}
              className="gap-1.5 px-2 sm:px-2.5"
              title="Add Item"
            >
              <ImagePlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Item</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setTierSettingsOpen(true)}
              className="gap-1.5 px-2 sm:px-2.5"
              title="Tier Settings"
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Tier Settings</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setItemSettingsOpen(true)}
              className="gap-1.5 px-2 sm:px-2.5"
              title="Item Settings"
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Item Settings</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleReset()}
              className="gap-1.5 px-2 text-muted-foreground hover:text-foreground sm:px-2.5"
              title="Reset"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">
            {mode === "template" ? (
              <Button
                size="sm"
                onClick={() => void handleSave()}
                disabled={isSaving || !isDirty}
                className="gap-1.5 px-2 sm:px-2.5"
                title="Save Template"
              >
                {isSaving ? (
                  <RotateCcw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Save</span>
              </Button>
            ) : null}

            <Button
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="gap-1.5 px-2 sm:px-2.5"
              title="Export PNG"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isExporting ? "Exporting..." : "Export PNG"}
              </span>
            </Button>

            <ThemeToggle />
          </div>
        </div>

        {mode === "template" && saveStatusText ? (
          <p className="text-center text-xs text-muted-foreground sm:text-right">
            {saveStatusText}
          </p>
        ) : null}
      </div>

      <AddItemDialog
        open={isAddItemOpen}
        onClose={() => setAddItemOpen(false)}
        uploadContext={
          mode === "template" && listId ? { listId } : undefined
        }
      />
      <TierSettingsDialog
        open={isTierSettingsOpen}
        onClose={() => setTierSettingsOpen(false)}
      />
      <ItemSettingsDialog
        open={isItemSettingsOpen}
        onClose={() => setItemSettingsOpen(false)}
      />
    </>
  );
}
