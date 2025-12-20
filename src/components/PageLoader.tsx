import { Skeleton } from '@/components/ui/skeleton';

export function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse font-serif text-xl text-muted-foreground">Loading...</div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="h-16 border-b border-border" />
      
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl space-y-8">
          {/* Title skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
          
          {/* Tabs skeleton */}
          <Skeleton className="h-12 w-full max-w-xl" />
          
          {/* Content skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function DropSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="h-16 border-b border-border" />
      
      <main className="pt-20">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Image skeleton */}
          <Skeleton className="aspect-square" />
          
          {/* Content skeleton */}
          <div className="p-6 lg:p-12 space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
