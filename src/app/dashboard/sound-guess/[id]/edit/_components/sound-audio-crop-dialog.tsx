"use client";

import { Music2, Scissors } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUDIO_TIME_STEP_MS } from "./sound-guess-content-form.constants";
import {
  formatAudioRangeLabel,
  formatAudioTime,
  getAudioRangeError,
  getTimelinePercent,
  parseAudioTime,
  sanitizeAudioTimeDraft,
  snapAudioTime,
} from "./sound-guess-audio-utils";
import { SoundAudioTimeline } from "./sound-audio-timeline";
import { useAudioCropTimeline } from "./use-audio-crop-timeline";
import { useRememberedAudioVolume } from "./use-remembered-audio-volume";

/**
 * Renders the modal used to choose the playable segment of an audio file.
 *
 * @param props - Dialog state, current audio source, and confirm handler.
 * @returns Portal dialog when open, otherwise null.
 */
export function SoundAudioCropDialog({
  open,
  audioPath,
  initialStartMs,
  initialEndMs,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  audioPath: string | null;
  initialStartMs: number;
  initialEndMs: number | null;
  onCancel: () => void;
  onConfirm: (range: { audioStartMs: number; audioEndMs: number | null }) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { handleVolumeChange: rememberDialogAudioVolume } =
    useRememberedAudioVolume(audioRef);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [startText, setStartText] = useState(formatAudioTime(initialStartMs));
  const [endText, setEndText] = useState(
    initialEndMs === null ? "" : formatAudioTime(initialEndMs),
  );
  const [startMs, setStartMs] = useState(initialStartMs);
  const [endMs, setEndMs] = useState(initialEndMs);
  const [currentTimeMs, setCurrentTimeMs] = useState(initialStartMs);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const maxMs = durationMs ?? Math.max(endMs ?? 0, startMs + 1000, 1000);
  const effectiveEndMs = endMs ?? maxMs;
  const selectedRangeLabel = formatAudioRangeLabel(startMs, endMs);
  const rangeError = getAudioRangeError(startMs, endMs);
  const visibleErrorMessage = errorMessage ?? rangeError;
  const startPercent = getTimelinePercent(startMs, maxMs);
  const endPercent = getTimelinePercent(effectiveEndMs, maxMs);
  const currentTimePercent = getTimelinePercent(currentTimeMs, maxMs);

  const seekAudioPlayhead = (nextTimeMs: number) => {
    const nextCurrentTimeMs = snapAudioTime(nextTimeMs, maxMs);

    setCurrentTimeMs(nextCurrentTimeMs);

    if (audioRef.current) {
      audioRef.current.currentTime = nextCurrentTimeMs / 1000;
    }
  };

  const updateStart = (
    nextStartMs: number,
    options: { syncText?: boolean } = { syncText: true },
  ) => {
    const clampedStart = Math.min(Math.max(0, nextStartMs), maxMs);

    setStartMs(clampedStart);
    if (options.syncText !== false) {
      setStartText(formatAudioTime(clampedStart));
    }
    setErrorMessage(null);
  };

  const updateEnd = (
    nextEndMs: number | null,
    options: { syncText?: boolean } = { syncText: true },
  ) => {
    if (nextEndMs === null) {
      setEndMs(null);
      if (options.syncText !== false) {
        setEndText("");
      }
      setErrorMessage(null);
      return;
    }

    const clampedEnd = Math.min(Math.max(0, nextEndMs), maxMs);

    setEndMs(clampedEnd);
    if (options.syncText !== false) {
      setEndText(formatAudioTime(clampedEnd));
    }
    setErrorMessage(null);
  };

  const setStartFromPlayhead = () => {
    updateStart(currentTimeMs);
  };

  const setEndFromPlayhead = () => {
    updateEnd(currentTimeMs);
  };

  const resetAudioRange = () => {
    updateStart(0);
    updateEnd(null);
  };

  const {
    beginTimelineDrag,
    endTimelineDrag,
    moveTimelineDrag,
    timelineInteractionRef,
    timelineTrackRef,
  } = useAudioCropTimeline({
    currentTimeMs,
    effectiveEndMs,
    maxMs,
    seekAudioPlayhead,
    startMs,
    updateEnd,
    updateStart,
  });

  if (!open || !audioPath) {
    return null;
  }

  const handlePreviewSegment = () => {
    if (rangeError) {
      setErrorMessage(rangeError);
      return;
    }

    if (!audioRef.current) {
      return;
    }

    const previewEndMs = endMs ?? maxMs;
    const previewStartMs =
      currentTimeMs >= startMs && currentTimeMs < previewEndMs
        ? currentTimeMs
        : startMs;

    audioRef.current.currentTime = previewStartMs / 1000;
    setCurrentTimeMs(previewStartMs);
    void audioRef.current.play();
  };

  const handleConfirm = () => {
    const parsedStartMs = parseAudioTime(startText);
    const parsedEndMs = endText.trim() ? parseAudioTime(endText) : null;

    if (parsedStartMs === null) {
      setErrorMessage(
        "กรุณากรอกเวลาเริ่มต้นเป็น 00:00.00 หรือวินาที เช่น 12.50",
      );
      return;
    }

    if (endText.trim() && parsedEndMs === null) {
      setErrorMessage(
        "กรุณากรอกเวลาสิ้นสุดเป็น 00:00.00 หรือวินาที เช่น 12.50",
      );
      return;
    }

    const nextStartMs = Math.min(parsedStartMs, maxMs);
    const nextEndMs = parsedEndMs === null ? null : Math.min(parsedEndMs, maxMs);
    const nextRangeError = getAudioRangeError(nextStartMs, nextEndMs);

    if (nextRangeError) {
      setErrorMessage(nextRangeError);
      return;
    }

    onConfirm({
      audioStartMs: nextStartMs,
      audioEndMs: nextEndMs,
    });
  };

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
              <Scissors className="size-4" />
              ครอปเสียงก่อนใช้งาน
            </div>
            <p className="text-sm text-muted-foreground">
              เลือกช่วงเวลาของไฟล์เสียงที่จะนำไปเล่นในเกม โดยระบบจะเก็บเวลาเริ่มต้นและเวลาสิ้นสุดไว้ ไม่ตัดไฟล์จริง
            </p>
          </div>

          {visibleErrorMessage ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {visibleErrorMessage}
            </p>
          ) : null}

          <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
            <audio
              ref={audioRef}
              controls
              src={audioPath}
              className="w-full"
              onVolumeChange={rememberDialogAudioVolume}
              onLoadedMetadata={(event) => {
                const nextDurationMs = Math.round(
                  event.currentTarget.duration * 1000,
                );

                if (Number.isFinite(nextDurationMs)) {
                  setDurationMs(nextDurationMs);
                  const nextStartMs = Math.min(startMs, nextDurationMs);

                  setStartMs(nextStartMs);
                  setStartText(formatAudioTime(nextStartMs));

                  if (endMs !== null) {
                    const nextEndMs = Math.min(endMs, nextDurationMs);

                    setEndMs(nextEndMs);
                    setEndText(formatAudioTime(nextEndMs));
                  }
                }
              }}
              onTimeUpdate={(event) => {
                setCurrentTimeMs(Math.round(event.currentTarget.currentTime * 1000));
                if (
                  endMs !== null &&
                  event.currentTarget.currentTime * 1000 >= endMs
                ) {
                  event.currentTarget.pause();
                  event.currentTarget.currentTime = startMs / 1000;
                }
              }}
            >
              <track kind="captions" />
            </audio>

            <div className="space-y-3 rounded-xl border border-border bg-background/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-foreground">ช่วงที่เลือก</span>
                <span className="rounded-lg border border-border bg-background px-2 py-1 text-muted-foreground">
                  {selectedRangeLabel}
                </span>
              </div>

              <SoundAudioTimeline
                beginTimelineDrag={beginTimelineDrag}
                currentTimePercent={currentTimePercent}
                endMs={endMs}
                endPercent={endPercent}
                endTimelineDrag={endTimelineDrag}
                moveTimelineDrag={moveTimelineDrag}
                startMs={startMs}
                startPercent={startPercent}
                timelineInteractionRef={timelineInteractionRef}
                timelineTrackRef={timelineTrackRef}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sound-audio-start-range">เวลาเริ่มต้น</Label>
                  <input
                    id="sound-audio-start-range"
                    type="range"
                    min="0"
                    max={maxMs}
                    step={AUDIO_TIME_STEP_MS}
                    value={startMs}
                    onChange={(event) => updateStart(Number(event.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sound-audio-end-range">เวลาสิ้นสุด</Label>
                  <input
                    id="sound-audio-end-range"
                    type="range"
                    min="0"
                    max={maxMs}
                    step={AUDIO_TIME_STEP_MS}
                    value={effectiveEndMs}
                    onChange={(event) => updateEnd(Number(event.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={setStartFromPlayhead}
                >
                  ตั้ง In จากหัวเล่น
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={setEndFromPlayhead}
                >
                  ตั้ง Out จากหัวเล่น
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetAudioRange}
                >
                  เล่นทั้งไฟล์
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-5">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-semibold text-foreground">
              ผลลัพธ์ที่จะใช้
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedRangeLabel}
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-background/60 p-4">
            <div className="space-y-2">
              <Label htmlFor="sound-audio-start-input">เวลาเริ่มต้น</Label>
              <Input
                id="sound-audio-start-input"
                inputMode="decimal"
                placeholder="00:00.00"
                aria-invalid={visibleErrorMessage ? "true" : "false"}
                value={startText}
                onChange={(event) => {
                  const nextValue = sanitizeAudioTimeDraft(event.target.value);
                  const parsed = parseAudioTime(nextValue);

                  setStartText(nextValue);

                  if (parsed !== null) {
                    updateStart(parsed, { syncText: false });
                  } else {
                    setErrorMessage(
                      "กรุณากรอกเวลาเริ่มต้นเป็น 00:00.00 หรือวินาที เช่น 12.50",
                    );
                  }
                }}
                onBlur={() => {
                  const parsed = parseAudioTime(startText);

                  if (parsed === null) {
                    setStartText(formatAudioTime(startMs));
                    return;
                  }

                  const nextStartMs = Math.min(parsed, maxMs);

                  setStartText(formatAudioTime(nextStartMs));
                  updateStart(nextStartMs, { syncText: false });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sound-audio-end-input">เวลาสิ้นสุด</Label>
              <Input
                id="sound-audio-end-input"
                inputMode="decimal"
                placeholder="เว้นว่างเพื่อเล่นถึงจบไฟล์"
                aria-invalid={visibleErrorMessage ? "true" : "false"}
                value={endText}
                onChange={(event) => {
                  const nextValue = sanitizeAudioTimeDraft(event.target.value);
                  const parsed = parseAudioTime(nextValue);

                  setEndText(nextValue);

                  if (!nextValue.trim()) {
                    updateEnd(null, { syncText: false });
                    return;
                  }

                  if (parsed !== null) {
                    updateEnd(parsed, { syncText: false });
                  } else {
                    setErrorMessage(
                      "กรุณากรอกเวลาสิ้นสุดเป็น 00:00.00 หรือวินาที เช่น 12.50",
                    );
                  }
                }}
                onBlur={() => {
                  if (!endText.trim()) {
                    updateEnd(null);
                    return;
                  }

                  const parsed = parseAudioTime(endText);

                  if (parsed === null) {
                    setEndText(endMs === null ? "" : formatAudioTime(endMs));
                    return;
                  }

                  const nextEndMs = Math.min(parsed, maxMs);

                  setEndText(formatAudioTime(nextEndMs));
                  updateEnd(nextEndMs, { syncText: false });
                }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            <p>คำแนะนำ</p>
            <p className="mt-1">
              กดทดลองฟังช่วงที่เลือกก่อนบันทึก เพื่อให้มั่นใจว่าจุดเริ่มและจุดจบตรงกับเสียงที่ต้องการให้ผู้เล่นได้ยิน
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              ยกเลิก
            </Button>
            <Button variant="outline" onClick={handlePreviewSegment}>
              <Music2 className="size-4" />
              ทดลองฟัง
            </Button>
            <Button onClick={handleConfirm}>ใช้ช่วงเสียงนี้</Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
