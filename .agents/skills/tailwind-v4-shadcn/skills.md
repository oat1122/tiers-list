name: tailwind-v4-shadcn
description: |
  Comprehensive guidelines for Tailwind CSS v4 and shadcn/ui in a Next.js 16 / React 19 environment. 
  Covers v4 CSS-first architecture, strict component structure, dark mode setup, and React 19 compatibility.
user-invocable: true


# Tailwind CSS v4 & shadcn/ui - Complete Integration Guide

**Framework**: Next.js 16 (App Router)
**Styling**: Tailwind CSS v4.x
**UI Components**: shadcn/ui (v4 compatible)
**State & Theme**: next-themes
**Icons**: lucide-react



## 1. ⚠️ CRITICAL: Tailwind v4 Architecture (No Config Files)

Tailwind CSS v4 is a complete engine rewrite. You MUST follow these rules:

* **NO `tailwind.config.js` or `tailwind.config.ts`**: Do not create or read these files. They are obsolete.
* **CSS-First Configuration**: All theme customizations, colors, fonts, and keyframes MUST be defined in the main global CSS file (e.g., `app/globals.css`) using the `@theme` directive.
* **Import Syntax**: Use `@import "tailwindcss";` at the very top of your global CSS. DO NOT use `@tailwind base;`, `@tailwind components;`, or `@tailwind utilities;`.



## 2. shadcn/ui Component Management

When generating, modifying, or using shadcn/ui components:

* **CLI Usage**: Always assume components are added via CLI (`npx shadcn@latest add <component>`). Do not try to write complex primitive components (like Select, Popover, DatePicker) from scratch.
* **Directory Structure**: 
  * Primitive UI components belong in `src/components/ui/` (or `components/ui/`).
  * Page-specific or feature-specific components belong in `src/components/` or within the app router feature folders.
* **`components.json`**: Respect the `components.json` file for path aliases (usually `@/components/...` and `@/lib/utils`).



## 3. Styling Best Practices & Utilities

### The `cn` Utility
All dynamic, conditional, or merged classes MUST be wrapped in the `cn()` utility function to prevent class conflicts.

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Class Variance Authority (`cva`)
For components with distinct visual states (sizes, variants, colors), use `cva`.

```typescript
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```



## 4. Theming & Dark Mode (`next-themes`)

* **Semantic Variables**: NEVER hardcode HEX/RGB colors for UI elements. Always use semantic CSS variables mapped in Tailwind (e.g., `bg-background`, `text-muted-foreground`, `border-border`).
* **Dark Mode Setup**: Rely on `.dark` class toggled by `next-themes` on the `<html>` tag. 

**Proper v4 CSS Configuration (`app/globals.css`)**:

```css
@import "tailwindcss";

@theme {
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));

  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));

  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));

  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));

  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));

  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));

  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));

  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));

  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## 5. React 19 & Next.js 16 Component Rules

* **Server Components by Default**: Keep all UI layout and wrapper components as React Server Components (RSC) to minimize client bundle size.
* **When to use `"use client"`**:
  * Only add `"use client"` directive when a component uses hooks (`useState`, `useRef`, `useTheme`), handles user events (`onClick`, `onChange`), or utilizes browser APIs.
  * *Crucial*: Isolate client logic into small interactive components, then import them into Server Components. Do not wrap entire pages in `"use client"`.
* **Icons**: Always import icons from `lucide-react`.

```tsx
// Example of isolating client interactivity
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function CounterButton() {
  const [count, setCount] = useState(0)
  
  return (
    <Button onClick={() => setCount(prev => prev + 1)} variant="outline">
      <Plus className="w-4 h-4 mr-2" />
      Clicked {count} times
    </Button>
  )
}
```
