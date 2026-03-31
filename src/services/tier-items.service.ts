import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { tierItems } from "@/db/schema";
import type {
  CreateTierItemInput,
  UpdateTierItemInput,
  UploadTierItemMetaInput,
} from "@/lib/validations";
import { saveImageFile } from "@/lib/upload";

export async function getTierItems(tierListId: string) {
  return db
    .select()
    .from(tierItems)
    .where(
      and(eq(tierItems.tierListId, tierListId), isNull(tierItems.deletedAt)),
    )
    .orderBy(tierItems.position);
}

export async function getTierItemById(id: string) {
  const result = await db
    .select()
    .from(tierItems)
    .where(eq(tierItems.id, id))
    .limit(1);

  return result[0] || null;
}

export async function createTextTierItem(data: CreateTierItemInput) {
  if (data.itemType !== "text") {
    throw new Error("Invalid format");
  }

  const id = crypto.randomUUID();

  await db.insert(tierItems).values({
    id,
    tierListId: data.tierListId,
    label: data.label,
    tier: data.tier,
    position: data.position,
    itemType: "text",
  });

  return getTierItemById(id);
}

export async function createImageTierItem(
  data: UploadTierItemMetaInput,
  file: File,
) {
  const imagePath = await saveImageFile(file);
  const id = crypto.randomUUID();

  await db.insert(tierItems).values({
    id,
    tierListId: data.tierListId,
    label: data.label,
    tier: data.tier,
    position: data.position,
    showCaption: data.showCaption,
    itemType: "image",
    imagePath,
  });

  return getTierItemById(id);
}

export async function updateTierItem(id: string, data: UpdateTierItemInput) {
  await db
    .update(tierItems)
    .set(data)
    .where(eq(tierItems.id, id));
}

export async function softDeleteTierItem(id: string) {
  await db
    .update(tierItems)
    .set({ deletedAt: new Date() })
    .where(eq(tierItems.id, id));
}

export async function restoreTierItem(id: string) {
  await db
    .update(tierItems)
    .set({ deletedAt: null })
    .where(eq(tierItems.id, id));
}

export async function hardDeleteTierItem(id: string) {
  await db.delete(tierItems).where(eq(tierItems.id, id));
}
