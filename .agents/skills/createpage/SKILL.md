---
name: createpage
description: Scaffold new Next.js App Router route pages for this repository. Use when the user asks for `/createpage [route_name]`, wants a new page under `src/app`, or needs a route scaffold with static metadata, a Tailwind layout shell, optional Client Components in a private `_components` folder, and form handling built with Zod, react-hook-form, and Server Actions.
---

# Create Page

## Overview

Create route scaffolds that match this Next.js 16 App Router project. Keep `page.tsx` as a Server Component, isolate browser state inside route-local Client Components, and use shared Zod schemas plus server-side `safeParse()` for every form submission.

## Workflow

1. Read the requested `route_name` and decide whether the page is static, interactive, or form-driven.
2. Create `src/app/[route_name]`.
3. Create `src/app/[route_name]/page.tsx` as a Server Component with static metadata near the top of the file.
4. Add a responsive Tailwind shell immediately so the route has a usable structure on desktop and mobile.
5. If the page needs interactivity or client state, create `src/app/[route_name]/_components/` and move that logic into a route-local Client Component.
6. If the page includes a form, create:
   - `src/app/[route_name]/actions.ts`
   - `src/app/[route_name]/_components/[route-name]-form.tsx`
   - `src/lib/validations/[route_name].schema.ts`
7. Re-export the new schema from `src/lib/validations/index.ts` unless the surrounding request makes direct-file imports a better fit.
8. Verify that the route folder, component names, imports, and metadata all match the requested route.

## Rules

- Keep `page.tsx` server-only. Do not add `"use client";` to the page file.
- Import metadata as `import type { Metadata } from "next";` and export a concrete `metadata` object with `title` and `description`.
- Compose the page from a simple Tailwind shell such as a header, supporting copy, and a main content section. Do not leave the route as a single bare placeholder line.
- Keep client boundaries narrow. Only files that need state, event handlers, lifecycle logic, browser APIs, or custom hooks should use `"use client";`.
- Place route-local interactive components in `src/app/[route_name]/_components/`.
- Name the route-local client file predictably:
  - `[route-name]-client.tsx` for general interactivity
  - `[route-name]-form.tsx` for forms
- If a Client Component needs a Server Action, define the action in `src/app/[route_name]/actions.ts` with `"use server";` at the top of the file and import it into the Client Component.
- Re-validate every form submission on the server with `schema.safeParse()` even when client-side validation already passed.
- Parse values from `FormData` explicitly in the Server Action. Never trust client-only types.
- Perform authentication and authorization checks inside each Server Action when the route touches protected data.
- After successful mutations, use `revalidatePath()` and/or `redirect()` when the page flow needs fresh data or navigation.
- Follow the existing repository conventions already present in `src/app`, `src/lib/validations`, and the UI component library under `src/components/ui`.

## Form Requirements

- Always pair forms with a Zod schema in `src/lib/validations/[route_name].schema.ts`.
- Export both the schema and its inferred input type from that schema file.
- In the Client Component, use `useForm` from `react-hook-form` with `zodResolver`.
- Prefer deriving `defaultValues` from the shape of the schema-backed input type.
- Submit through a Server Action, not a route handler fetch, unless the user explicitly asks for an API-based flow.
- When react-hook-form needs to drive submission, call the imported Server Action from the submit handler and wrap the async invocation in `startTransition()` if the UI needs a pending state.
- When a simple native form is enough, prefer `<form action={serverAction}>` and keep field names aligned with the schema keys.

## Naming Notes

- Preserve the requested route segment exactly when creating folders under `src/app`.
- If `route_name` contains nested segments, use the final segment to derive local file names such as `[segment]-client.tsx`, `[segment]-form.tsx`, and `[segment].schema.ts`.
- Use PascalCase component names derived from the route segment, for example `PricingPage`, `PricingClient`, and `PricingForm`.

## References

- Read [references/page-patterns.md](references/page-patterns.md) before writing code when you need a starter structure for:
  - a plain server-rendered page
  - a route-local interactive Client Component
  - a form route with `actions.ts` and a shared schema
- Use the examples in that reference as a scaffold, then tailor the copy, fields, and business logic to the actual request.
