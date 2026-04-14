"use client";

import { memo, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { formatAudioTime } from "./sound-guess-audio-utils";

type AudioTimelineDragMode = "playhead" | "range" | "start" | "end";

interface SoundAudioTimelineProps {
  currentTimePercent: number;
  endMs: number | null;
  endPercent: number;
  startMs: number;
  startPercent: number;
  timelineInteractionRef: RefObject<HTMLDivElement | null>;
  timelineTrackRef: RefObject<HTMLDivElement | null>;
  beginTimelineDrag: (
    mode: AudioTimelineDragMode,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  moveTimelineDrag: (event: ReactPointerEvent<HTMLDivElement>) => void;
  endTimelineDrag: (event: ReactPointerEvent<HTMLDivElement>) => void;
}

/**
 * Renders the draggable audio crop timeline without owning range state.
 *
 * @param props - Timeline percentages, refs, and drag handlers owned by the dialog.
 * @returns Timeline interaction surface for the audio crop dialog.
 */
function SoundAudioTimelineComponent({
  currentTimePercent,
  endMs,
  endPercent,
  startMs,
  startPercent,
  timelineInteractionRef,
  timelineTrackRef,
  beginTimelineDrag,
  moveTimelineDrag,
  endTimelineDrag,
}: SoundAudioTimelineProps) {
  return (
    <div
      ref={timelineInteractionRef}
      data-testid="sound-audio-timeline"
      className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur"
      onPointerDown={(event) => beginTimelineDrag("playhead", event)}
      onPointerMove={moveTimelineDrag}
      onPointerUp={endTimelineDrag}
      onPointerCancel={endTimelineDrag}
    >
      <div className="mb-4 flex items-center justify-between gap-3 text-xs">
        <span className="rounded-full border border-border/60 bg-muted/60 px-3 py-1 font-medium text-foreground/80">
          In {formatAudioTime(startMs)}
        </span>
        <span className="rounded-full border border-border/60 bg-muted/60 px-3 py-1 font-medium text-foreground/80">
          Out {endMs === null ? "เธเธเนเธเธฅเน" : formatAudioTime(endMs)}
        </span>
      </div>
      <div className="relative h-16 px-1">
        <div
          ref={timelineTrackRef}
          data-testid="sound-audio-timeline-track"
          className="absolute inset-x-0 top-6 h-2.5 rounded-full bg-gradient-to-r from-muted/80 via-muted to-muted/80 shadow-inner ring-1 ring-border/60"
        >
          <button
            type="button"
            aria-label="ย้ายช่วงเสียง"
            className="absolute -top-1 z-10 h-4 rounded-full border border-primary/30 bg-primary/20 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_4px_14px_rgba(0,0,0,0.18)] outline-none transition-all hover:bg-primary/25 focus-visible:ring-2 focus-visible:ring-ring/60 active:cursor-grabbing active:bg-primary/30"
            style={{
              left: `${startPercent}%`,
              width: `${Math.max(0.75, endPercent - startPercent)}%`,
            }}
            onPointerDown={(event) => beginTimelineDrag("range", event)}
          />
          <button
            type="button"
            aria-label="ย่อขยายเวลาเริ่มต้น"
            className="absolute top-1/2 z-20 flex h-8 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background/95 shadow-md outline-none backdrop-blur-sm transition-all hover:-translate-y-[55%] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring/60 active:cursor-ew-resize active:scale-95"
            style={{ left: `${startPercent}%` }}
            onPointerDown={(event) => beginTimelineDrag("start", event)}
          >
            <span className="flex gap-0.5">
              <span className="h-3.5 w-0.5 rounded-full bg-foreground/55" />
              <span className="h-3.5 w-0.5 rounded-full bg-foreground/75" />
            </span>
          </button>
          <button
            type="button"
            aria-label="ย่อขยายเวลาสิ้นสุด"
            className="absolute top-1/2 z-20 flex h-8 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background/95 shadow-md outline-none backdrop-blur-sm transition-all hover:-translate-y-[55%] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring/60 active:cursor-ew-resize active:scale-95"
            style={{ left: `${endPercent}%` }}
            onPointerDown={(event) => beginTimelineDrag("end", event)}
          >
            <span className="flex gap-0.5">
              <span className="h-3.5 w-0.5 rounded-full bg-foreground/75" />
              <span className="h-3.5 w-0.5 rounded-full bg-foreground/55" />
            </span>
          </button>
          <button
            type="button"
            aria-label="เลื่อนหัวเล่น"
            className="absolute top-1/2 z-30 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-background/40 bg-foreground shadow-lg outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring/60 active:cursor-ew-resize active:scale-95"
            style={{ left: `${currentTimePercent}%` }}
            onPointerDown={(event) => beginTimelineDrag("playhead", event)}
          >
            <span className="h-4 w-0.5 rounded-full bg-background" />
          </button>
        </div>
        <div className="absolute inset-x-1 bottom-1 flex justify-between">
          {Array.from({ length: 9 }).map((_, tickIndex) => (
            <span
              key={tickIndex}
              className="h-1.5 w-px rounded-full bg-muted-foreground/30"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const SoundAudioTimeline = memo(SoundAudioTimelineComponent);
