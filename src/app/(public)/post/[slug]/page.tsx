import type { Metadata } from "next";
import { clsx } from "clsx";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorCard } from "@/components/feed/author-card";
import { AuthorByline } from "@/components/post/author-byline";
import { BackToTop } from "@/components/post/back-to-top";
import { PostBody } from "@/components/post/post-body";
import { ReadingProgress } from "@/components/post/reading-progress";
import { RelatedStories } from "@/components/post/related-stories";
import { ShareLinks } from "@/components/post/share-links";
import { TableOfContents, type TocItem } from "@/components/post/table-of-contents";
import { headingAnchor } from "@/lib/blocks";
import { getAuthorByUsername, getPostBySlug, getRelatedPosts } from "@/lib/data";
import { CoverImage } from "@/components/ui/cover-image";
import { absoluteUrl } from "@/lib/format";
import { focusRing, kicker, textLink } from "@/lib/ui";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Story not found", robots: { index: false, follow: false } };

  return {
    title: post.title,
    description: post.dek,
    alternates: { canonical: `/post/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.dek,
      url: `/post/${post.slug}`,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: post.author ? [post.author.displayName] : undefined,
      section: post.category?.name,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl, alt: post.coverAlt }] : undefined,
    },
  };
}

const crumbLink = clsx("rounded-sm hover:text-primary", focusRing);

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [related, authorProfile] = await Promise.all([
    getRelatedPosts(post, 3),
    post.author ? getAuthorByUsername(post.author.username) : Promise.resolve(null),
  ]);
  const url = absoluteUrl(`/post/${post.slug}`);
  const toc: TocItem[] = post.blocks.flatMap((block, index) =>
    block.type === "heading" && block.text ? [{ id: headingAnchor(block.text, index), text: block.text }] : [],
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.dek,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
    articleSection: post.category?.name,
    image: post.coverImageUrl ? [absoluteUrl(post.coverImageUrl)] : undefined,
    mainEntityOfPage: url,
    author: post.author
      ? { "@type": "Person", name: post.author.displayName, url: absoluteUrl(`/authors/${post.author.username}`) }
      : undefined,
    publisher: { "@type": "Organization", name: "Pulse" },
  };

  return (
    <article className="pb-16 lg:pb-24">
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Cover */}
      <div className="relative w-full">
        <CoverImage
          src={post.coverImageUrl}
          alt={post.coverAlt}
          gradient={post.coverGradient}
          sizes="100vw"
          priority
          className="aspect-[4/3] sm:aspect-[21/9]"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink/40 to-transparent" />
      </div>

      <div className="mx-auto grid max-w-[1280px] gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16 lg:px-8">
        <div className="mx-auto w-full max-w-3xl">
          {/* Header */}
          <header className="flex flex-col gap-8 pt-12 sm:pt-16">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <li>
                  <Link href="/" className={crumbLink}>
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href="/news" className={crumbLink}>
                    News
                  </Link>
                </li>
                {post.category?.parent ? (
                  <>
                    <li aria-hidden="true">/</li>
                    <li>
                      <Link href={`/news?category=${post.category.parent.slug}`} className={crumbLink}>
                        {post.category.parent.name}
                      </Link>
                    </li>
                  </>
                ) : null}
                {post.category ? (
                  <>
                    <li aria-hidden="true">/</li>
                    <li>
                      <Link href={`/news?category=${post.category.slug}`} className={clsx(crumbLink, "text-ink")}>
                        {post.category.name}
                      </Link>
                    </li>
                  </>
                ) : null}
              </ol>
            </nav>

            <div className="flex flex-col gap-6">
              {post.category ? (
                <p className={kicker}>
                  {post.category.parent ? `${post.category.parent.name} · ` : null}
                  {post.category.name}
                </p>
              ) : null}
              <h1 className="font-serif text-4xl leading-[1.15] font-bold text-ink sm:text-5xl">{post.title}</h1>
              <p className="text-xl leading-8 text-muted">{post.dek}</p>
            </div>

            {post.author ? (
              <AuthorByline
                author={post.author}
                publishedAt={post.publishedAt}
                updatedAt={post.updatedAt}
                readMinutes={post.readMinutes}
              />
            ) : null}
          </header>

          {/* Body */}
          <div className="mt-12">
            <PostBody blocks={post.blocks} />
          </div>

          {/* Footer */}
          <footer className="mt-20 flex flex-col gap-12">
            {authorProfile ? (
              <section aria-labelledby="written-by-heading" className="flex flex-col gap-4">
                <h2 id="written-by-heading" className={kicker}>
                  Written by
                </h2>
                <AuthorCard author={authorProfile} variant="compact" headingLevel="h3" className="bg-surface" />
              </section>
            ) : null}

            <ShareLinks url={url} title={post.title} />

            <Link href="/news" className={clsx(textLink, "w-fit text-sm")}>
              Back to all stories
            </Link>
          </footer>
        </div>

        {/* Table of contents, desktop only */}
        <aside className="hidden pt-16 lg:block">
          <TableOfContents items={toc} />
        </aside>
      </div>

      <div className="mx-auto mt-16 max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <RelatedStories posts={related} categoryName={post.category?.name} />
      </div>

      <BackToTop />
    </article>
  );
}
