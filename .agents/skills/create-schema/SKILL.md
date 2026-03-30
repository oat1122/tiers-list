---
name: create-schema
description: Create Drizzle ORM table definitions and matching Zod validation for this repository. Use when the user asks for `/createschema [table_name] [columns...]`, wants a new file under `src/db/schema`, needs matching `src/lib/validations/[table_name].schema.ts`, or needs schema exports and relation wiring aligned with this repo's existing Drizzle conventions.
---

# Create Schema

## Overview

Create database table files in `src/db/schema`, add matching Zod validation in `src/lib/validations`, and keep exports plus relation wiring consistent with the project's existing Drizzle structure.

Prefer repository conventions over generic Drizzle examples. In this codebase, table definitions live in per-table files while relation exports are centralized in `src/db/schema/index.ts`.

## Workflow

1. Inspect the closest existing examples in:
   - `src/db/schema/*.ts`
   - `src/db/schema/index.ts`
   - `src/lib/validations/*.schema.ts`
   - `src/lib/validations/index.ts`
2. Read [references/schema-patterns.md](references/schema-patterns.md) before writing code.
3. Normalize the requested `table_name`.
   - Keep the database table name and file name consistent with repo conventions.
   - Prefer plural kebab or plural noun file names that match nearby files, for example `users.ts`, `tier-lists.ts`, `tier-items.ts`.
4. Create or update the Drizzle table file at `src/db/schema/[table_name].ts`.
5. Create or update the Zod validation file at `src/lib/validations/[table_name].schema.ts`.
6. Update barrel exports in:
   - `src/db/schema/index.ts`
   - `src/lib/validations/index.ts` when appropriate
7. If the new table relates to existing tables, add or update relations in `src/db/schema/index.ts`.
8. After the files are in place, suggest the next database sync command the user should run.

## Drizzle Rules

- Import only the MySQL core builders that the new table actually needs from `drizzle-orm/mysql-core`.
- Include the shared base fields unless the request explicitly requires otherwise:
  - `id`
  - `createdAt`
  - `updatedAt`
- Use:
  - `varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID())`
  - `timestamp("created_at").notNull().defaultNow()`
  - `timestamp("updated_at").notNull().defaultNow().onUpdateNow()`
- Add foreign keys with `.references(() => otherTable.id, { onDelete: ... })` when relationships are requested or implied.
- Export select and insert helper types from the table file:
  - `export type Xxx = typeof table.$inferSelect`
  - `export type NewXxx = typeof table.$inferInsert`

## Validation Rules

- Create a `CreateXxxSchema` for insert-like input.
- Create an `UpdateXxxSchema` from `CreateXxxSchema.partial()` unless the update shape needs custom rules.
- Export inferred types for each schema with `z.infer<typeof Schema>`.
- Exclude DB-managed fields such as `id`, `createdAt`, and `updatedAt` from create validation unless the request explicitly needs them.
- Use `z.coerce.number()` for numeric inputs likely to arrive as strings from forms or query params.
- Use `.min(1)` on required strings to block empty input.
- Keep error message language consistent with the surrounding validation files.

## Relation Rules

- Follow this repository's structure, not a generic one-file relation pattern.
- Define the table in `src/db/schema/[table_name].ts`.
- Add relation exports in `src/db/schema/index.ts`, where this repo already centralizes `relations(...)`.
- Re-export the new table from `src/db/schema/index.ts`.

## Output Expectations

When the skill handles `/createschema [table_name] [columns...]`, it should usually produce:

1. `src/db/schema/[table_name].ts`
2. `src/lib/validations/[table_name].schema.ts`
3. updated `src/db/schema/index.ts`
4. optionally updated `src/lib/validations/index.ts`
5. a suggested command for applying the schema change

## Command Suggestions

- Prefer suggesting `npx drizzle-kit push` when the repo does not already expose a dedicated package script.
- If the project later adds a script such as `npm run db:push`, prefer the project script.
- Only suggest a migration or push command. Do not run it unless the user asks.

## References

- Read [references/schema-patterns.md](references/schema-patterns.md) for:
  - a standard table scaffold
  - relation wiring in `src/db/schema/index.ts`
  - Zod validation scaffolds
  - naming guidance for create and update input types
