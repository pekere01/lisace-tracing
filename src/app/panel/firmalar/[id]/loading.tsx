import { Skeleton } from "@/components/ui/skeleton";
import { FormSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-md" />
        <div className="flex-1">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="mt-1.5 h-3 w-40" />
        </div>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <FormSkeleton blocks={2} />
        <FormSkeleton blocks={2} />
      </div>
    </div>
  );
}
