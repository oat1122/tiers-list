import type { AdminTierListSummaryDto } from "@/types/admin-dashboard";
import type {
  FormState,
  PaginatedListSection,
  StatusFilter,
  StatusFilterOption,
} from "./dashboard-panel.types";

export const DASHBOARD_LISTS_PER_PAGE = 5;

export const statusFilters: StatusFilterOption[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "public", label: "สาธารณะ" },
  { key: "private", label: "ส่วนตัว" },
  { key: "template", label: "เทมเพลต" },
];

export const emptyFormState: FormState = {
  title: "",
  description: "",
  isPublic: false,
  isTemplate: false,
};

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "เกิดข้อผิดพลาดที่ไม่คาดคิด";
}

export function extractApiError(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
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

export function buildFormState(list?: AdminTierListSummaryDto): FormState {
  if (!list) {
    return { ...emptyFormState };
  }

  return {
    title: list.title,
    description: list.description ?? "",
    isPublic: list.isPublic === 1,
    isTemplate: list.isTemplate === 1,
  };
}

export function matchesFilter(
  list: AdminTierListSummaryDto,
  filter: StatusFilter,
) {
  if (filter === "all") return true;
  if (filter === "public") return list.isPublic === 1;
  if (filter === "private") return list.isPublic === 0;
  return list.isTemplate === 1;
}

export function filterActiveLists(
  lists: AdminTierListSummaryDto[],
  search: string,
  statusFilter: StatusFilter,
) {
  const keyword = search.trim().toLowerCase();

  return lists.filter((list) => {
    const matchesKeyword =
      keyword.length === 0 ||
      list.title.toLowerCase().includes(keyword) ||
      (list.description ?? "").toLowerCase().includes(keyword) ||
      list.owner.name.toLowerCase().includes(keyword) ||
      list.owner.email.toLowerCase().includes(keyword);

    return matchesKeyword && matchesFilter(list, statusFilter);
  });
}

export function filterListsBySearch(
  lists: AdminTierListSummaryDto[],
  search: string,
) {
  const keyword = search.trim().toLowerCase();

  return lists.filter((list) => {
    return (
      keyword.length === 0 ||
      list.title.toLowerCase().includes(keyword) ||
      (list.description ?? "").toLowerCase().includes(keyword) ||
      list.owner.name.toLowerCase().includes(keyword) ||
      list.owner.email.toLowerCase().includes(keyword)
    );
  });
}

export function paginateLists(
  lists: AdminTierListSummaryDto[],
  page: number,
  pageSize = DASHBOARD_LISTS_PER_PAGE,
): PaginatedListSection {
  const totalItems = lists.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    items: lists.slice(startIndex, startIndex + pageSize),
    currentPage,
    totalPages,
    totalItems,
    pageSize,
  };
}

export function buildVisiblePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible = 5,
) {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const halfWindow = Math.floor(maxVisible / 2);
  const startPage = Math.max(
    1,
    Math.min(currentPage - halfWindow, totalPages - maxVisible + 1),
  );

  return Array.from({ length: maxVisible }, (_, index) => startPage + index);
}
