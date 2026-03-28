name: zustand-state-management
description: |
  Strict guidelines for using Zustand v5 in a Next.js 16 (App Router) and React 19 environment.
  Enforces correct TypeScript syntax (double parentheses), client-side directives, and performance best practices.
user-invocable: true
---

# Zustand v5 State Management Guide

**Framework**: Next.js 16 (App Router)
**State Library**: Zustand v5.x
**Language**: TypeScript 5.x



## 1. ⚠️ CRITICAL: TypeScript Syntax in Zustand v5

Zustand v5 requires a specific syntax for TypeScript to correctly infer types. You MUST use the **curried function syntax (double parentheses)** when creating a store.

* **Incorrect (v3/v4 style)**: `create<StoreType>((set) => (...))`
* **CORRECT (v5 style)**: `create<StoreType>()((set) => (...))`


## 2. Next.js App Router Rules

Zustand stores hold client-side state. Therefore, any file defining or exporting a Zustand store, or any component consuming it, MUST be a Client Component.

* Always add `"use client";` at the very top of the store file.
* Do not attempt to read or write to a Zustand store inside a Server Component.



## 3. Performance & Re-render Optimization

To prevent unnecessary re-renders (especially crucial for drag-and-drop interfaces and animations):

* **NEVER destructure the entire store**: 
  * ❌ `const { items, moveItem } = useTierStore()` (Causes the component to re-render whenever ANY state in the store changes).
* **ALWAYS use atomic selectors**:
  * ✅ `const items = useTierStore((state) => state.items)`
  * ✅ `const moveItem = useTierStore((state) => state.moveItem)`
* Alternatively, use a custom selector function or `useShallow` from `zustand/react/shallow` if selecting multiple properties.



## 4. Standard Store Structure Template

When generating a new store, use the following pattern. Separate the State and Actions into a combined TypeScript interface.

```typescript
"use client";

import { create } from "zustand";

// 1. Define the types for your data
export interface Item {
  id: string;
  content: string;
  tierId: string;
}

// 2. Define the Store Interface (State + Actions)
interface TierStore {
  // State
  items: Item[];
  isDragging: boolean;
  
  // Actions
  setItems: (items: Item[]) => void;
  moveItem: (itemId: string, newTierId: string) => void;
  setIsDragging: (isDragging: boolean) => void;
  resetStore: () => void;
}

// 3. Create the store using double parentheses create<T>()(...)
export const useTierStore = create<TierStore>()((set) => ({
  // Initial State
  items: [],
  isDragging: false,

  // Action Implementations
  setItems: (items) => set({ items }),
  
  moveItem: (itemId, newTierId) => 
    set((state) => ({
      items: state.items.map((item) => 
        item.id === itemId ? { ...item, tierId: newTierId } : item
      )
    })),
    
  setIsDragging: (isDragging) => set({ isDragging }),
  
  resetStore: () => set({ items: [], isDragging: false }),
}));
```



## 5. Middleware (Persist, Devtools)

If the user requests state persistence (saving to `localStorage`), wrap the store creator with the `persist` middleware. Ensure you handle React Hydration properly in Next.js when using `persist`, as server-rendered HTML will not match the persisted client state initially.

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "settings-storage", // unique name for localStorage key
    }
  )
);
```
