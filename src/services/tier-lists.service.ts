import { eq, and, isNull, isNotNull, desc } from "drizzle-orm";
import { db } from "@/db";
import { tierLists, tierItems } from "@/db/schema";
import type { CreateTierListInput, UpdateTierListInput } from "@/lib/validations";

// ดึง Tier Lists ของ User (เฉพาะที่ยังไม่ถูกลบ)
export async function getMyTierLists(userId: string) {
  return db
    .select()
    .from(tierLists)
    .where(and(eq(tierLists.userId, userId), isNull(tierLists.deletedAt)))
    .orderBy(desc(tierLists.createdAt));
}

// ดึง Public Tier Lists (ยังไม่ลบ)
export async function getPublicTierLists() {
  return db
    .select()
    .from(tierLists)
    .where(and(eq(tierLists.isPublic, 1), isNull(tierLists.deletedAt)))
    .orderBy(desc(tierLists.createdAt));
}

// ดึง Template (Admin สร้างไว้ และยังไม่ลบ)
export async function getTemplates() {
  return db
    .select()
    .from(tierLists)
    .where(and(eq(tierLists.isTemplate, 1), isNull(tierLists.deletedAt)))
    .orderBy(desc(tierLists.createdAt));
}

// ดึงรายการเดียวเพื่อดูรายละเอียด
export async function getTierListById(id: string) {
  const result = await db
    .select()
    .from(tierLists)
    .where(eq(tierLists.id, id))
    .limit(1);
    
  return result[0] || null;
}

// สร้าง Tier List
export async function createTierList(data: CreateTierListInput, userId: string) {
  await db.insert(tierLists).values({
    userId,
    title: data.title,
    description: data.description,
    isPublic: data.isPublic ?? 0,
    isTemplate: data.isTemplate ?? 0,
  });

  // ค้นหารายการที่เพิ่งสร้างโดยเรียงล่าสุด
  const created = await db
    .select()
    .from(tierLists)
    .where(eq(tierLists.userId, userId))
    .orderBy(desc(tierLists.createdAt))
    .limit(1);
    
  return created[0];
}

// Clone จาก Template
export async function createFromTemplate(templateId: string, userId: string) {
  const template = await getTierListById(templateId);
  if (!template || template.isTemplate === 0) {
    throw new Error("Template not found");
  }

  const generatedId = crypto.randomUUID();

  // สร้าง Tier List ใหม่
  await db.insert(tierLists).values({
    id: generatedId,
    userId,
    title: `Copy of ${template.title}`,
    description: template.description,
    isPublic: 0,
    isTemplate: 0,
  });

  // ดึง items ของ template
  const items = await db
    .select()
    .from(tierItems)
    .where(eq(tierItems.tierListId, templateId));

  // โคลน items (รูปภาพจะใช้ path เดิมที่อยู่ในระบบอยู่แล้ว)
  if (items.length > 0) {
    const newItems = items.map(item => ({
      tierListId: generatedId,
      label: item.label,
      tier: item.tier,
      position: item.position,
      itemType: item.itemType,
      imagePath: item.imagePath,
      showCaption: item.showCaption,
    }));
    await db.insert(tierItems).values(newItems);
  }

  return await getTierListById(generatedId);
}

// อัปเดต Tier List
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

// Soft Delete
export async function softDeleteTierList(id: string) {
  await db
    .update(tierLists)
    .set({ deletedAt: new Date() })
    .where(eq(tierLists.id, id));
}

// Restore (Admin)
export async function restoreTierList(id: string) {
  await db
    .update(tierLists)
    .set({ deletedAt: null })
    .where(eq(tierLists.id, id));
}

// ดูรายการที่ถูกลบ (Admin)
export async function getDeletedTierLists() {
  return db
    .select()
    .from(tierLists)
    .where(isNotNull(tierLists.deletedAt))
    .orderBy(desc(tierLists.deletedAt));
}
