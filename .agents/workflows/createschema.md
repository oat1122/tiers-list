---
description: /createschema
---

Use `$create-schema` at `.agents/skills/create-schema/SKILL.md` to handle `/createschema [table_name] [columns...]`.

Required behavior:

1. Create `src/db/schema/[table_name].ts` with a Drizzle `mysqlTable(...)`.
2. Include the standard `id`, `createdAt`, and `updatedAt` fields unless the request says otherwise.
3. Add foreign keys and relations when the new table is connected to existing tables.
4. Update `src/db/schema/index.ts` exports and relation wiring.
5. Create `src/lib/validations/[table_name].schema.ts` with matching `CreateXxxSchema` and `UpdateXxxSchema`.
6. Export inferred input types with `z.infer<typeof Schema>`.
7. Suggest the next command the user should run to sync the schema.

Read the skill for repo-specific naming, relation placement, and validation patterns.
