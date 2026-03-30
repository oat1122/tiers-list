import type { TierPreview, TierPreviewItem, TierPreviewRow } from "./tier-preview";

export interface AdminTierListOwner {
  id: string;
  name: string;
  email: string;
}

export type AdminTierPreviewItem = TierPreviewItem;
export type AdminTierPreviewRow = TierPreviewRow;
export type AdminTierPreview = TierPreview;

export interface AdminTierListSummary {
  id: string;
  title: string;
  description: string | null;
  isPublic: number;
  isTemplate: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  itemCount: number;
  owner: AdminTierListOwner;
  preview?: AdminTierPreview | null;
}

export interface AdminDashboardStats {
  activeCount: number;
  publicCount: number;
  templateCount: number;
  deletedCount: number;
}

export interface AdminDashboardResponse {
  stats: AdminDashboardStats;
  active: AdminTierListSummary[];
  public: AdminTierListSummary[];
  templates: AdminTierListSummary[];
  deleted: AdminTierListSummary[];
}

export interface AdminTierListSummaryDto
  extends Omit<
    AdminTierListSummary,
    "createdAt" | "updatedAt" | "deletedAt"
  > {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AdminDashboardResponseDto
  extends Omit<AdminDashboardResponse, "active" | "public" | "templates" | "deleted"> {
  active: AdminTierListSummaryDto[];
  public: AdminTierListSummaryDto[];
  templates: AdminTierListSummaryDto[];
  deleted: AdminTierListSummaryDto[];
}

export function serializeAdminTierListSummary(
  summary: AdminTierListSummary,
): AdminTierListSummaryDto {
  return {
    ...summary,
    createdAt: summary.createdAt.toISOString(),
    updatedAt: summary.updatedAt.toISOString(),
    deletedAt: summary.deletedAt?.toISOString() ?? null,
  };
}

export function serializeAdminDashboardResponse(
  data: AdminDashboardResponse,
): AdminDashboardResponseDto {
  return {
    stats: data.stats,
    active: data.active.map(serializeAdminTierListSummary),
    public: data.public.map(serializeAdminTierListSummary),
    templates: data.templates.map(serializeAdminTierListSummary),
    deleted: data.deleted.map(serializeAdminTierListSummary),
  };
}
