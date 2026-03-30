# Page Patterns

Use these examples as a starting point and adapt them to the requested route.

## Basic Server Page

Create `src/app/[route_name]/page.tsx` as a Server Component with static metadata and a Tailwind shell:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Tiers List",
  description: "Compare plans and choose the best fit for your workflow.",
};

export default function PricingPage() {
  return (
    <div className="min-h-svh bg-background">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16 md:px-10">
        <header className="max-w-2xl space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Pricing
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Choose a plan that matches your team.
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Start with a clean server-rendered page and add interactivity only
            where it is needed.
          </p>
        </header>

        <main className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
            Starter content
          </article>
          <article className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
            More content
          </article>
        </main>
      </section>
    </div>
  );
}
```

## Interactive Page

When the page needs browser state or event handlers, keep the page server-side and compose a route-local Client Component:

```tsx
import type { Metadata } from "next";
import { PreferencesClient } from "./_components/preferences-client";

export const metadata: Metadata = {
  title: "Preferences | Tiers List",
  description: "Adjust workspace preferences and preview changes instantly.",
};

export default function PreferencesPage() {
  return (
    <div className="min-h-svh bg-background">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16 md:px-10">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Preferences
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Tune your workspace.
          </h1>
        </header>

        <PreferencesClient />
      </section>
    </div>
  );
}
```

```tsx
"use client";

import { useState } from "react";

export function PreferencesClient() {
  const [compactMode, setCompactMode] = useState(false);

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <button
        type="button"
        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        onClick={() => setCompactMode((value) => !value)}
      >
        Toggle compact mode
      </button>

      <p className="mt-4 text-sm text-muted-foreground">
        Compact mode is {compactMode ? "enabled" : "disabled"}.
      </p>
    </section>
  );
}
```

## Form Route

For forms, create a route-local Server Action plus a shared schema in `src/lib/validations`.

Suggested file layout:

```text
src/app/contact/page.tsx
src/app/contact/actions.ts
src/app/contact/_components/contact-form.tsx
src/lib/validations/contact.schema.ts
```

`src/app/contact/page.tsx`

```tsx
import type { Metadata } from "next";
import { ContactForm } from "./_components/contact-form";

export const metadata: Metadata = {
  title: "Contact | Tiers List",
  description: "Send a request and get a response from the team.",
};

export default function ContactPage() {
  return (
    <div className="min-h-svh bg-background">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16 md:px-10">
        <header className="max-w-2xl space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Contact
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Tell us what you need.
          </h1>
          <p className="text-base text-muted-foreground">
            Keep the page server-rendered and delegate form behavior to a
            route-local Client Component.
          </p>
        </header>

        <ContactForm />
      </section>
    </div>
  );
}
```

`src/lib/validations/contact.schema.ts`

```ts
import { z } from "zod";

export const ContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Enter a valid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactInput = z.infer<typeof ContactSchema>;
```

`src/app/contact/actions.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { ContactSchema } from "@/lib/validations/contact.schema";

type ContactActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialContactActionState: ContactActionState = {
  success: false,
  message: "",
};

export async function submitContactAction(
  _prevState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Persist or send the validated data here.

  revalidatePath("/contact");

  return {
    success: true,
    message: "Your request has been sent.",
  };
}
```

`src/app/contact/_components/contact-form.tsx`

```tsx
"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ContactSchema,
  type ContactInput,
} from "@/lib/validations/contact.schema";
import {
  initialContactActionState,
  submitContactAction,
} from "../actions";

export function ContactForm() {
  const [serverState, formAction, pending] = useActionState(
    submitContactAction,
    initialContactActionState,
  );

  const {
    register,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  return (
    <form action={formAction} className="grid gap-5 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Name
        </label>
        <input
          id="name"
          className="rounded-2xl border border-border bg-background px-4 py-3"
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="rounded-2xl border border-border bg-background px-4 py-3"
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="message" className="text-sm font-medium text-foreground">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          className="rounded-2xl border border-border bg-background px-4 py-3"
          {...register("message")}
        />
        {errors.message ? (
          <p className="text-sm text-destructive">{errors.message.message}</p>
        ) : null}
      </div>

      {serverState.message ? (
        <p
          className={serverState.success ? "text-sm text-primary" : "text-sm text-destructive"}
          aria-live="polite"
        >
          {serverState.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground"
      >
        {pending ? "Sending..." : "Send request"}
      </button>
    </form>
  );
}
```

If the page needs custom submit orchestration from react-hook-form, keep the server action in `actions.ts` and invoke it from the client submit handler. Still validate with `ContactSchema.safeParse()` inside the action before mutating data.
