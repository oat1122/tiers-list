import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("Drizzle schema contracts", () => {
  it("defines automatic id and timestamp behavior for users", () => {
    const source = readProjectFile("src/db/schema/users.ts");

    expect(source).toContain("crypto.randomUUID()");
    expect(source).toContain(
      'createdAt: timestamp("created_at").notNull().defaultNow()',
    );
    expect(source).toContain(
      'updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()',
    );
  });

  it("defines automatic id and timestamp behavior for tier lists", () => {
    const source = readProjectFile("src/db/schema/tier-lists.ts");

    expect(source).toContain("crypto.randomUUID()");
    expect(source).toContain(
      'createdAt: timestamp("created_at").notNull().defaultNow()',
    );
    expect(source).toContain(
      'updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()',
    );
  });

  it("defines automatic id and timestamp behavior for picture reveal games", () => {
    const source = readProjectFile("src/db/schema/picture-reveal-games.ts");

    expect(source).toContain("crypto.randomUUID()");
    expect(source).toContain('imageWidth: int("image_width").notNull().default(1080)');
    expect(source).toContain('imageHeight: int("image_height").notNull().default(1080)');
    expect(source).toContain('coverImagePath: varchar("cover_image_path", { length: 500 })');
    expect(source).toContain(
      'createdAt: timestamp("created_at").notNull().defaultNow()',
    );
    expect(source).toContain(
      'updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()',
    );
  });
});

describe("Client-only store contracts", () => {
  it("keeps the tier store marked as a client module", () => {
    const source = readProjectFile("src/store/useTierStore.ts");

    expect(source.split(/\r?\n/, 2)[0]).toBe('"use client";');
  });

  it("keeps the UI store marked as a client module", () => {
    const source = readProjectFile("src/store/useUIStore.ts");

    expect(source.split(/\r?\n/, 2)[0]).toBe('"use client";');
  });
});



