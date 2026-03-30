import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-svh px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Card className="border-border/70 bg-background/90 shadow-sm">
          <CardContent className="space-y-6 px-6 py-6">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-10 w-full max-w-2xl" />
              <Skeleton className="h-5 w-full max-w-3xl" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-32" />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
          <Card className="border-border/70 bg-background/88 shadow-sm">
            <CardHeader className="gap-4">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-10 w-full max-w-md" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-52" />
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card
                key={index}
                className="border-border/70 bg-background/88 shadow-sm"
              >
                <CardHeader>
                  <Skeleton className="h-7 w-36" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-40" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
