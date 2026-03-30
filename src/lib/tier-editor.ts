import type {
  TemplateEditorPageData,
  TierEditorConfig,
  TierEditorItemDraft,
  TierEditorTier,
  TierItem,
  TierListState,
  TierRow,
  UpdateTierListEditorInput,
} from "@/types";

export const POOL_TIER_ID = "pool";

const DEFAULT_TIER_PALETTE = [
  "#ff7f7f",
  "#ffbf7f",
  "#ffdf7f",
  "#ffff7f",
  "#bfff7f",
];

const DEFAULT_TIER_LABELS = ["S", "A", "B", "C", "D"];

export function createDefaultTierConfig(): TierEditorConfig {
  return {
    cardSize: "md",
    tiers: DEFAULT_TIER_LABELS.map<TierEditorTier>((label, index) => ({
      id: label,
      label,
      color: DEFAULT_TIER_PALETTE[index] ?? "#d4d4d8",
      order: index,
    })),
  };
}

function createFallbackTierColor(index: number) {
  return DEFAULT_TIER_PALETTE[index % DEFAULT_TIER_PALETTE.length] ?? "#d4d4d8";
}

function ensureTierConfigCoverage(
  config: TierEditorConfig,
  items: TierEditorItemDraft[],
) {
  const tiers = sortTiers(config.tiers);
  const tierIds = new Set(tiers.map((tier) => tier.id));
  const missingTierIds = items
    .map((item) => item.tier)
    .filter((tierId) => tierId !== POOL_TIER_ID && !tierIds.has(tierId));

  if (missingTierIds.length === 0) {
    return {
      ...config,
      tiers,
    };
  }

  const uniqueMissingTierIds = Array.from(new Set(missingTierIds));

  const appendedTiers = uniqueMissingTierIds.map<TierEditorTier>((tierId, index) => ({
    id: tierId,
    label: tierId,
    color: createFallbackTierColor(tiers.length + index),
    order: tiers.length + index,
  }));

  return {
    ...config,
    tiers: [...tiers, ...appendedTiers],
  };
}

export function createDefaultTierRows(): TierRow[] {
  return createDefaultTierConfig().tiers.map((tier) => ({
    id: tier.id,
    label: tier.label,
    color: tier.color,
    items: [],
  }));
}

export function createDefaultTierListState(): TierListState {
  return {
    tiers: createDefaultTierRows(),
    pool: [],
    cardSize: "md",
  };
}

function sortTiers(tiers: TierEditorTier[]) {
  return [...tiers].sort((a, b) => a.order - b.order);
}

function toTierItem(
  item: TierEditorItemDraft,
  index: number,
  listId: string,
): TierItem & { tierId: string; position: number; listId: string } {
  const resolvedId = item.id ?? item.clientId ?? `draft-${index}`;

  return {
    id: resolvedId,
    persistedId: item.id,
    name: item.label,
    itemType: item.itemType,
    imagePath: item.imagePath ?? null,
    imageUrl: item.imagePath ?? undefined,
    showCaption:
      item.showCaption === undefined ? true : item.showCaption === 1,
    tierId: item.tier,
    position: item.position,
    listId,
  };
}

export function templateEditorPageDataToState(data: TemplateEditorPageData) {
  const sortedTiers = sortTiers(data.editorConfig.tiers);
  const tierMap = new Map<string, TierRow>(
    sortedTiers.map((tier) => [
      tier.id,
      { id: tier.id, label: tier.label, color: tier.color, items: [] },
    ]),
  );

  const pool: TierItem[] = [];

  data.items
    .map((item, index) => toTierItem(item, index, data.listId))
    .sort((a, b) => a.position - b.position)
    .forEach((item) => {
      if (item.tierId === POOL_TIER_ID) {
        pool.push(item);
        return;
      }

      const tier = tierMap.get(item.tierId);
      if (tier) {
        tier.items.push(item);
      }
    });

  return {
    title: data.title,
    description: data.description,
    state: {
      tiers: sortedTiers.map((tier) => tierMap.get(tier.id)!),
      pool,
      cardSize: data.editorConfig.cardSize,
    },
  };
}

export function buildEditorConfigFromState(state: TierListState): TierEditorConfig {
  return {
    cardSize: state.cardSize,
    tiers: state.tiers.map((tier, index) => ({
      id: tier.id,
      label: tier.label,
      color: tier.color,
      order: index,
    })),
  };
}

function serializeItem(
  item: TierItem,
  tierId: string,
  position: number,
): TierEditorItemDraft {
  return {
    id: item.persistedId,
    clientId: item.persistedId ? undefined : item.id,
    label: item.name,
    tier: tierId,
    position,
    itemType: item.itemType ?? (item.imagePath ? "image" : "text"),
    imagePath: item.imagePath ?? null,
    showCaption: item.showCaption ? 1 : 0,
  };
}

export function buildEditorDraft(params: {
  title: string;
  description: string;
  state: TierListState;
}): UpdateTierListEditorInput {
  const tierItems = params.state.tiers.flatMap((tier) =>
    tier.items.map((item, index) => serializeItem(item, tier.id, index)),
  );
  const poolItems = params.state.pool.map((item, index) =>
    serializeItem(item, POOL_TIER_ID, index),
  );

  return {
    title: params.title,
    description: params.description,
    editorConfig: buildEditorConfigFromState(params.state),
    items: [...tierItems, ...poolItems],
  };
}

export function buildTemplateEditorPageData(params: {
  listId: string;
  title: string;
  description: string | null;
  editorConfig: TierEditorConfig | null;
  items: TierEditorItemDraft[];
  updatedAt: Date | string;
}): TemplateEditorPageData {
  const normalizedConfig = ensureTierConfigCoverage(
    params.editorConfig ?? createDefaultTierConfig(),
    params.items,
  );

  return {
    listId: params.listId,
    title: params.title,
    description: params.description ?? "",
    editorConfig: normalizedConfig,
    items: params.items,
    updatedAt:
      params.updatedAt instanceof Date
        ? params.updatedAt.toISOString()
        : params.updatedAt,
  };
}
