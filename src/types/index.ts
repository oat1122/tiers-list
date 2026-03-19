export interface TierItem {
  id: string;
  name: string;
  imageUrl?: string;
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
}
