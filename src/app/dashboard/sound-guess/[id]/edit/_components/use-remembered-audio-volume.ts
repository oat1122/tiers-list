"use client";

import { useEffect, type RefObject, type SyntheticEvent } from "react";
import {
  readRememberedAudioVolume,
  rememberAudioVolume,
} from "./sound-guess-audio-utils";

/**
 * Applies and remembers the shared admin audio volume for one audio element.
 *
 * @param audioRef - Ref pointing at an audio element rendered by the editor.
 * @returns Event handler to attach to the audio element's volumechange event.
 */
export function useRememberedAudioVolume(
  audioRef: RefObject<HTMLAudioElement | null>,
) {
  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    audioElement.volume = readRememberedAudioVolume();
  });

  return (event: SyntheticEvent<HTMLAudioElement>) => {
    rememberAudioVolume(event.currentTarget.volume);
  };
}
