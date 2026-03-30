"use client";

import type {
  AdminDashboardResponseDto,
  AdminTierListSummaryDto,
} from "@/types/admin-dashboard";

export type DashboardUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
};

export type FeedbackState = {
  tone: "success" | "error";
  message: string;
} | null;

export type StatusFilter = "all" | "public" | "private" | "template";

export type StatusFilterOption = {
  key: StatusFilter;
  label: string;
};

export type FormState = {
  title: string;
  description: string;
  isPublic: boolean;
  isTemplate: boolean;
};

export type FormDialogState =
  | { mode: "create"; initial: FormState }
  | { mode: "edit"; list: AdminTierListSummaryDto; initial: FormState }
  | null;

export interface DashboardPanelProps {
  user: DashboardUser;
  initialData: AdminDashboardResponseDto;
}

export interface PaginatedListSection {
  items: AdminTierListSummaryDto[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export interface DashboardPanelState {
  data: AdminDashboardResponseDto;
  filteredActive: AdminTierListSummaryDto[];
  filteredPublic: AdminTierListSummaryDto[];
  filteredTemplates: AdminTierListSummaryDto[];
  filteredDeleted: AdminTierListSummaryDto[];
  activePageData: PaginatedListSection;
  publicPageData: PaginatedListSection;
  templatePageData: PaginatedListSection;
  trashPageData: PaginatedListSection;
  formDialog: FormDialogState;
  feedback: FeedbackState;
  search: string;
  publicSearch: string;
  templateSearch: string;
  trashSearch: string;
  statusFilter: StatusFilter;
  busyAction: string | null;
  deleteTarget: AdminTierListSummaryDto | null;
  isLoggingOut: boolean;
  isPending: boolean;
}

export interface DashboardListActionHandlers {
  onEdit: (list: AdminTierListSummaryDto) => void;
  onOpenTemplateEditor: (list: AdminTierListSummaryDto) => void;
  onMakePublic: (list: AdminTierListSummaryDto) => Promise<void>;
  onClosePublic: (list: AdminTierListSummaryDto) => Promise<void>;
  onToggleTemplate: (list: AdminTierListSummaryDto) => Promise<void>;
  onClone: (list: AdminTierListSummaryDto) => Promise<void>;
  onRestore: (list: AdminTierListSummaryDto) => Promise<void>;
  onDelete: (list: AdminTierListSummaryDto) => void;
}

export interface DashboardPanelActions {
  setSearch: (value: string) => void;
  setPublicSearch: (value: string) => void;
  setTemplateSearch: (value: string) => void;
  setTrashSearch: (value: string) => void;
  setStatusFilter: (value: StatusFilter) => void;
  setActivePage: (value: number) => void;
  setPublicPage: (value: number) => void;
  setTemplatePage: (value: number) => void;
  setTrashPage: (value: number) => void;
  refreshData: (message?: string) => Promise<void>;
  openCreateTemplate: () => void;
  openEditDialog: (list: AdminTierListSummaryDto) => void;
  closeFormDialog: () => void;
  submitForm: (values: FormState) => Promise<void>;
  selectDeleteTarget: (list: AdminTierListSummaryDto) => void;
  clearDeleteTarget: () => void;
  deleteSelected: () => Promise<void>;
  makePublic: (list: AdminTierListSummaryDto) => Promise<void>;
  closePublic: (list: AdminTierListSummaryDto) => Promise<void>;
  toggleTemplate: (list: AdminTierListSummaryDto) => Promise<void>;
  restore: (list: AdminTierListSummaryDto) => Promise<void>;
  clone: (list: AdminTierListSummaryDto) => Promise<void>;
  logout: () => Promise<void>;
  openTemplateEditor: (list: AdminTierListSummaryDto) => void;
}
