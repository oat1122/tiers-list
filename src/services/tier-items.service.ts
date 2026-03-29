import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { tierItems } from "@/db/schema";
import type { 
  CreateTierItemInput, 
  UpdateTierItemInput,
  UploadTierItemMetaInput 
} from "@/lib/validations";
import { saveImageFile } from "@/lib/upload";

// ดึง Items ของ Tier List
export async function getTierItems(tierListId: string) {
  return db
    .select()
    .from(tierItems)
    .where(and(eq(tierItems.tierListId, tierListId), isNull(tierItems.deletedAt)))
    .orderBy(tierItems.position);
}

// ดึง Item เดี่ยวเพื่อเช็คสิทธิ์
export async function getTierItemById(id: string) {
  const result = await db
    .select()
    .from(tierItems)
    .where(eq(tierItems.id, id))
    .limit(1);
    
  return result[0] || null;
}

// สร้าง Text Item
export async function createTextTierItem(data: CreateTierItemInput) {
  if (data.itemType !== "text") throw new Error("Invalid format");
  
  await db.insert(tierItems).values({
    tierListId: data.tierListId,
    label: data.label,
    tier: data.tier,
    position: data.position,
    itemType: "text",
  });
}

// อัปโหลดไฟล์และสร้าง Image Item
export async function createImageTierItem(data: UploadTierItemMetaInput, file: File) {
  const imagePath = await saveImageFile(file);
  
  await db.insert(tierItems).values({
    tierListId: data.tierListId,
    label: data.label,
    tier: data.tier,
    position: data.position,
    showCaption: data.showCaption,
    itemType: "image",
    imagePath,
  });
}

// อัปเดต Item
export async function updateTierItem(id: string, data: UpdateTierItemInput) {
  await db
    .update(tierItems)
    .set({
      label: data.label,
      tier: data.tier,
      position: data.position,
      showCaption: data.showCaption,
    })
    .where(eq(tierItems.id, id));
}

// Soft Delete Item (ไม่ลบรูป)
export async function softDeleteTierItem(id: string) {
  await db
    .update(tierItems)
    .set({ deletedAt: new Date() })
    .where(eq(tierItems.id, id));
}

// Restore Item (Admin)
export async function restoreTierItem(id: string) {
  await db
    .update(tierItems)
    .set({ deletedAt: null })
    .where(eq(tierItems.id, id));
}

// ลบทิ้งออกจาก DB โดยสมบูรณ์ (Hard Delete)
export async function hardDeleteTierItem(id: string) {
  await db.delete(tierItems).where(eq(tierItems.id, id));
  // Note: ถ้าต้องการลบไฟล์ออกจาก public/uploads ด้วย ต้องทำ fs.unlink() ตรงนี้เสริม
}
