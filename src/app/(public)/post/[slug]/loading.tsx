import { Skeleton } from "@/components/ui/skeleton";

export default function PostLoading() {
  return (
    <div className="pb-16 lg:pb-24">
      <p role="status" className="sr-only">
        Loading story
      </p>
      <Skeleton className="aspect-[4/3] w-full rounded-none sm:aspect-[21/9]" />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-12 sm:px-6 sm:pt-16">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-full" />
        <div className="flex items-center gap-4 border-y border-border py-6">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-4">
          {[0, 1, 2, 3, 4, 5].map((line) => (
            <Skeleton key={line} className="h-5 w-full" />
          ))}
          <Skeleton className="h-5 w-2/3" />
        </div>
      </div>
    </div>
  );
}
