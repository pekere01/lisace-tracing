import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton({ withAction }: { withAction?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      {withAction && <Skeleton className="h-8 w-32" />}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b-2 border-ink px-3 py-2.5">
        <div className="flex gap-6">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
      </div>
      <div className="flex flex-col">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="flex items-center gap-6 border-b border-dashed border-kraft-shadow/40 px-3 py-3 last:border-0"
          >
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-3.5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton({ blocks = 3 }: { blocks?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: blocks }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <Skeleton className="mb-4 h-4 w-32" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShelfSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <Skeleton className="mb-4 h-4 w-48" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-32 w-[210px] shrink-0 rounded-md" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
