---
name: clean-code
description: Apply clean-code engineering standards when writing, refactoring, reviewing, or debugging code. Use when the user asks for readable, maintainable, easy-to-debug, future-proof code; asks to add comments to functions; asks to refactor messy logic; or requests professional code without emojis in comments, documentation, commit messages, or console logs.
---

# Clean Code

## Overview

Use this skill to produce code that is simple to read, easy to debug, and safe to extend. Prefer clear structure, precise naming, explicit errors, and professional function documentation over clever or compressed implementations.

## Workflow

1. Read the surrounding code before editing so the solution follows the existing architecture, naming, and framework patterns.
2. Identify the smallest behavior-preserving change that improves readability, debuggability, and future maintenance.
3. Split logic into focused functions when a block has multiple responsibilities, hidden side effects, or hard-to-test branches.
4. Add or update standard function comments for every function touched or created.
5. Verify the change with the repo's relevant typecheck, tests, linter, or build when available.

## Code Standards

- Use intention-revealing names for variables, functions, files, types, and interfaces.
- Avoid magic values. Extract constants when a value represents business meaning, a limit, a timeout, or a repeated configuration.
- Keep functions single-purpose. Extract validation, transformation, persistence, formatting, and side-effect logic into separate helpers when that improves clarity.
- Favor pure functions for business logic. Keep I/O, framework calls, network requests, database access, and UI effects at clear boundaries.
- Make dependencies explicit through parameters, imports, or narrow service objects. Avoid hidden global state unless it is an established project pattern.
- Use precise TypeScript types and interfaces. Avoid `any` unless the boundary is genuinely unknown and a safer type guard follows immediately.
- Return consistent shapes from related functions. Avoid mixed return conventions such as sometimes returning `null`, sometimes throwing, and sometimes returning partial data without a clear reason.

## Function Comments

Add a standard comment to every function that is created or modified. Prefer JSDoc for TypeScript and JavaScript.

Each function comment must explain:

- Purpose: why the function exists or what business rule it represents.
- Parameters: what each parameter means, especially IDs, options, callbacks, and values with constraints.
- Return value: what the caller receives, including important empty or error cases.
- Errors: when the function can throw or reject, if applicable.

Keep comments professional and useful. Explain business intent and edge cases instead of restating obvious implementation steps.

```ts
/**
 * Builds the public tier summary used by list cards.
 *
 * @param tier - Tier data loaded from the persistence layer.
 * @param viewerId - Current viewer id used to resolve viewer-specific permissions.
 * @returns A display-ready tier summary with permission flags.
 * @throws Error when the tier is missing required ownership data.
 */
function buildTierSummary(tier: TierRecord, viewerId: string): TierSummary {
  // Implementation
}
```

## Debuggability

- Throw meaningful errors that include the failed action and enough non-sensitive context to locate the problem.
- Do not swallow errors silently. If an error is intentionally ignored, document the business reason.
- Validate external inputs at boundaries: route handlers, server actions, CLI arguments, environment variables, API responses, and database results.
- Keep logs professional, sparse, and actionable. Do not include emojis in logs.
- Avoid broad `catch` blocks that convert all failures into vague messages. Preserve original errors with `cause` when supported.

```ts
throw new Error("Unable to create tier list because the owner id is missing.", {
  cause: error,
});
```

## Future Maintenance

- Prefer modular code that can accept new use cases without rewriting existing behavior.
- Isolate business rules from UI rendering and framework-specific glue.
- Use narrow helper functions instead of large utility modules with unrelated responsibilities.
- Keep public function contracts stable. If a contract changes, update all call sites and related tests.
- Add focused tests when refactoring shared logic, fixing a bug, or introducing important branching behavior.

## Strict Prohibitions

- Do not use emojis in code comments, documentation, commit messages, console logs, test names, or generated copy related to code.
- Do not add comments that merely narrate syntax, such as "increment i" or "set value".
- Do not hide complexity behind vague names like `handleData`, `processItem`, `doStuff`, or `temp` unless the surrounding domain makes them unambiguous.
- Do not introduce broad abstractions only for possible future use. Extract abstractions only when they clarify real current behavior or match an existing pattern.
