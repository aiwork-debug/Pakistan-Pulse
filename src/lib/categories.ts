import type { Category, CategoryNode, CategoryWithCount, PostSummary } from "@/lib/types";

/*
 * Helpers for the two-level category tree (sections and their subcategories).
 * Pure functions with no server imports, so client components can use them too.
 */

/** Top-level sections, alphabetical, each with its subcategories. A parent's count includes its children. */
export function buildCategoryTree(categories: CategoryWithCount[]): CategoryNode[] {
  const byName = (a: Category, b: Category) => a.name.localeCompare(b.name);
  const topIds = new Set(categories.filter((category) => !category.parentId).map((category) => category.id));
  return categories
    .filter((category) => !category.parentId)
    .sort(byName)
    .map((parent) => {
      const children = categories.filter((child) => child.parentId === parent.id).sort(byName);
      return {
        ...parent,
        postCount: parent.postCount + children.reduce((sum, child) => sum + child.postCount, 0),
        children,
      };
    })
    .concat(
      // A subcategory whose parent is missing is shown as a top-level section instead of vanishing.
      categories
        .filter((category) => category.parentId && !topIds.has(category.parentId))
        .map((orphan) => ({ ...orphan, children: [] })),
    );
}

/** Same as buildCategoryTree for lists without counts (the footer, the editor). */
export function categoryTree(categories: Category[]): (Category & { children: Category[] })[] {
  return buildCategoryTree(categories.map((category) => ({ ...category, postCount: 0 })));
}

/** The top-level section a story belongs to: its category's parent, or the category itself. */
export function sectionOf(post: PostSummary): { slug: string; name: string } | null {
  if (!post.category) return null;
  return post.category.parent ?? { slug: post.category.slug, name: post.category.name };
}

/** True when the story is filed under `slug` or one of its subcategories. */
export function postInCategory(post: PostSummary, slug: string): boolean {
  return post.category?.slug === slug || post.category?.parent?.slug === slug;
}

export type Topic = {
  slug: string;
  name: string;
  count: number;
  children: { slug: string; name: string; count: number }[];
};

/**
 * The sections and subcategories a set of stories covers, most used first. Drives the
 * "what this author writes about" filter chips on author pages.
 */
export function topicsFromPosts(posts: PostSummary[]): Topic[] {
  const sections = new Map<string, Topic>();
  for (const post of posts) {
    const section = sectionOf(post);
    if (!section || !post.category) continue;
    const topic = sections.get(section.slug) ?? { ...section, count: 0, children: [] };
    topic.count += 1;
    if (post.category.parent) {
      const child = topic.children.find((candidate) => candidate.slug === post.category?.slug);
      if (child) child.count += 1;
      else topic.children.push({ slug: post.category.slug, name: post.category.name, count: 1 });
    }
    sections.set(section.slug, topic);
  }
  const byCount = (a: { count: number; name: string }, b: { count: number; name: string }) =>
    b.count - a.count || a.name.localeCompare(b.name);
  return [...sections.values()]
    .map((topic) => ({ ...topic, children: [...topic.children].sort(byCount) }))
    .sort(byCount);
}
