import type { TemplateEditorPageData } from "./index";
import type { TierPreview } from "./tier-preview";

export interface PublicTierListSummary {
  id: string;
  title: string;
  description: string | null;
  coverImagePath: string | null;
  updatedAt: Date;
  itemCount: number;
  preview: TierPreview | null;
}

export interface PublicTierListEditorData {
  listId: string;
  title: string;
  description: string;
  coverImagePath?: string | null;
  editorConfig: TemplateEditorPageData["editorConfig"];
  items: TemplateEditorPageData["items"];
  updatedAt: string;
}
