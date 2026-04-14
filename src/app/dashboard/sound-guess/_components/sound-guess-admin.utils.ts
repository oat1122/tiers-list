import { z } from "zod";
import {
  buildSoundGuessContentFormSnapshot,
  createEmptySoundGuessSoundDraft,
  normalizeSoundGuessContentInput,
  type SoundGuessContentFormState,
} from "@/lib/sound-guess-content-form";
import {
  CreateSoundGuessGameSchema,
  SaveSoundGuessGameContentSchema,
  type UpdateSoundGuessGameInput,
} from "@/lib/validations";
import type {
  SoundGuessGameContentDto,
  SoundGuessGameSummaryDto,
} from "@/types/sound-guess-admin";

export type SoundGuessStatusFilter = "all" | "draft" | "published";

export const soundGuessImageRatioPresets = [
  { key: "1:1", label: "1:1", width: 1080, height: 1080 },
  { key: "4:3", label: "4:3", width: 1440, height: 1080 },
  { key: "16:9", label: "16:9", width: 1600, height: 900 },
  { key: "9:16", label: "9:16", width: 900, height: 1600 },
] as const;

export const soundGuessStatusFilters: Array<{
  key: SoundGuessStatusFilter;
  label: string;
}> = [
  { key: "all", label: "ทั้งหมด" },
  { key: "draft", label: "Draft" },
  { key: "published", label: "Published" },
];

/**
 * Formats image dimensions as a reduced aspect-ratio label.
 *
 * @param width - Image width in pixels.
 * @param height - Image height in pixels.
 * @returns Reduced aspect-ratio label, such as 16:9.
 */
export function formatSoundGuessAspectRatio(width: number, height: number) {
  const gcd = (left: number, right: number): number =>
    right === 0 ? left : gcd(right, left % right);
  const divisor = gcd(width, height);

  return `${width / divisor}:${height / divisor}`;
}

/**
 * Formats nullable timestamps for the Thai admin dashboard.
 *
 * @param dateString - ISO date string returned by the API, or null.
 * @returns Localized date-time label, or a dash when missing.
 */
export function formatSoundGuessDateTime(dateString: string | null) {
  if (!dateString) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

/**
 * Extracts the most useful message from a sound guess API error payload.
 *
 * @param payload - Unknown JSON response returned by a sound guess endpoint.
 * @returns Human-readable error message when available, otherwise null.
 */
export function extractSoundGuessApiError(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object"
  ) {
    const nested = payload.error as {
      formErrors?: string[];
      fieldErrors?: Record<string, string[] | undefined>;
    };

    const formError = nested.formErrors?.find(Boolean);

    if (formError) {
      return formError;
    }

    const fieldError = Object.values(nested.fieldErrors ?? {})
      .flat()
      .find(Boolean);

    if (fieldError) {
      return fieldError;
    }
  }

  return null;
}

/**
 * Reads a JSON response without throwing when the body is empty or invalid.
 *
 * @param response - Fetch response returned by a sound guess API call.
 * @returns Parsed JSON payload, or null when parsing fails.
 */
export async function readSoundGuessJsonOrNull(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

/**
 * Filters admin games by keyword and publication status.
 *
 * @param games - Admin game summaries loaded from the API.
 * @param search - Keyword entered in the dashboard search box.
 * @param status - Status filter selected by the admin.
 * @returns Games matching the search and status criteria.
 */
export function filterSoundGuessGames(
  games: SoundGuessGameSummaryDto[],
  search: string,
  status: SoundGuessStatusFilter,
) {
  const keyword = search.trim().toLowerCase();

  return games.filter((game) => {
    const matchesKeyword =
      keyword.length === 0 ||
      game.title.toLowerCase().includes(keyword) ||
      (game.description ?? "").toLowerCase().includes(keyword);
    const matchesStatus = status === "all" || game.status === status;

    return matchesKeyword && matchesStatus;
  });
}

/**
 * Counts total, draft, and published games for dashboard summary cards.
 *
 * @param games - Admin game summaries loaded from the API.
 * @returns Counts grouped by dashboard status filters.
 */
export function countSoundGuessGamesByStatus(
  games: SoundGuessGameSummaryDto[],
) {
  return games.reduce(
    (counts, game) => {
      counts.total += 1;
      counts[game.status] += 1;
      return counts;
    },
    { total: 0, draft: 0, published: 0 },
  );
}

/**
 * Builds the API payload for creating a draft game from dialog values.
 *
 * @param values - Raw create-dialog values entered by the admin.
 * @returns Valid create-game payload with trimmed text and draft status.
 * @throws ZodError when the create payload is invalid.
 */
export function buildSoundGuessCreatePayload(
  values: Pick<
    z.input<typeof CreateSoundGuessGameSchema>,
    "title" | "description"
  >,
) {
  return CreateSoundGuessGameSchema.parse({
    ...values,
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    status: "draft",
  });
}

/**
 * Builds the API payload for updating sound guess settings.
 *
 * @param values - Raw settings values submitted by the editor.
 * @returns Settings update payload with normalized text fields.
 */
export function buildSoundGuessSettingsPayload(
  values: UpdateSoundGuessGameInput,
) {
  return {
    ...values,
    title: values.title?.trim(),
    description: values.description?.trim() ?? "",
  } satisfies UpdateSoundGuessGameInput;
}

/**
 * Converts saved content into initial editor form values.
 *
 * @param content - Existing game content loaded for editing, or null for defaults.
 * @returns Form state used by the sound guess content editor.
 */
export function buildSoundGuessContentDefaults(
  content?: SoundGuessGameContentDto | null,
): SoundGuessContentFormState {
  if (!content) {
    return {
      coverImagePath: null,
      coverTempUploadPath: null,
      imageWidth: 1600,
      imageHeight: 900,
      sounds: [createEmptySoundGuessSoundDraft(0)],
    };
  }

  return buildSoundGuessContentFormSnapshot({
    coverImagePath: content.coverImagePath ?? null,
    coverTempUploadPath: null,
    imageWidth: content.imageWidth,
    imageHeight: content.imageHeight,
    sounds:
      content.sounds.length === 0
        ? [createEmptySoundGuessSoundDraft(0)]
        : content.sounds.map((sound, soundIndex) => ({
            id: sound.id,
            audioPath: sound.audioPath,
            imagePath: sound.imagePath,
            answer: sound.answer,
            audioStartMs: sound.audioStartMs,
            audioEndMs: sound.audioEndMs,
            sortOrder: soundIndex,
          })),
  });
}

/**
 * Normalizes content form values and validates them against the shared API schema.
 *
 * @param values - Raw form values produced by react-hook-form.
 * @returns Valid API input with trimmed answers and sequential sort order.
 * @throws ZodError when the content violates validation rules.
 */
export function normalizeSoundGuessContentForSubmit(
  values: SoundGuessContentFormState,
) {
  return SaveSoundGuessGameContentSchema.parse(
    normalizeSoundGuessContentInput(values),
  );
}
