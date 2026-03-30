---
name: route-api
description: Scaffold and secure Next.js App Router route handlers for this repository. Use when the user asks for `/createapi [route_name] [methods...]`, `/protectroute [route_name]`, `/addauth [route_name]`, or needs Zod-validated API routes under `src/app/api`, service-layer extraction under `src/services`, Better Auth session checks, or auth-gated App Router pages and layouts.
---

# Route API

## Overview

Create thin App Router route handlers that validate input with Zod, delegate business logic to `src/services`, and follow the Better Auth patterns already used in this codebase.

Protect server-rendered routes on the server first, and only use a client auth hook when a nested Client Component truly has to stay client-side.

## Workflow

1. Inspect the closest existing examples in `src/app/api`, `src/services`, `src/lib/validations`, and `src/lib/auth.ts`.
2. Read [references/route-patterns.md](references/route-patterns.md) before writing code.
3. When changing or creating `route.ts`, confirm the current Next.js App Router behavior from:
   - `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
   - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`
4. Decide whether the request is primarily:
   - `/createapi [route_name] [methods...]`
   - `/protectroute [route_name]`
   - `/addauth [route_name]`
5. Keep `route.ts` thin. Put reusable database and business logic in `src/services`.

## `/createapi`

1. Preserve the requested API route path under `src/app/api/[route_name]/route.ts`.
2. Create a validation file at `src/lib/validations/[schema_name].schema.ts`.
   - Use the final segment as `schema_name` when `route_name` contains nested segments.
   - Define separate schemas per method when their inputs differ.
   - Export inferred types with `z.infer<typeof Schema>`.
3. Re-export the new schema from `src/lib/validations/index.ts` when shared imports improve consistency.
4. Create `src/services/[service_name].service.ts`.
   - Use the final segment as `service_name` when `route_name` contains nested segments.
   - Import `db` from `@/db` and table definitions from `@/db/schema` when the service touches the database.
   - Accept inferred schema types and plain primitives only.
   - Do not import or depend on `NextRequest`, `NextResponse`, or route-handler-only helpers in the service layer.
5. Create `src/app/api/[route_name]/route.ts`.
   - Import `NextRequest` and `NextResponse` from `next/server`.
   - Import `auth` from `@/lib/auth` when the endpoint is protected.
   - Import schemas from `@/lib/validations` or the direct schema file.
   - Import service functions from `@/services/...`.
6. Implement one exported function per requested HTTP method.
   - Use `request.nextUrl.searchParams` for query-driven `GET` handlers and validate a normalized plain object.
   - Use `await request.json()` for JSON body methods.
   - Use `await request.formData()` only for multipart or file routes, then validate a plain object assembled from `FormData`.
   - For dynamic routes in current Next.js App Router, remember that `params` is a promise.
7. When auth is required, fetch the session with `await auth.api.getSession({ headers: request.headers })`.
   - Return `NextResponse.json({ error: "Unauthorized" }, { status: 401 })` immediately when no session exists.
   - Return `403` when the user is authenticated but not allowed to act.
8. Validate before calling the service.
   - Use `const result = Schema.safeParse(...)`.
   - If validation fails, return `400` with `result.error.flatten()`.
   - Pass only `result.data` plus trusted route params or session data into the service.
9. Wrap each handler in `try/catch`.
   - Return `200` for reads and successful updates by default.
   - Return `201` for creates.
   - Return `404` when the target resource does not exist.
   - Return `500` with a concise error payload for unexpected failures.

## `/protectroute` And `/addauth`

1. Prefer server-side protection for `page.tsx` and `layout.tsx`.
   - Import `headers` from `next/headers`.
   - Import `redirect` from `next/navigation`.
   - Load the session with `await auth.api.getSession({ headers: await headers() })`.
   - Redirect immediately when there is no session.
2. Follow repository auth routes, not generic placeholders.
   - This repo currently uses `/sign-in`, not `/login`.
   - Only redirect to a different auth route if that route already exists or the user explicitly asks for it.
3. Keep Server Components server-only.
   - Do not add `"use client";` to `page.tsx` or `layout.tsx` just to read the session.
   - Fetch role-based data or user display fields from the server session when needed.
4. For Client Components under `_components/...`, use a client auth hook only when the UI genuinely has to stay client-side.
   - If `src/lib/auth-client.ts` exists, use `useSession()` from that file.
   - If it does not exist, create or align the auth client first instead of importing a non-existent module.
   - Handle pending state before rendering protected UI.
   - Show fallback UI or push to the auth route after the unauthenticated state is confirmed.
5. Keep the client boundary narrow.
   - Protect the parent page or layout on the server whenever possible.
   - Let nested client components focus on interactivity rather than access control.

## Repository Conventions

- Mirror existing patterns from:
  - `src/app/api/tier-lists/route.ts`
  - `src/app/api/tier-lists/[id]/route.ts`
  - `src/app/dashboard/page.tsx`
  - `src/services/tier-lists.service.ts`
- Validation files live in `src/lib/validations` and commonly participate in the barrel export at `src/lib/validations/index.ts`.
- Services already exist in `src/services`; extend that layer instead of embedding Drizzle queries in `route.ts`.
- Better Auth server access lives in `src/lib/auth.ts`.
- Route handlers in this repo usually return `NextResponse.json(...)` and keep response shaping simple.

## References

- Read [references/route-patterns.md](references/route-patterns.md) for:
  - static route handler patterns
  - dynamic route patterns with promised `params`
  - protected server page patterns
  - client auth notes for projects that do or do not already have `auth-client.ts`
