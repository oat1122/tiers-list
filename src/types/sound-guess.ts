export const soundGuessGameStatuses = ["draft", "published"] as const;
export type SoundGuessGameStatus = (typeof soundGuessGameStatuses)[number];

