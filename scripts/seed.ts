// scripts/seed.ts
// สคริปต์สร้าง Admin User สำหรับระบบ
// รันด้วยคำสั่ง: npx tsx scripts/seed.ts
import "dotenv/config";
import { db } from "../src/db/index";
import { users, accounts } from "../src/db/schema/index";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// ─── Config ────────────────────────────────────────────────────────────────
const ADMIN_EMAIL = "admin@tiers-list.com";
const ADMIN_NAME = "Admin";
const ADMIN_PASSWORD = "Admin@1234"; // เปลี่ยนก่อน deploy

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Hash password ด้วย PBKDF2 (รูปแบบเดียวกับ Better Auth credential provider)
 * Better Auth ใช้ format: "v=1;pbkdf2;sha256;<salt_hex>;<hash_hex>;<iterations>"
 */
async function hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16);
    const iterations = 100_000;
    const keylen = 32;
    const digest = "sha256";

    const hash = await new Promise<Buffer>((resolve, reject) => {
        crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, key) => {
            if (err) reject(err);
            else resolve(key);
        });
    });

    return `v=1;pbkdf2;${digest};${salt.toString("hex")};${hash.toString("hex")};${iterations}`;
}

// ─── Seed ──────────────────────────────────────────────────────────────────

async function seed() {
    console.log("🌱 Starting seed...\n");

    // ตรวจสอบว่า Admin มีอยู่แล้วหรือไม่
    const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, ADMIN_EMAIL))
        .limit(1);

    if (existing.length > 0) {
        console.log(`⚠️  Admin user already exists: ${ADMIN_EMAIL}`);
        console.log("   ลบ user นี้ก่อนถ้าต้องการ re-seed\n");
        process.exit(0);
    }

    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);
    const now = new Date();

    // สร้าง user record
    await db.insert(users).values({
        id: userId,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        emailVerified: true,
        image: null,
        createdAt: now,
        updatedAt: now,
    });

    // สร้าง account record (credential provider)
    await db.insert(accounts).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
    });

    console.log("✅ Admin user created successfully!\n");
    console.log(`   Email    : ${ADMIN_EMAIL}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log(`   User ID  : ${userId}`);
    console.log("\n⚠️  อย่าลืมเปลี่ยน ADMIN_PASSWORD ก่อน deploy จริง!");

    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
