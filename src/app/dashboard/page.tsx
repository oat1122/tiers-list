import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Images,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./_components/sign-out-button";

const portalLinkClassName =
  "inline-flex h-7 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border border-transparent bg-primary px-2.5 text-[0.8rem] font-medium whitespace-nowrap text-primary-foreground transition-all outline-none hover:bg-primary/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const portalGhostLinkClassName =
  "inline-flex h-auto items-center justify-center rounded-lg px-0 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description:
    "Choose an admin workspace for Tier Lists and Picture Reveal.",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.07),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.10),_transparent_30%)] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border-border/70 bg-background/90 shadow-sm">
          <CardContent className="flex flex-col gap-6 px-6 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="warning">
                    <LayoutDashboard className="mr-1 size-3.5" />
                    Admin Portal
                  </Badge>
                  <Badge variant="secondary">{session.user.email}</Badge>
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                    Choose the workspace you want to manage
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                    Keep Tier Lists and Picture Reveal separated so each admin
                    flow stays easier to operate, review, and extend.
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-border/70 bg-background/88 shadow-sm">
                <CardHeader className="space-y-3">
                  <Badge variant="secondary" className="w-fit">
                    <Sparkles className="mr-1 size-3.5" />
                    Tier Lists
                  </Badge>
                  <div className="space-y-2">
                    <CardTitle>Manage every list and template</CardTitle>
                    <CardDescription>
                      Open the Tier Lists workspace to search, edit, publish,
                      and manage template content from one place.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Includes active lists, public lists, templates, and trash.
                  </p>
                  <Link
                    href="/dashboard/tier-lists"
                    className={portalLinkClassName}
                  >
                    Open workspace
                    <ArrowRight className="size-4" />
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-background/88 shadow-sm">
                <CardHeader className="space-y-3">
                  <Badge variant="secondary" className="w-fit">
                    <Images className="mr-1 size-3.5" />
                    Picture Reveal
                  </Badge>
                  <div className="space-y-2">
                    <CardTitle>Build and manage reveal games</CardTitle>
                    <CardDescription>
                      Configure game settings, image content, hidden answers,
                      and host-run gameplay assets for Picture Reveal.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Covers draft games, publishing, image grids, and scoring
                    settings.
                  </p>
                  <Link
                    href="/dashboard/picture-reveal"
                    className={portalLinkClassName}
                  >
                    Open workspace
                    <ArrowRight className="size-4" />
                  </Link>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
              <p>
                Signed in as{" "}
                <span className="font-medium text-foreground">
                  {session.user.name}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Link href="/" className={cn(portalGhostLinkClassName)}>
                  Back to home
                </Link>
                <SignOutButton />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
