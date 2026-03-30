# Route Patterns

ใช้ไฟล์นี้เป็น reference หลักเวลาสร้าง `/createapi`, `/protectroute`, หรือ `/addauth` ในโปรเจ็กต์นี้

## Quick Checklist

- สร้าง route handler ไว้ใต้ `src/app/api/.../route.ts`
- แยก business logic ไปไว้ใน `src/services/*.service.ts`
- validate input ทุกครั้งก่อนเรียก service
- ใช้ Better Auth จาก `@/lib/auth`
- ส่งกลับ `NextResponse.json(...)` พร้อม status code ที่เหมาะสม
- ถ้าเป็น dynamic route ใน Next.js ปัจจุบัน ให้จำไว้ว่า `params` เป็น `Promise`
- ถ้าจะ protect page/layout ให้ทำฝั่ง server ก่อนเสมอ

## `/createapi` Flow

1. สร้าง schema ที่ `src/lib/validations/[route_name].schema.ts`
2. export type ด้วย `z.infer<typeof Schema>`
3. สร้าง service ที่ `src/services/[route_name].service.ts`
4. สร้าง route handler ที่ `src/app/api/[route_name]/route.ts`
5. ใน `route.ts`
   - parse request
   - validate ด้วย Zod
   - check session ถ้าต้อง auth
   - เรียก service
   - จัดการ error ใน `try/catch`

## Schema Pattern

```ts
import { z } from "zod";

export const CreatePostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  isPublished: z.coerce.number().int().min(0).max(1).default(0),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export const UpdatePostSchema = CreatePostSchema.partial();

export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
```

แนวทาง:

- แยก schema ตาม method ถ้า input ไม่เหมือนกัน
- ใช้ `z.coerce` กับค่าที่มาจาก query string หรือ form data
- ถ้าต้อง re-export เพื่อ import จาก barrel ให้เพิ่มใน `src/lib/validations/index.ts`

## Service Pattern

```ts
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { posts } from "@/db/schema";
import type { CreatePostInput, UpdatePostInput } from "@/lib/validations";

export async function getPostsByUser(userId: string) {
  return db
    .select()
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt));
}

export async function createPost(data: CreatePostInput, userId: string) {
  await db.insert(posts).values({
    userId,
    title: data.title,
    content: data.content,
    isPublished: data.isPublished,
  });

  const created = await db
    .select()
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt))
    .limit(1);

  return created[0] ?? null;
}

export async function updatePost(id: string, data: UpdatePostInput) {
  await db.update(posts).set(data).where(eq(posts.id, id));

  const updated = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return updated[0] ?? null;
}
```

กฎสำคัญ:

- service รับ type จาก schema ไม่ใช้ `any`
- service ต้องไม่ผูกกับ `NextRequest` หรือ `NextResponse`
- ให้ route handler เป็นคนจัดการ auth, validation, และ response

## Static Route Handler Pattern

เหมาะกับ route ประเภท `src/app/api/posts/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CreatePostSchema } from "@/lib/validations";
import { createPost, getPostsByUser } from "@/services/posts.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await getPostsByUser(session.user.id);
    return NextResponse.json(posts, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = CreatePostSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    const created = await createPost(result.data, session.user.id);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
```

## Dynamic Route Handler Pattern

เหมาะกับ route แบบ `src/app/api/posts/[id]/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UpdatePostSchema } from "@/lib/validations";
import { getPostById, updatePost } from "@/services/posts.service";

type Params = { id: string };

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<Params> },
) {
  const params = await props.params;

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await getPostById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = UpdatePostSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    const updated = await updatePost(params.id, result.data);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
```

## Query Param Pattern

สำหรับ `GET` ที่รับ query params อย่าใช้ `request.json()`

```ts
const input = {
  search: request.nextUrl.searchParams.get("search"),
  page: request.nextUrl.searchParams.get("page"),
  limit: request.nextUrl.searchParams.get("limit"),
};

const result = SearchPostsQuerySchema.safeParse(input);

if (!result.success) {
  return NextResponse.json(
    { error: result.error.flatten() },
    { status: 400 },
  );
}
```

## FormData Pattern

สำหรับ route ที่ upload file หรือ multipart form

```ts
const formData = await request.formData();
const image = formData.get("image");

if (!image || typeof image === "string") {
  return NextResponse.json(
    { error: "No image file provided" },
    { status: 400 },
  );
}

const rawData = {
  title: formData.get("title"),
  sortOrder: formData.get("sortOrder"),
};

const result = UploadPostImageSchema.safeParse(rawData);
```

แนวทาง:

- validate metadata ที่แปลงเป็น plain object ก่อน
- แยก validation ของ file กับ field ปกติให้ชัด

## Error Response Pattern

```ts
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
return NextResponse.json({ error: "Forbidden" }, { status: 403 });
return NextResponse.json({ error: "Not found" }, { status: 404 });
return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
return NextResponse.json({ error: (error as Error).message }, { status: 500 });
```

ใช้ข้อความ error ที่สั้น ชัด และ consistent

## `/protectroute` Server Component Pattern

เหมาะกับ `page.tsx` หรือ `layout.tsx`

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <div>Welcome {session.user.name}</div>;
}
```

หมายเหตุ:

- ใน repo นี้ route login จริงคือ `/sign-in`
- อย่าใส่ `"use client";` ใน `page.tsx` หรือ `layout.tsx` แค่เพื่อเช็ก session

## Role Guard Pattern

```tsx
if (!session) {
  redirect("/sign-in");
}

if (session.user.role !== "admin") {
  redirect("/");
}
```

## Client Component Auth Pattern

ใช้เฉพาะเมื่อจำเป็นต้องตรวจ session ใน client component จริงๆ

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";

export function ProtectedClientPanel() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
    }
  }, [isPending, router, session]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return <div>{session.user.name}</div>;
}
```

ข้อควรระวัง:

- ตอนนี้ repo นี้ยังไม่มี `src/lib/auth-client.ts`
- ถ้าจะใช้ pattern นี้ ต้องสร้างหรือปรับ auth client ให้มีอยู่จริงก่อน
- ถ้าทำได้ ให้ protect ที่ server route ก่อนแล้วค่อยให้ client component รับ data ต่อ

## Existing Repo Examples

ดู pattern จริงจากไฟล์เหล่านี้ก่อนลงมือ:

- `src/app/api/tier-lists/route.ts`
- `src/app/api/tier-lists/[id]/route.ts`
- `src/app/api/tier-lists/[id]/items/route.ts`
- `src/app/dashboard/page.tsx`
- `src/services/tier-lists.service.ts`
- `src/services/tier-items.service.ts`
