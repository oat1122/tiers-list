export interface TierPreviewItem {
  label: string;
  itemType: "text" | "image";
  imagePath: string | null;
  showCaption: boolean;
}

export interface TierPreviewRow {
  id: string;
  label: string;
  color: string;
  itemCount: number;
  items: TierPreviewItem[];
  overflowCount: number;
}

export interface TierPreview {
  rows: TierPreviewRow[];
  poolCount: number;
}
