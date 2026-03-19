'use client';

import { useState } from 'react';
import { toPng } from 'html-to-image';
import { useTierStore } from '@/store/useTierStore';
import { Button } from '@/components/ui/button';
import { AddItemDialog } from '@/components/add-item-dialog';
import { TierSettingsDialog } from '@/components/tier-settings-dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { TierRow } from '@/types';
import { PlusCircle, ImagePlus, RotateCcw, Download, Settings2 } from 'lucide-react';

interface ToolbarProps {
  captureRef: React.RefObject<HTMLDivElement | null>;
}

const TIER_COLORS = ['#ff7f7f', '#ffbf7f', '#ffdf7f', '#bfff7f', '#7fbfff', '#cf7fff'];
const TIER_LABELS = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

export function Toolbar({ captureRef }: ToolbarProps) {
  const { tiers, addTier, reset } = useTierStore();
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleAddTier = () => {
    const usedLabels = new Set(tiers.map((t) => t.label));
    const nextLabel = TIER_LABELS.find((l) => !usedLabels.has(l)) ?? `T${tiers.length + 1}`;
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
    try {
      const dataUrl = await toPng(captureRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: undefined,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'tier-list.png';
      a.click();
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleAddTier} className="gap-1.5">
          <PlusCircle className="w-4 h-4" /> Add Tier
        </Button>
        <Button variant="outline" size="sm" onClick={() => setAddItemOpen(true)} className="gap-1.5">
          <ImagePlus className="w-4 h-4" /> Add Item
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSettingsOpen(true)}
          className="gap-1.5"
        >
          <Settings2 className="w-4 h-4" /> Tier Settings
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </Button>
        <Button
          size="sm"
          onClick={handleExport}
          disabled={exporting}
          className="gap-1.5 ml-auto"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting…' : 'Export PNG'}
        </Button>
        <ThemeToggle />
      </div>

      <AddItemDialog open={addItemOpen} onClose={() => setAddItemOpen(false)} />
      <TierSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
