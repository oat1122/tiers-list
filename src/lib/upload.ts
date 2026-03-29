import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export const UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const UPLOAD_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const UPLOAD_DIR = "public/uploads/tier-items";

/**
 * บันทึกไฟล์ที่ถูกอัปโหลด (File object จาก FormData) ลงในโฟลเดอร์ public/uploads/tier-items
 * @param file ไฟล์ที่ต้องการบันทึก
 * @returns path ภายในเซิร์ฟเวอร์ เช่น "/uploads/tier-items/abcd.jpg"
 */
export async function saveImageFile(file: File): Promise<string> {
  // Validate size
  if (file.size > UPLOAD_MAX_SIZE_BYTES) {
    throw new Error("ขนาดไฟล์ต้องไม่เกิน 5MB");
  }

  // Validate type
  if (!(UPLOAD_ALLOWED_MIME as readonly string[]).includes(file.type)) {
    throw new Error("รองรับเฉพาะไฟล์รูปภาพ (jpeg, png, webp, gif)");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // สกัดนามสกุลไฟล์
  const extension = file.name.split(".").pop() || "png";
  const uniqueName = `${crypto.randomUUID()}.${extension}`;

  const uploadDir = path.join(process.cwd(), UPLOAD_DIR);

  // ตรวจสอบและสร้างโฟลเดอร์ถ้ายังไม่มี
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, uniqueName);
  await fs.writeFile(filePath, buffer);

  // Return url path ที่ Next.js ใช้ดึงไฟล์ได้
  return `/uploads/tier-items/${uniqueName}`;
}
