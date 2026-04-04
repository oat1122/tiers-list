import { z } from "zod";
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
    description:
      "เปิดช่องรอบจุดพิเศษเป็นรูปกากบาท ทำให้เห็นทั้งแนวตั้งและแนวนอนมากขึ้น",
  },
  {
    value: "diagonal",
    label: "diagonal",
    description:
      "เปิดช่องตามแนวทแยงจากจุดพิเศษ ช่วยให้เห็นมุมของภาพได้เร็วขึ้น",
  },
  {
    value: "ring",
    label: "ring",
    description:
      "เปิดช่องเป็นวงล้อมรอบจุดพิเศษ ทำให้เห็นพื้นที่รอบ ๆ พร้อมกัน",
  },
  {
    value: "wide-plus",
    label: "wide-plus",
    description:
      "เปิดช่องแบบกากบาทในระยะที่กว้างขึ้น เห็นพื้นที่มากขึ้น แต่จะเสียคะแนนมากกว่า",
  },
] as const;

export const pictureRevealImageRatioPresets = [
  {
    key: "square",
    label: "1:1",
    description: "เหมาะกับภาพเดี่ยว โฟกัสวัตถุหลัก",
    width: 1080,
    height: 1080,
  },
  {
    key: "classic",
    label: "4:3",
    description: "สมดุล ใช้งานง่ายกับภาพทั่วไป",
    width: 1440,
    height: 1080,
  },
  {
    key: "widescreen",
    label: "16:9",
    description: "เหมาะกับภาพกว้าง ฉากหรือวิว",
    width: 1920,
    height: 1080,
  },
  {
    key: "vertical",
    label: "9:16",
    description: "เหมาะกับภาพแนวตั้งหรือคอนเทนต์มือถือ",
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

export function createEmptyChoiceDraft(sortOrder: number) {
  return {
    label: "",
    isCorrect: sortOrder === 0 ? 1 : 0,
    sortOrder,
  } satisfies SavePictureRevealGameContentInput["images"][number]["choices"][number];
}

export function createEmptyImageDraft(sortOrder: number) {
  return {
    rows: 4,
    cols: 6,
    specialTileCount: 1,
    specialPattern: "plus",
    sortOrder,
    choices: [createEmptyChoiceDraft(0), createEmptyChoiceDraft(1)],
  } satisfies SavePictureRevealGameContentInput["images"][number];
}

export function buildPictureRevealContentDefaults(
  content?: PictureRevealGameContentDto | null,
): SavePictureRevealGameContentInput {
  if (!content) {
    return {
      imageWidth: 1080,
      imageHeight: 1080,
      images: [createEmptyImageDraft(0)],
    };
  }

  return {
    imageWidth: content.imageWidth ?? 1080,
    imageHeight: content.imageHeight ?? 1080,
    images: content.images.map((image, imageIndex) => ({
      id: image.id,
      imagePath: image.imagePath,
      originalImagePath: image.originalImagePath ?? undefined,
      rows: image.rows,
      cols: image.cols,
      specialTileCount: image.specialTileCount,
      specialPattern: image.specialPattern,
      sortOrder: imageIndex,
      choices: image.choices.map((choice, choiceIndex) => ({
        id: choice.id,
        label: choice.label,
        isCorrect: choice.isCorrect,
        sortOrder: choiceIndex,
      })),
    })),
  };
}

export function normalizePictureRevealContentInput(
  values: z.input<typeof SavePictureRevealGameContentSchema>,
): SavePictureRevealGameContentInput {
  return SavePictureRevealGameContentSchema.parse({
    imageWidth: values.imageWidth,
    imageHeight: values.imageHeight,
    images: values.images.map((image, imageIndex) => ({
      ...image,
      sortOrder: imageIndex,
      choices: image.choices.map((choice, choiceIndex) => ({
        ...choice,
        label: choice.label.trim(),
        sortOrder: choiceIndex,
      })),
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
