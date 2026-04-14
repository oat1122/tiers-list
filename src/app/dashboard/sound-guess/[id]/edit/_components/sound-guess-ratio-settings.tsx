"use client";

import { memo, type Dispatch, type SetStateAction } from "react";
import { Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoHint } from "@/components/ui/info-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { UseFormRegisterReturn } from "react-hook-form";
import type { soundGuessImageRatioPresets } from "@/app/dashboard/sound-guess/_components/sound-guess-admin.utils";

type SoundGuessRatioPreset = (typeof soundGuessImageRatioPresets)[number];

interface SoundGuessRatioSettingsProps {
  activeRatio?: SoundGuessRatioPreset["key"];
  imageWidthError?: string;
  imageHeightError?: string;
  imageWidthField: UseFormRegisterReturn;
  imageHeightField: UseFormRegisterReturn;
  parsedImageWidth: number;
  parsedImageHeight: number;
  presets: readonly SoundGuessRatioPreset[];
  ratioEditingEnabled: boolean;
  setRatioEditingEnabled: Dispatch<SetStateAction<boolean>>;
  applyRatioPreset: (preset: SoundGuessRatioPreset) => void;
}

/**
 * Renders cover ratio preset and manual size controls for the content editor.
 *
 * @param props - Current ratio state, field bindings, validation messages, and preset actions.
 * @returns Ratio settings panel for the sound guess content form.
 */
function SoundGuessRatioSettingsComponent({
  activeRatio,
  imageWidthError,
  imageHeightError,
  imageWidthField,
  imageHeightField,
  parsedImageWidth,
  parsedImageHeight,
  presets,
  ratioEditingEnabled,
  setRatioEditingEnabled,
  applyRatioPreset,
}: SoundGuessRatioSettingsProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Label>รูปแบบขนาดสัดส่วน (Ratio)</Label>
            <InfoHint label="Ratio presets">
              <span>
                เลือกสัดส่วนจากรูปแบบสำเร็จรูป หรือปลดล็อกเพื่อแก้ไขขนาดโดยกำหนดเอง
              </span>
            </InfoHint>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2">
            {ratioEditingEnabled ? (
              <LockOpen className="size-4 text-muted-foreground" />
            ) : (
              <Lock className="size-4 text-muted-foreground" />
            )}
            <Label htmlFor="toggle-ratio-editing" className="text-xs">
              อัปเดตขนาดเอง
            </Label>
            <Switch
              id="toggle-ratio-editing"
              checked={ratioEditingEnabled}
              onCheckedChange={setRatioEditingEnabled}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.key}
              type="button"
              size="sm"
              variant={activeRatio === preset.key ? "default" : "outline"}
              disabled={!ratioEditingEnabled}
              onClick={() => applyRatioPreset(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="space-y-2">
          <Label htmlFor="content-image-width">ความกว้าง (px)</Label>
          <Input
            id="content-image-width"
            type="number"
            aria-invalid={imageWidthError ? "true" : "false"}
            disabled={!ratioEditingEnabled}
            {...imageWidthField}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="content-image-height">ความสูง (px)</Label>
          <Input
            id="content-image-height"
            type="number"
            aria-invalid={imageHeightError ? "true" : "false"}
            disabled={!ratioEditingEnabled}
            {...imageHeightField}
          />
        </div>
        <div className="flex items-end">
          <div className="rounded-xl border border-border bg-background/70 px-3 py-2 text-sm text-muted-foreground">
            ขนาดปัจจุบัน: {parsedImageWidth}x{parsedImageHeight} พิกเซล
          </div>
        </div>
      </div>

      {imageWidthError || imageHeightError ? (
        <p className="text-sm text-destructive">
          {imageWidthError ?? imageHeightError}
        </p>
      ) : null}
    </div>
  );
}

export const SoundGuessRatioSettings = memo(SoundGuessRatioSettingsComponent);
