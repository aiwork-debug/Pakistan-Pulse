import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { CategoryGrid } from "@/components/feed/category-grid";
import { EmptyState } from "@/components/feed/empty-state";
import { buildCategoryTree } from "@/lib/categories";
import { getCategoriesWithCounts } from "@/lib/data";
import { kicker } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Categories",
  description: "Every Pulse section, with the number of published stories in each.",
};

export default async function CategoriesPage() {
  const categories = buildCategoryTree(await getCategoriesWithCounts());

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
      <header className="flex flex-col gap-6 py-12 sm:py-16">
        <p className={kicker}>Sections</p>
        <h1 className="font-serif text-5xl leading-tight font-bold text-ink lg:text-6xl">Categories</h1>
        <p className="max-w-2xl text-lg leading-8 text-muted">
          Choose a section, or one of its subcategories, to see every published story in it.
        </p>
      </header>
      {categories.length > 0 ? (
        <CategoryGrid categories={categories} headingLevel="h2" />
      ) : (
        <EmptyState icon={FolderOpen} title="No categories yet" description="Categories appear here once they are set up." />
      )}
    </div>
  );
}
