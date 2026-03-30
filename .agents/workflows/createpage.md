---
description: /createpage
---

Use `$createpage` at `.agents/skills/createpage/SKILL.md` to handle `/createpage [route_name]`.

Required behavior:

1. Create `src/app/[route_name]`.
2. Create `page.tsx` as a Server Component with static Next.js metadata near the top.
3. Add a usable Tailwind layout shell instead of a bare placeholder.
4. If the route needs interactivity, create `src/app/[route_name]/_components/` and place the Client Component there.
5. If the route contains a form, require:
   - `src/lib/validations/[route_name].schema.ts`
   - `react-hook-form` with `zodResolver`
   - a Server Action in `src/app/[route_name]/actions.ts`
   - server-side `schema.safeParse()` before any mutation

Read the skill for the full naming, file layout, and example patterns.
