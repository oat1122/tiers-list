name: react-compiler-patterns
description: |
  Strict guidelines for coding with React Compiler in React 19.2.
  Enforces automatic memoization rules, bans manual useMemo/useCallback, and ensures strict adherence to React rules.
user-invocable: true

# React Compiler Patterns (React 19)

**Framework**: Next.js 16 (App Router)
**React Version**: 19.2.x
**Tooling**: babel-plugin-react-compiler


## 1. ⚠️ CRITICAL: No Manual Memoization

The React Compiler provides automatic memoization without `useMemo`, `useCallback`. The compiler understands your UI tree and automatically caches values and functions when necessary.

* **DO NOT** use `useMemo` to cache arrays, objects, or expensive calculations.
* **DO NOT** use `useCallback` to cache functions passed as props to child components.
* **DO NOT** use `React.memo()` to wrap components.


## 2. Write Idiomatic & Simple Code

Write the cleanest and most readable JavaScript/TypeScript possible. Let the compiler handle the optimization.

**❌ INCORRECT (Legacy React 18 style):**
```tsx
import { useMemo, useCallback } from "react";

export function TierList({ items, onMove }) {
  // Unnecessary manual memoization
  const activeItems = useMemo(() => items.filter(item => item.active), [items]);
  
  const handleDragEnd = useCallback((result) => {
    onMove(result);
  }, [onMove]);

  return <List items={activeItems} onDragEnd={handleDragEnd} />;
}
```

**✅ CORRECT (React 19 + Compiler style):**
```tsx
export function TierList({ items, onMove }) {
  // React Compiler automatically memoizes this
  const activeItems = items.filter(item => item.active);
  
  // React Compiler automatically memoizes this function
  const handleDragEnd = (result) => {
    onMove(result);
  };

  return <List items={activeItems} onDragEnd={handleDragEnd} />;
}
```


## 3. Strict Rules of React (Compiler Requirements)

The React Compiler acts as a strict enforcer of React rules. If you violate these rules, the compiler will "bail out" (skip optimizing your component) or cause runtime errors.

### A. Immutability
* **NEVER** mutate props, state, or context directly.
* Always return new objects/arrays when updating state (e.g., using `.map()`, `.filter()`, or spread syntax `...`).

### B. No Side Effects in Render
* Components must be pure functions. Given the same inputs (props, state, context), they must return the same JSX.
* DO NOT mutate external variables or objects during the render phase.

### C. `useRef` Strict Rules
* **DO NOT** read or write to `ref.current` during the render phase.
* `ref.current` should ONLY be accessed inside event handlers (like `onClick`) or Effects (`useEffect`).

**❌ INCORRECT (Reading ref during render):**
```tsx
function Component() {
  const renderCount = useRef(0);
  renderCount.current += 1; // ❌ Mutation during render
  return <div>Rendered {renderCount.current} times</div>; // ❌ Reading during render
}
```


## 4. Component Declaration Rules

* **DO NOT** nest component definitions inside other components. This changes the component identity on every render and destroys the compiler's ability to optimize.
* Always declare components at the top level of the module.
