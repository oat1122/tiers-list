"use client";

import { toPng } from "html-to-image";
import { useTierStore } from "@/store/useTierStore";
import { useUIStore } from "@/store/useUIStore";
import { Button } from "@/components/ui/button";
import { AddItemDialog } from "@/components/add-item-dialog";
import { TierSettingsDialog } from "@/components/tier-settings-dialog";
import { ItemSettingsDialog } from "@/components/item-settings-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { TierRow } from "@/types";
import {
  PlusCircle,
  ImagePlus,
  RotateCcw,
  Download,
  Settings2,
  ArrowLeft,
} from "lucide-react";

interface ToolbarProps {
  captureRef: React.RefObject<HTMLDivElement | null>;
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

export function Toolbar({ captureRef }: ToolbarProps) {
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
  } = useUIStore();

  const handleAddTier = () => {
    const usedLabels = new Set(tiers.map((t) => t.label));
    const nextLabel =
      TIER_LABELS.find((l) => !usedLabels.has(l)) ?? `T${tiers.length + 1}`;
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
    const exportOnlyEls =
      captureRef.current.querySelectorAll<HTMLElement>("[data-export-only]");
    exportOnlyEls.forEach((el) => el.classList.remove("hidden"));
    try {
      const dataUrl = await toPng(captureRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: undefined,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      const safeName =
        title
          .trim()
          .replace(/[/\\:*?"<>|]/g, "")
          .replace(/\s+/g, "-") || "tier-list";
      a.download = `${safeName}.png`;
      a.click();
    } finally {
      exportOnlyEls.forEach((el) => el.classList.add("hidden"));
      setExporting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        {process.env.HOME_URL && (
          <a
            href={`https://${process.env.HOME_URL}`}
            className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md border border-border bg-background text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </a>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddTier}
          className="gap-1.5 px-2 sm:px-2.5"
          title="Add Tier"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Add Tier</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddItemOpen(true)}
          className="gap-1.5 px-2 sm:px-2.5"
          title="Add Item"
        >
          <ImagePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Item</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTierSettingsOpen(true)}
          className="gap-1.5 px-2 sm:px-2.5"
          title="Tier Settings"
        >
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Tier Settings</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setItemSettingsOpen(true)}
          className="gap-1.5 px-2 sm:px-2.5"
          title="Item Settings"
        >
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Item Settings</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="gap-1.5 px-2 sm:px-2.5 text-muted-foreground hover:text-foreground"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
        <Button
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-1.5 ml-auto px-2 sm:px-2.5"
          title="Export PNG"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isExporting ? "Exporting…" : "Export PNG"}
          </span>
        </Button>
        <ThemeToggle />
      </div>

      <AddItemDialog open={isAddItemOpen} onClose={() => setAddItemOpen(false)} />
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
