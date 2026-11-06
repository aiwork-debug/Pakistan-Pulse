import type { Metadata } from "next";
import { MediaLibrary } from "@/components/dashboard/media-library";
import { getMediaForUploader } from "@/lib/dashboard-data";
import { requirePageRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Media",
  robots: { index: false, follow: false },
};

export default async function MediaPage() {
  const session = await requirePageRole("ADMIN");
  const items = await getMediaForUploader(session);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-sans text-2xl font-semibold text-ink">Media</h1>
        <p className="text-sm text-muted">Images you have uploaded. Edit alt text or delete files you no longer need.</p>
      </header>
      <MediaLibrary items={items} />
    </div>
  );
}
