import { z } from "zod";
import type { PictureRevealContentFormState } from "@/lib/picture-reveal-content-form";
import {
  CreatePictureRevealGameSchema,
  SavePictureRevealGameContentSchema,
  type CreatePictureRevealGameInput,
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

export function formatPictureRevealAspectRatio(width: number, height: number) {
  const gcd = (left: number, right: number): number =>
    right === 0 ? left : gcd(right, left % right);
  const divisor = gcd(width, height);

  return `${width / divisor}:${height / divisor}`;
}

export function formatDateTime(dateString: string | null) {
  if (!dateString) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

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

export async function readJsonOrNull(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

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

export function buildPictureRevealSettingsPayload(
  values: UpdatePictureRevealGameInput,
) {
  return {
    ...values,
    title: values.title?.trim(),
    description: values.description?.trim() ?? "",
  } satisfies UpdatePictureRevealGameInput;
}
