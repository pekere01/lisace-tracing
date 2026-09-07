import { PageHeaderSkeleton, FormSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <FormSkeleton blocks={4} />
    </div>
  );
}
