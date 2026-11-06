import { Skeleton } from "@/components/ui/skeleton";

export default function PublicLoading() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
      <p role="status" className="sr-only">
        Loading
      </p>

      <div className="grid gap-10 pt-6 pb-4 lg:grid-cols-12 lg:gap-12 lg:pt-10">
        <div className="order-last flex flex-col gap-4 lg:order-first lg:col-span-4">
          <Skeleton className="h-8 w-40" />
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center gap-4 py-3">
              <Skeleton className="aspect-[4/3] w-28 shrink-0 rounded-md sm:w-32" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-5 lg:col-span-8">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-9 w-4/5" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="aspect-video w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-10 py-16">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex flex-col gap-4">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
