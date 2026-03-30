import {
  and,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import { tierItems, tierLists, users } from "@/db/schema";
import {
  buildTemplateEditorPageData,
  createDefaultTierConfig,
} from "@/lib/tier-editor";
import type {
  CreateTierListInput,
  UpdateTierListInput,
} from "@/lib/validations";
import type {
  UpdateTierListEditorInput,
} from "@/lib/validations";
import type {
  TemplateEditorPageData,
  TierEditorItemDraft,
} from "@/types";
import type {
  AdminDashboardResponse,
  AdminTierListSummary,
} from "@/types/admin-dashboard";

export async function getMyTierLists(userId: string) {
  return db
    .select()
    .from(tierLists)
    .where(and(eq(tierLists.userId, userId), isNull(tierLists.deletedAt)))
    .orderBy(desc(tierLists.createdAt));
}

export async function getPublicTierLists() {
  return db
    .select()
    .from(tierLists)
    .where(and(eq(tierLists.isPublic, 1), isNull(tierLists.deletedAt)))
    .orderBy(desc(tierLists.createdAt));
}

export async function getTemplates() {
  return db
    .select()
    .from(tierLists)
    .where(and(eq(tierLists.isTemplate, 1), isNull(tierLists.deletedAt)))
    .orderBy(desc(tierLists.createdAt));
}

export async function getTierListById(id: string) {
  const result = await db
    .select()
    .from(tierLists)
    .where(eq(tierLists.id, id))
    .limit(1);

  return result[0] || null;
}

function mapTierItemsToDrafts(
  items: Array<typeof tierItems.$inferSelect>,
): TierEditorItemDraft[] {
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    tier: item.tier,
    position: item.position,
    itemType: item.itemType === "image" ? "image" : "text",
    imagePath: item.imagePath,
    showCaption: item.showCaption,
  }));
}

export async function getTierItemsByListId(tierListId: string) {
  return db
    .select()
    .from(tierItems)
    .where(
      and(eq(tierItems.tierListId, tierListId), isNull(tierItems.deletedAt)),
    )
    .orderBy(tierItems.position, tierItems.createdAt);
}

export async function getTemplateEditorPageData(
  listId: string,
): Promise<TemplateEditorPageData | null> {
  const list = await getTierListById(listId);

  if (!list || list.deletedAt) {
    return null;
  }

  const items = await getTierItemsByListId(listId);

  return buildTemplateEditorPageData({
    listId: list.id,
    title: list.title,
    description: list.description,
    editorConfig: list.editorConfig ?? createDefaultTierConfig(),
    items: mapTierItemsToDrafts(items),
    updatedAt: list.updatedAt,
  });
}

export async function createTierList(
  data: CreateTierListInput,
  userId: string,
) {
  await db.insert(tierLists).values({
    userId,
    title: data.title,
    description: data.description,
    isPublic: data.isPublic ?? 0,
    isTemplate: data.isTemplate ?? 0,
    editorConfig: createDefaultTierConfig(),
  });

  const created = await db
    .select()
    .from(tierLists)
    .where(eq(tierLists.userId, userId))
    .orderBy(desc(tierLists.createdAt))
    .limit(1);

  return created[0];
}

export async function createFromTemplate(templateId: string, userId: string) {
  const template = await getTierListById(templateId);
  if (!template || template.isTemplate === 0) {
    throw new Error("Template not found");
  }

  const generatedId = crypto.randomUUID();

  await db.insert(tierLists).values({
    id: generatedId,
    userId,
    title: `Copy of ${template.title}`,
    description: template.description,
    isPublic: 0,
    isTemplate: 0,
    editorConfig: template.editorConfig ?? createDefaultTierConfig(),
  });

  const items = await db
    .select()
    .from(tierItems)
    .where(
      and(
        eq(tierItems.tierListId, templateId),
        isNull(tierItems.deletedAt),
      ),
    );

  if (items.length > 0) {
    const clonedItems = items.map((item) => ({
      tierListId: generatedId,
      label: item.label,
      tier: item.tier,
      position: item.position,
      itemType: item.itemType,
      imagePath: item.imagePath,
      showCaption: item.showCaption,
    }));

    await db.insert(tierItems).values(clonedItems);
  }

  return await getTierListById(generatedId);
}

export async function updateTierList(id: string, data: UpdateTierListInput) {
  await db
    .update(tierLists)
    .set({
      title: data.title,
      description: data.description,
      isPublic: data.isPublic,
      isTemplate: data.isTemplate,
    })
    .where(eq(tierLists.id, id));

  return await getTierListById(id);
}

export async function saveTierListEditor(
  id: string,
  data: UpdateTierListEditorInput,
) {
  await db.transaction(async (tx) => {
    await tx
      .update(tierLists)
      .set({
        title: data.title,
        description: data.description,
        editorConfig: data.editorConfig,
      })
      .where(eq(tierLists.id, id));

    const existingItems = await tx
      .select()
      .from(tierItems)
      .where(and(eq(tierItems.tierListId, id), isNull(tierItems.deletedAt)));

    const existingMap = new Map(existingItems.map((item) => [item.id, item]));
    const keptIds: string[] = [];

    for (const item of data.items) {
      if (item.id && existingMap.has(item.id)) {
        await tx
          .update(tierItems)
          .set({
            label: item.label,
            tier: item.tier,
            position: item.position,
            itemType: item.itemType,
            imagePath: item.imagePath ?? null,
            showCaption: item.showCaption ?? 1,
            deletedAt: null,
          })
          .where(eq(tierItems.id, item.id));

        keptIds.push(item.id);
        continue;
      }

      const insertedId = crypto.randomUUID();

      await tx.insert(tierItems).values({
        id: insertedId,
        tierListId: id,
        label: item.label,
        tier: item.tier,
        position: item.position,
        itemType: item.itemType,
        imagePath: item.imagePath ?? null,
        showCaption: item.showCaption ?? 1,
      });

      keptIds.push(insertedId);
    }

    const removedIds = existingItems
      .filter((item) => !keptIds.includes(item.id))
      .map((item) => item.id);

    if (removedIds.length > 0) {
      await tx
        .update(tierItems)
        .set({ deletedAt: new Date() })
        .where(inArray(tierItems.id, removedIds));
    }
  });

  return getTemplateEditorPageData(id);
}

export async function softDeleteTierList(id: string) {
  await db
    .update(tierLists)
    .set({ deletedAt: new Date() })
    .where(eq(tierLists.id, id));
}

export async function restoreTierList(id: string) {
  await db
    .update(tierLists)
    .set({ deletedAt: null })
    .where(eq(tierLists.id, id));
}

export async function getDeletedTierLists() {
  return db
    .select()
    .from(tierLists)
    .where(isNotNull(tierLists.deletedAt))
    .orderBy(desc(tierLists.deletedAt));
}

async function getAdminTierLists(whereClause: SQL<unknown>) {
  const itemCount = sql<number>`count(${tierItems.id})`
    .mapWith(Number)
    .as("itemCount");

  const rows = await db
    .select({
      id: tierLists.id,
      title: tierLists.title,
      description: tierLists.description,
      isPublic: tierLists.isPublic,
      isTemplate: tierLists.isTemplate,
      createdAt: tierLists.createdAt,
      updatedAt: tierLists.updatedAt,
      deletedAt: tierLists.deletedAt,
      itemCount,
      ownerId: users.id,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(tierLists)
    .innerJoin(users, eq(tierLists.userId, users.id))
    .leftJoin(
      tierItems,
      and(eq(tierItems.tierListId, tierLists.id), isNull(tierItems.deletedAt)),
    )
    .where(whereClause)
    .groupBy(
      tierLists.id,
      tierLists.title,
      tierLists.description,
      tierLists.isPublic,
      tierLists.isTemplate,
      tierLists.createdAt,
      tierLists.updatedAt,
      tierLists.deletedAt,
      users.id,
      users.name,
      users.email,
    )
    .orderBy(desc(tierLists.updatedAt), desc(tierLists.createdAt));

  return rows.map<AdminTierListSummary>((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    isPublic: row.isPublic,
    isTemplate: row.isTemplate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    itemCount: row.itemCount,
    owner: {
      id: row.ownerId,
      name: row.ownerName,
      email: row.ownerEmail,
    },
  }));
}

export async function getAdminDashboardData(): Promise<AdminDashboardResponse> {
  const [active, deleted] = await Promise.all([
    getAdminTierLists(isNull(tierLists.deletedAt)),
    getAdminTierLists(isNotNull(tierLists.deletedAt)),
  ]);

  const publicLists = active.filter((list) => list.isPublic === 1);
  const templates = active.filter((list) => list.isTemplate === 1);

  return {
    stats: {
      activeCount: active.length,
      publicCount: publicLists.length,
      templateCount: templates.length,
      deletedCount: deleted.length,
    },
    active,
    public: publicLists,
    templates,
    deleted,
  };
}
