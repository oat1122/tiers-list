import { z } from "zod";
import type { PictureRevealContentFormState } from "@/lib/picture-reveal-content-form";
import {
  CreatePictureRevealGameSchema,
  SavePictureRevealGameContentSchema,
  type SavePictureRevealGameContentInput,
  type UpdatePictureRevealGameInput,
} from "@/lib/validations";
import type {
  PictureRevealGameContentDto,
  PictureRevealGameSummaryDto,
} from "@/types/picture-reveal-admin";

export type PictureRevealStatusFilter = "all" | "draft" | "published";

export const pictureRevealStatusFilters: Array<{
  key: PictureRevealStatusFilter;
  label: string;
}> = [
  { key: "all", label: "ทั้งหมด" },
  { key: "draft", label: "Draft" },
  { key: "published", label: "Published" },
];

export const pictureRevealSpecialPatternOptions = [
  {
    value: "plus",
    label: "plus",
    description: "Open the orthogonal neighbor tiles around the special tile.",
  },
  {
    value: "diagonal",
    label: "diagonal",
    description: "Open the diagonal neighbor tiles around the special tile.",
  },
  {
    value: "ring",
    label: "ring",
    description: "Open every tile directly surrounding the special tile.",
  },
  {
    value: "wide-plus",
    label: "wide-plus",
    description: "Open tiles two steps away in each cardinal direction.",
  },
] as const;

export const pictureRevealImageRatioPresets = [
  {
    key: "square",
    label: "1:1",
    description: "Balanced for centered subjects and posters.",
    width: 1080,
    height: 1080,
  },
  {
    key: "classic",
    label: "4:3",
    description: "A flexible default for general images.",
    width: 1440,
    height: 1080,
  },
  {
    key: "widescreen",
    label: "16:9",
    description: "Best for landscapes and wide compositions.",
    width: 1920,
    height: 1080,
  },
  {
    key: "vertical",
    label: "9:16",
    description: "Best for portrait and mobile-first artwork.",
    width: 1080,
    height: 1920,
  },
] as const;

export const pictureRevealImageSizeExamples = [
  { key: "sq-sm", label: "1080x1080", width: 1080, height: 1080 },
  { key: "sq-lg", label: "2048x2048", width: 2048, height: 2048 },
  { key: "wide-hd", label: "1920x1080", width: 1920, height: 1080 },
  { key: "wide-2k", label: "2560x1440", width: 2560, height: 1440 },
  { key: "portrait-hd", label: "1080x1920", width: 1080, height: 1920 },
  { key: "portrait-2k", label: "1440x2560", width: 1440, height: 2560 },
] as const;

/**
 * Formats a width and height as a reduced aspect ratio label.
 *
 * @param width - Image width in pixels.
 * @param height - Image height in pixels.
 * @returns Aspect ratio label such as 16:9.
 */
export function formatPictureRevealAspectRatio(width: number, height: number) {
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
export function formatDateTime(dateString: string | null) {
  if (!dateString) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

/**
 * Extracts the most useful message from a picture reveal API error payload.
 *
 * @param payload - Unknown JSON response returned by a picture reveal endpoint.
 * @returns Human-readable error message when available, otherwise null.
 */
export function extractPictureRevealApiError(payload: unknown) {
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
 * @param response - Fetch response returned by a picture reveal API call.
 * @returns Parsed JSON payload, or null when parsing fails.
 */
export async function readJsonOrNull(response: Response) {
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
export function filterPictureRevealGames(
  games: PictureRevealGameSummaryDto[],
  search: string,
  status: PictureRevealStatusFilter,
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
export function countPictureRevealGamesByStatus(
  games: PictureRevealGameSummaryDto[],
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
 * Creates a default image draft for the remote content editor.
 *
 * @param sortOrder - Position of the new image in the editor list.
 * @returns Image draft with default board and special tile settings.
 */
export function createEmptyImageDraft(sortOrder: number) {
  return {
    id: crypto.randomUUID(),
    rows: 4,
    cols: 6,
    answer: "",
    specialTileCount: 1,
    specialPattern: "plus",
    sortOrder,
  } satisfies SavePictureRevealGameContentInput["images"][number];
}

/**
 * Converts saved content into initial editor form values.
 *
 * @param content - Existing game content loaded for editing, or null for a new draft.
 * @returns Form state used by the picture reveal content editor.
 */
export function buildPictureRevealContentDefaults(
  content?: PictureRevealGameContentDto | null,
): PictureRevealContentFormState {
  if (!content) {
    return {
      coverImagePath: null,
      coverTempUploadPath: null,
      coverAssetId: null,
      imageWidth: 1080,
      imageHeight: 1080,
      images: [createEmptyImageDraft(0)],
    };
  }

  return {
    coverImagePath: content.coverImagePath ?? null,
    coverTempUploadPath: null,
    coverAssetId: null,
    imageWidth: content.imageWidth ?? 1080,
    imageHeight: content.imageHeight ?? 1080,
    images: content.images.map((image, imageIndex) => ({
      id: image.id,
      imagePath: image.imagePath,
      originalImagePath: image.originalImagePath ?? undefined,
      imageAssetId: null,
      originalImageAssetId: null,
      answer: image.answer,
      rows: image.rows,
      cols: image.cols,
      specialTileCount: image.specialTileCount,
      specialPattern: image.specialPattern,
      sortOrder: imageIndex,
    })),
  };
}

/**
 * Normalizes content form values before submitting them to the API.
 *
 * @param values - Raw form values produced by react-hook-form.
 * @returns Valid API input with trimmed answers and sequential sort order.
 * @throws ZodError when the content violates validation rules.
 */
export function normalizePictureRevealContentInput(
  values: z.input<typeof SavePictureRevealGameContentSchema>,
): SavePictureRevealGameContentInput {
  return SavePictureRevealGameContentSchema.parse({
    coverImagePath: values.coverImagePath ?? null,
    coverTempUploadPath: values.coverTempUploadPath ?? null,
    imageWidth: values.imageWidth,
    imageHeight: values.imageHeight,
    images: values.images.map((image, imageIndex) => ({
      ...image,
      answer: image.answer.trim(),
      sortOrder: imageIndex,
    })),
  });
}

/**
 * Builds the API payload for creating a draft game from dialog values.
 *
 * @param values - Raw create-dialog values entered by the admin.
 * @returns Valid create-game payload with trimmed text and draft status.
 * @throws ZodError when the create payload is invalid.
 */
export function buildPictureRevealCreatePayload(
  values: Pick<
    z.input<typeof CreatePictureRevealGameSchema>,
    | "title"
    | "description"
    | "mode"
    | "startScore"
    | "openTilePenalty"
    | "specialTilePenalty"
  >,
) {
  return CreatePictureRevealGameSchema.parse({
    ...values,
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    status: "draft",
  });
}

/**
 * Builds the API payload for updating picture reveal settings.
 *
 * @param values - Raw settings values submitted by the editor.
 * @returns Settings update payload with normalized text fields.
 */
export function buildPictureRevealSettingsPayload(
  values: UpdatePictureRevealGameInput,
) {
  return {
    ...values,
    title: values.title?.trim(),
    description: values.description?.trim() ?? "",
  } satisfies UpdatePictureRevealGameInput;
}
