"use client";

import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { AUDIO_TIME_STEP_MS } from "./sound-guess-content-form.constants";
import { snapAudioTime } from "./sound-guess-audio-utils";

type AudioTimelineDragMode = "playhead" | "range" | "start" | "end";

interface AudioTimelineDragState {
  mode: AudioTimelineDragMode;
  pointerId: number;
  initialPointerMs: number;
  initialStartMs: number;
  initialEndMs: number;
}

interface UseAudioCropTimelineOptions {
  currentTimeMs: number;
  effectiveEndMs: number;
  maxMs: number;
  startMs: number;
  seekAudioPlayhead: (nextTimeMs: number) => void;
  updateEnd: (nextEndMs: number | null) => void;
  updateStart: (nextStartMs: number) => void;
}

/**
 * Owns pointer interaction state for the audio crop timeline.
 *
 * @param options - Current range values and callbacks that mutate the dialog's range state.
 * @returns Timeline refs and pointer handlers for the draggable timeline UI.
 */
export function useAudioCropTimeline({
  currentTimeMs,
  effectiveEndMs,
  maxMs,
  startMs,
  seekAudioPlayhead,
  updateEnd,
  updateStart,
}: UseAudioCropTimelineOptions) {
  const timelineTrackRef = useRef<HTMLDivElement | null>(null);
  const timelineInteractionRef = useRef<HTMLDivElement | null>(null);
  const timelineDragRef = useRef<AudioTimelineDragState | null>(null);

  const readTimelinePointerTime = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const trackElement = timelineTrackRef.current;

      if (!trackElement) {
        return currentTimeMs;
      }

      const trackRect = trackElement.getBoundingClientRect();

      if (trackRect.width <= 0) {
        return currentTimeMs;
      }

      const pointerOffset = Math.min(
        trackRect.width,
        Math.max(0, event.clientX - trackRect.left),
      );

      return snapAudioTime((pointerOffset / trackRect.width) * maxMs, maxMs);
    },
    [currentTimeMs, maxMs],
  );

  const beginTimelineDrag = useCallback(
    (
      mode: AudioTimelineDragMode,
      event: ReactPointerEvent<HTMLElement>,
    ) => {
      event.preventDefault();
      event.stopPropagation();

      const pointerMs = readTimelinePointerTime(event);

      timelineDragRef.current = {
        mode,
        pointerId: event.pointerId,
        initialPointerMs: pointerMs,
        initialStartMs: startMs,
        initialEndMs: effectiveEndMs,
      };

      timelineInteractionRef.current?.setPointerCapture?.(event.pointerId);

      if (mode === "playhead") {
        seekAudioPlayhead(pointerMs);
      }

      if (mode === "start") {
        updateStart(Math.min(pointerMs, effectiveEndMs - AUDIO_TIME_STEP_MS));
      }

      if (mode === "end") {
        updateEnd(Math.max(pointerMs, startMs + AUDIO_TIME_STEP_MS));
      }
    },
    [
      effectiveEndMs,
      readTimelinePointerTime,
      seekAudioPlayhead,
      startMs,
      updateEnd,
      updateStart,
    ],
  );

  const moveTimelineDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const dragState = timelineDragRef.current;

      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();

      const pointerMs = readTimelinePointerTime(event);

      if (dragState.mode === "playhead") {
        seekAudioPlayhead(pointerMs);
        return;
      }

      if (dragState.mode === "start") {
        updateStart(Math.min(pointerMs, effectiveEndMs - AUDIO_TIME_STEP_MS));
        return;
      }

      if (dragState.mode === "end") {
        updateEnd(Math.max(pointerMs, startMs + AUDIO_TIME_STEP_MS));
        return;
      }

      const segmentLengthMs = Math.max(
        AUDIO_TIME_STEP_MS,
        dragState.initialEndMs - dragState.initialStartMs,
      );
      const pointerDeltaMs = pointerMs - dragState.initialPointerMs;
      const nextStartMs = snapAudioTime(
        Math.min(
          maxMs - segmentLengthMs,
          Math.max(0, dragState.initialStartMs + pointerDeltaMs),
        ),
        maxMs,
      );

      updateStart(nextStartMs);
      updateEnd(nextStartMs + segmentLengthMs);
      seekAudioPlayhead(nextStartMs);
    },
    [
      effectiveEndMs,
      maxMs,
      readTimelinePointerTime,
      seekAudioPlayhead,
      startMs,
      updateEnd,
      updateStart,
    ],
  );

  const endTimelineDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const dragState = timelineDragRef.current;

      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      timelineDragRef.current = null;
      timelineInteractionRef.current?.releasePointerCapture?.(event.pointerId);
    },
    [],
  );

  return {
    beginTimelineDrag,
    endTimelineDrag,
    moveTimelineDrag,
    timelineInteractionRef,
    timelineTrackRef,
  };
}
