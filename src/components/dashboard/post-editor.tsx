"use client";

import { clsx } from "clsx";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  archivePostAction,
  savePostAction,
  unpublishPostAction,
  type SaveIntent,
} from "@/app/actions/posts";
import { BlockFields } from "@/components/dashboard/block-fields";
import { BLOCK_ICONS, BlockToolbar } from "@/components/dashboard/block-toolbar";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { StoryKindPicker, type StoryKind } from "@/components/dashboard/story-kind-picker";
import { ToastMessage } from "@/components/ui/toast-message";
import { blockToInput } from "@/lib/blocks";
import { categoryTree } from "@/lib/categories";
import { formatTime } from "@/lib/format";
import {
  COVER_ALT_MAX,
  DEK_MAX,
  TITLE_MAX,
  TITLE_MIN,
  estimateReadMinutes,
  type BlockInput,
  type BlockInputType,
  type FieldErrors,
  type PostInput,
} from "@/lib/post-schemas";
import { slugify } from "@/lib/slug";
import type { Category, EditablePost, PostStatus } from "@/lib/types";
import { buttonGhost, buttonPrimary, buttonSecondary, focusRing, inputBase } from "@/lib/ui";

type PostEditorProps = {
  post: EditablePost | null;
  categories: Category[];
};

type EditorBlock = { key: string; data: BlockInput };

const AUTOSAVE_MS = 30_000;

const BLOCK_TYPES: { type: BlockInputType; label: string }[] = [
  { type: "paragraph", label: "Paragraph" },
  { type: "heading", label: "Heading" },
  { type: "quote", label: "Quote" },
  { type: "image", label: "Image" },
  { type: "youtube", label: "YouTube" },
  { type: "tweet", label: "Social post" },
  { type: "video", label: "Video" },
];

function emptyBlock(type: BlockInputType): BlockInput {
  switch (type) {
    case "paragraph":
    case "heading":
      return { type, text: "" };
    case "quote":
      return { type, text: "", attribution: "" };
    case "image":
      return { type, url: "", alt: "", caption: "" };
    case "youtube":
      return { type, url: "", title: "" };
    case "tweet":
      return { type, author: "", handle: "", text: "" };
    case "video":
      return { type, src: "", poster: "", title: "" };
  }
}

/** The block a story kind opens with. A written story has no required lead block. */
const LEAD_BLOCK: Record<StoryKind, BlockInputType | null> = {
  article: null,
  photo: "image",
  video: "video",
  youtube: "youtube",
};

const MEDIA_TYPES: BlockInputType[] = ["image", "video", "youtube"];

/** The kind shown in the picker, read from the story's first block. */
function kindOf(blocks: EditorBlock[]): StoryKind {
  const first = blocks[0]?.data.type;
  if (first === "image") return "photo";
  if (first === "video") return "video";
  if (first === "youtube") return "youtube";
  return "article";
}

/** True when every field of a block is still empty. */
function isBlank(block: BlockInput): boolean {
  return Object.entries(block).every(([key, value]) => key === "type" || value === "");
}

function blockLabel(type: BlockInputType) {
  return BLOCK_TYPES.find((entry) => entry.type === type)?.label ?? type;
}

/**
 * Story editor. Admins save drafts and publish directly; there is no approval step.
 * Every write goes through the server actions in src/app/actions/posts.ts, which re-check
 * the session, validate, sanitise, and write an audit entry.
 */
export function PostEditor({ post, categories }: PostEditorProps) {
  const keyCounter = useRef(0);
  const nextKey = () => `b${keyCounter.current++}`;

  const [id, setId] = useState<string | null>(post?.id ?? null);
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "DRAFT");
  const [publishedSlug, setPublishedSlug] = useState<string | null>(post?.status === "PUBLISHED" ? post.slug : null);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [dek, setDek] = useState(post?.dek ?? "");
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? "");
  const [coverAlt, setCoverAlt] = useState(post?.coverAlt ?? "");
  const [readMinutes, setReadMinutes] = useState(post?.readMinutes ?? 1);
  const [readTouched, setReadTouched] = useState(Boolean(post));
  const [blocks, setBlocks] = useState<EditorBlock[]>(() =>
    (post?.blocks ?? []).map((block) => ({ key: nextKey(), data: blockToInput(block) })),
  );

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(post?.updatedAt ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const savedVersion = useRef(0);
  const savingRef = useRef(false);

  const changed = useCallback(() => setVersion((value) => value + 1), []);
  const dirty = version !== savedVersion.current;

  const estimate = useMemo(
    () => estimateReadMinutes(title, dek, blocks.map((block) => block.data)),
    [title, dek, blocks],
  );
  const effectiveReadMinutes = readTouched ? readMinutes : estimate;
  const effectiveSlug = slugTouched ? slug : slugify(title);

  const buildInput = useCallback(
    (): PostInput => ({
      title,
      slug: effectiveSlug,
      dek,
      categoryId,
      coverImageUrl,
      coverAlt,
      readMinutes: effectiveReadMinutes,
      blocks: blocks.map((block) => block.data),
    }),
    [title, effectiveSlug, dek, categoryId, coverImageUrl, coverAlt, effectiveReadMinutes, blocks],
  );

  const save = useCallback(
    async (intent: SaveIntent) => {
      if (savingRef.current) return;
      savingRef.current = true;
      const versionAtSave = version;
      setBusy(intent);
      if (intent !== "autosave") setMessage(null);

      const result = await savePostAction(id, buildInput(), intent);
      savingRef.current = false;
      setBusy(null);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setMessage({ tone: "error", text: intent === "autosave" ? `Autosave failed: ${result.error}` : result.error });
        return;
      }

      setFieldErrors({});
      savedVersion.current = versionAtSave;
      setSavedAt(result.savedAt);
      setStatus(result.status);
      setSlug(result.slug);
      setSlugTouched(true);
      setPublishedSlug(result.status === "PUBLISHED" ? result.slug : null);
      if (!id) {
        setId(result.id);
        // Keep the editor mounted; just give the new draft its permanent URL.
        window.history.replaceState(null, "", `/dashboard/posts/${result.id}`);
      }
      if (intent === "publish") setMessage({ tone: "success", text: "Published. The story is live now." });
      else if (intent === "draft") setMessage({ tone: "success", text: "Draft saved." });
    },
    [id, buildInput, version],
  );

  // Autosave 30 seconds after the last change, for drafts with a valid title only.
  useEffect(() => {
    if (!dirty || status !== "DRAFT") return;
    const trimmed = title.trim();
    if (trimmed.length < TITLE_MIN || trimmed.length > TITLE_MAX) return;
    const timer = setTimeout(() => void save("autosave"), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [version, dirty, status, title, save]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  async function changeStatus(kind: "unpublish" | "archive") {
    if (!id) return;
    setBusy(kind);
    setMessage(null);
    const result = kind === "unpublish" ? await unpublishPostAction(id) : await archivePostAction(id);
    setBusy(null);
    if (!result.ok) {
      setMessage({ tone: "error", text: result.error });
      return;
    }
    setStatus(result.status);
    setPublishedSlug(null);
    setMessage({
      tone: "success",
      text: kind === "archive" ? "Archived. The story is hidden from public pages." : "Moved back to drafts. The story is no longer public.",
    });
  }

  function updateBlocks(updater: (current: EditorBlock[]) => EditorBlock[]) {
    setBlocks(updater);
    changed();
  }

  // After a block is added from the toolbar, scroll to it and focus its first field.
  const [focusKey, setFocusKey] = useState<string | null>(null);
  useEffect(() => {
    if (!focusKey) return;
    const element = document.getElementById(`editor-block-${focusKey}`);
    if (element) {
      element.scrollIntoView({ block: "center", behavior: "smooth" });
      element.querySelector<HTMLElement>("input, textarea")?.focus({ preventScroll: true });
    }
    setFocusKey(null);
  }, [focusKey, blocks]);

  function addBlock(type: BlockInputType) {
    const key = nextKey();
    updateBlocks((current) => [...current, { key, data: emptyBlock(type) }]);
    setFocusKey(key);
  }

  /** Switches the story kind: replaces an untouched lead media block, or adds the new one on top. */
  function chooseKind(kind: StoryKind) {
    const lead = LEAD_BLOCK[kind];
    const [first, ...others] = blocks;
    const rest = first && MEDIA_TYPES.includes(first.data.type) && isBlank(first.data) ? others : blocks;
    if (!lead || rest[0]?.data.type === lead) {
      updateBlocks(() => rest);
      return;
    }
    const key = nextKey();
    updateBlocks(() => [{ key, data: emptyBlock(lead) }, ...rest]);
    setFocusKey(key);
  }

  function moveBlock(index: number, direction: -1 | 1) {
    updateBlocks((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const errorFor = (key: string) => fieldErrors[key];
  const describedBy = (...ids: Array<string | false | undefined>) => ids.filter(Boolean).join(" ") || undefined;
  const control = (key: string) => clsx(inputBase, fieldErrors[key] ? "border-ink" : "border-border");
  const ErrorText = ({ name }: { name: string }) =>
    fieldErrors[name] ? (
      <p id={`editor-${name}-error`} className="border-l-2 border-ink pl-2 text-sm text-ink">
        {fieldErrors[name]}
      </p>
    ) : null;

  const isPublished = status === "PUBLISHED";

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="font-sans text-2xl font-semibold text-ink">{id ? "Edit story" : "New story"}</h1>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-muted" aria-live="polite">
            {busy === "autosave"
              ? "Saving..."
              : savedAt
                ? `Saved at ${formatTime(savedAt)} UTC${dirty ? " · unsaved changes" : ""}`
                : "Not saved yet"}
            {status === "DRAFT" ? " · Autosaves every 30 seconds" : " · Autosave is paused while a story is not a draft"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {publishedSlug ? (
            <Link href={`/post/${publishedSlug}`} target="_blank" className={clsx(buttonGhost, "h-10")}>
              <ExternalLink aria-hidden="true" className="size-4" />
              View live<span className="sr-only"> (opens in a new tab)</span>
            </Link>
          ) : null}
          <button type="button" disabled={busy !== null} onClick={() => void save("draft")} className={clsx(buttonSecondary, "h-10")}>
            {busy === "draft" ? "Saving..." : isPublished ? "Save as draft" : "Save draft"}
          </button>
          <button type="button" disabled={busy !== null} onClick={() => void save("publish")} className={clsx(buttonPrimary, "h-10")}>
            {busy === "publish" ? "Publishing..." : isPublished ? "Update live story" : "Publish"}
          </button>
        </div>
      </header>

      {message ? <ToastMessage tone={message.tone}>{message.text}</ToastMessage> : null}

      <StoryKindPicker value={kindOf(blocks)} onChange={chooseKind} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Main column */}
        <div className="flex flex-col gap-6">
          <BlockToolbar blockTypes={BLOCK_TYPES} onAdd={addBlock} />

          <section aria-labelledby="editor-basics" className="flex flex-col gap-5 rounded-xl border border-border bg-paper p-6">
            <h2 id="editor-basics" className="text-lg font-semibold text-ink">
              Basics
            </h2>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor="editor-title" className="text-sm font-semibold text-ink">
                  Title
                </label>
                <span id="editor-title-count" className="text-sm text-muted">
                  {title.length} / {TITLE_MAX}
                </span>
              </div>
              <input
                id="editor-title"
                type="text"
                value={title}
                maxLength={TITLE_MAX}
                aria-invalid={errorFor("title") ? true : undefined}
                aria-describedby={describedBy("editor-title-count", errorFor("title") && "editor-title-error")}
                onChange={(event) => {
                  setTitle(event.target.value);
                  changed();
                }}
                className={clsx(control("title"), "h-12 font-serif text-xl")}
              />
              <ErrorText name="title" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="editor-slug" className="text-sm font-semibold text-ink">
                Slug
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">/post/</span>
                <input
                  id="editor-slug"
                  type="text"
                  value={effectiveSlug}
                  maxLength={80}
                  aria-invalid={errorFor("slug") ? true : undefined}
                  aria-describedby={describedBy("editor-slug-hint", errorFor("slug") && "editor-slug-error")}
                  onChange={(event) => {
                    setSlug(event.target.value.toLowerCase());
                    setSlugTouched(true);
                    changed();
                  }}
                  className={clsx(control("slug"), "h-11 font-mono text-sm")}
                />
              </div>
              <p id="editor-slug-hint" className="text-sm text-muted">
                Lowercase letters, numbers, and hyphens. Generated from the title until you edit it.
                {slugTouched && title ? (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => {
                        setSlugTouched(false);
                        changed();
                      }}
                      className={clsx("rounded-sm font-semibold text-primary underline-offset-4 hover:underline", focusRing)}
                    >
                      Regenerate from title
                    </button>
                  </>
                ) : null}
              </p>
              <ErrorText name="slug" />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor="editor-dek" className="text-sm font-semibold text-ink">
                  Summary (dek)
                </label>
                <span id="editor-dek-count" className="text-sm text-muted">
                  {dek.length} / {DEK_MAX}
                </span>
              </div>
              <textarea
                id="editor-dek"
                rows={3}
                value={dek}
                maxLength={DEK_MAX}
                aria-invalid={errorFor("dek") ? true : undefined}
                aria-describedby={describedBy("editor-dek-count", errorFor("dek") && "editor-dek-error")}
                onChange={(event) => {
                  setDek(event.target.value);
                  changed();
                }}
                className={clsx(control("dek"), "py-2.5 leading-7")}
              />
              <ErrorText name="dek" />
            </div>
          </section>

          {/* Cover image: required before a story can be published */}
          <section aria-labelledby="editor-cover" className="flex flex-col gap-5 rounded-xl border border-border bg-paper p-6">
            <div className="flex flex-col gap-1">
              <h2 id="editor-cover" className="text-lg font-semibold text-ink">
                Cover image
              </h2>
              <p className="text-sm text-muted">
                Shown on the homepage, in story lists, and at the top of the story. Required to publish.
              </p>
            </div>

            {coverImageUrl ? (
              <div className="flex flex-col gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview of an upload */}
                <img
                  src={coverImageUrl}
                  alt={coverAlt || "Cover image preview"}
                  className="aspect-video w-full rounded-lg border border-border bg-surface object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverImageUrl("");
                    changed();
                  }}
                  className={clsx(buttonGhost, "h-9 w-fit px-3")}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  Remove cover image
                </button>
              </div>
            ) : (
              <div
                className={clsx(
                  "flex aspect-video w-full items-center justify-center rounded-lg border border-dashed bg-surface text-sm text-muted",
                  errorFor("coverImageUrl") ? "border-ink" : "border-border",
                )}
              >
                No cover image yet
              </div>
            )}

            <ImageUpload
              id="editor-cover-file"
              label={coverImageUrl ? "Replace cover image" : "Upload cover image"}
              onUploaded={(url, alt) => {
                setCoverImageUrl(url);
                if (!coverAlt && alt) setCoverAlt(alt);
                changed();
              }}
            />
            <ErrorText name="coverImageUrl" />

            <div className="flex flex-col gap-2">
              <label htmlFor="editor-cover-alt" className="text-sm font-semibold text-ink">
                Cover alt text
              </label>
              <input
                id="editor-cover-alt"
                type="text"
                value={coverAlt}
                maxLength={COVER_ALT_MAX}
                aria-invalid={errorFor("coverAlt") ? true : undefined}
                aria-describedby={describedBy("editor-cover-alt-hint", errorFor("coverAlt") && "editor-coverAlt-error")}
                onChange={(event) => {
                  setCoverAlt(event.target.value);
                  changed();
                }}
                className={clsx(control("coverAlt"), "h-11")}
              />
              <p id="editor-cover-alt-hint" className="text-sm text-muted">
                Describe what the photo shows, for readers who cannot see it.
              </p>
              <ErrorText name="coverAlt" />
            </div>
          </section>

          {/* Body blocks */}
          <section aria-labelledby="editor-body" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 id="editor-body" className="text-lg font-semibold text-ink">
                Story body
              </h2>
              <span className="text-sm text-muted">
                {blocks.length} {blocks.length === 1 ? "block" : "blocks"}
              </span>
            </div>
            {fieldErrors.blocks ? (
              <p id="editor-blocks-error" className="border-l-2 border-ink pl-2 text-sm text-ink">
                {fieldErrors.blocks}
              </p>
            ) : null}

            {blocks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-paper p-8 text-center text-sm text-muted">
                Nothing here yet. Use the Add toolbar above to start with a paragraph, image, or video.
              </div>
            ) : (
              <ol className="flex flex-col gap-4">
                {blocks.map((block, index) => {
                  const label = `${blockLabel(block.data.type)} ${index + 1}`;
                  const BlockIcon = BLOCK_ICONS[block.data.type];
                  return (
                    <li
                      key={block.key}
                      id={`editor-block-${block.key}`}
                      className="scroll-mt-24 rounded-xl border border-border bg-paper p-5"
                    >
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                          <BlockIcon aria-hidden="true" className="size-4" />
                          {index + 1}. {blockLabel(block.data.type)}
                        </p>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveBlock(index, -1)}
                            aria-label={`Move ${label} up`}
                            className={clsx("flex size-9 items-center justify-center rounded-md text-ink hover:bg-surface disabled:opacity-40", focusRing)}
                          >
                            <ArrowUp aria-hidden="true" className="size-4" />
                          </button>
                          <button
                            type="button"
                            disabled={index === blocks.length - 1}
                            onClick={() => moveBlock(index, 1)}
                            aria-label={`Move ${label} down`}
                            className={clsx("flex size-9 items-center justify-center rounded-md text-ink hover:bg-surface disabled:opacity-40", focusRing)}
                          >
                            <ArrowDown aria-hidden="true" className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBlocks((current) => current.filter((item) => item.key !== block.key))}
                            aria-label={`Remove ${label}`}
                            className={clsx("flex size-9 items-center justify-center rounded-md text-ink hover:bg-surface", focusRing)}
                          >
                            <Trash2 aria-hidden="true" className="size-4" />
                          </button>
                        </div>
                      </div>
                      <BlockFields
                        block={block.data}
                        error={fieldErrors[`blocks.${index}`]}
                        onChange={(next) =>
                          updateBlocks((current) =>
                            current.map((item) => (item.key === block.key ? { ...item, data: next } : item)),
                          )
                        }
                      />
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="flex flex-col gap-3 rounded-xl border border-border bg-paper p-5">
              <p className="text-sm font-semibold text-ink">Add a block</p>
              <div className="flex flex-wrap gap-2">
                {BLOCK_TYPES.map((entry) => (
                  <button
                    key={entry.type}
                    type="button"
                    onClick={() => addBlock(entry.type)}
                    className={clsx(buttonSecondary, "h-9 px-3")}
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    {entry.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Side column */}
        <aside className="flex flex-col gap-6">
          <section aria-labelledby="editor-settings" className="flex flex-col gap-5 rounded-xl border border-border bg-paper p-6">
            <h2 id="editor-settings" className="text-lg font-semibold text-ink">
              Settings
            </h2>

            <div className="flex flex-col gap-2">
              <label htmlFor="editor-category" className="text-sm font-semibold text-ink">
                Category
              </label>
              <select
                id="editor-category"
                value={categoryId}
                aria-invalid={errorFor("categoryId") ? true : undefined}
                aria-describedby={errorFor("categoryId") ? "editor-categoryId-error" : undefined}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  changed();
                }}
                className={clsx(control("categoryId"), "h-11")}
              >
                <option value="">Choose a category</option>
                {categoryTree(categories).map((section) => (
                  <optgroup key={section.id} label={section.name}>
                    <option value={section.id}>{section.name} (general)</option>
                    {section.children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ErrorText name="categoryId" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="editor-read" className="text-sm font-semibold text-ink">
                Read time (minutes)
              </label>
              <input
                id="editor-read"
                type="number"
                min={1}
                max={240}
                value={effectiveReadMinutes}
                aria-describedby="editor-read-hint"
                onChange={(event) => {
                  setReadMinutes(Math.max(1, Math.min(240, Number(event.target.value) || 1)));
                  setReadTouched(true);
                  changed();
                }}
                className={clsx(control("readMinutes"), "h-11 w-28")}
              />
              <p id="editor-read-hint" className="text-sm text-muted">
                Estimated {estimate} min from the word count.
                {readTouched ? (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => {
                        setReadTouched(false);
                        changed();
                      }}
                      className={clsx("rounded-sm font-semibold text-primary underline-offset-4 hover:underline", focusRing)}
                    >
                      Use estimate
                    </button>
                  </>
                ) : null}
              </p>
            </div>
          </section>

          {id ? (
            <section aria-labelledby="editor-visibility" className="flex flex-col gap-3 rounded-xl border border-border bg-paper p-6">
              <h2 id="editor-visibility" className="text-lg font-semibold text-ink">
                Visibility
              </h2>
              {status === "PUBLISHED" ? (
                <button type="button" disabled={busy !== null} onClick={() => void changeStatus("unpublish")} className={buttonSecondary}>
                  {busy === "unpublish" ? "Unpublishing..." : "Unpublish (move to drafts)"}
                </button>
              ) : null}
              {status === "ARCHIVED" ? (
                <button type="button" disabled={busy !== null} onClick={() => void changeStatus("unpublish")} className={buttonSecondary}>
                  {busy === "unpublish" ? "Restoring..." : "Restore to drafts"}
                </button>
              ) : (
                <button type="button" disabled={busy !== null} onClick={() => void changeStatus("archive")} className={buttonSecondary}>
                  {busy === "archive" ? "Archiving..." : "Archive"}
                </button>
              )}
              <p className="text-sm text-muted">
                Archived stories are hidden from public pages and kept for the record.
              </p>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
