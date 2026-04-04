export type CardSize = "sm" | "md" | "lg";
export type TierItemType = "text" | "image";

export interface TierEditorTier {
  id: string;
  label: string;
  color: string;
  order: number;
}

export interface TierEditorConfig {
  cardSize: CardSize;
  tiers: TierEditorTier[];
}

export interface TierItem {
  id: string;
  persistedId?: string;
  name: string;
  itemType?: TierItemType;
  imageUrl?: string;
  imagePath?: string | null;
  tempUploadPath?: string | null;
  showCaption?: boolean;
}

export interface TierRow {
  id: string;
  label: string;
  color: string;
  items: TierItem[];
}

export interface TierListState {
  tiers: TierRow[];
  pool: TierItem[];
  cardSize: CardSize;
}

export interface TierEditorItemDraft {
  id?: string;
  clientId?: string;
  label: string;
  tier: string;
  position: number;
  itemType: TierItemType;
  imagePath?: string | null;
  tempUploadPath?: string | null;
  showCaption?: number;
}

export interface UpdateTierListEditorInput {
  title: string;
  description: string;
  coverImagePath?: string | null;
  coverTempUploadPath?: string | null;
  editorConfig: TierEditorConfig;
  items: TierEditorItemDraft[];
}

export interface TemplateEditorPageData {
  listId: string;
  title: string;
  description: string;
  coverImagePath?: string | null;
  editorConfig: TierEditorConfig;
  items: TierEditorItemDraft[];
  updatedAt: string;
}

export * from "./picture-reveal";
export * from "./picture-reveal-admin";
