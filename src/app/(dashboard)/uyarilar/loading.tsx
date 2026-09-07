import { PageHeaderSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="flex gap-1.5">
        <Skeleton className="h-9 w-28 rounded-t-md rounded-b-none" />
        <Skeleton className="h-9 w-28 rounded-t-md rounded-b-none" />
        <Skeleton className="h-9 w-24 rounded-t-md rounded-b-none" />
      </div>
      <div className="grid grid-cols-1 gap-2 rounded-b-lg rounded-tr-lg border border-border bg-card p-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
