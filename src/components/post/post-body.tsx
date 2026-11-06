import { ImageFigure } from "@/components/post/image-figure";
import { TweetPlaceholder } from "@/components/post/tweet-placeholder";
import { VideoPlaceholder } from "@/components/post/video-placeholder";
import { YoutubeFacade } from "@/components/post/youtube-facade";
import { headingAnchor } from "@/lib/blocks";
import type { Block } from "@/lib/types";

type PostBodyProps = {
  blocks: Block[];
};

/** Renders every block type as plain React elements. Stored text is never treated as HTML. */
function renderBlock(block: Block, index: number) {
  switch (block.type) {
    case "paragraph":
      return <p className="text-lg leading-8 whitespace-pre-line text-ink">{block.text}</p>;
    case "heading":
      return (
        <h2
          id={headingAnchor(block.text, index)}
          className="scroll-mt-28 pt-6 font-serif text-3xl leading-tight font-bold text-ink"
        >
          {block.text}
        </h2>
      );
    case "quote":
      return (
        <figure className="my-4 border-l-2 border-primary pl-6 sm:pl-8">
          <blockquote className="font-serif text-2xl leading-relaxed font-semibold text-ink italic">
            {block.text}
          </blockquote>
          {block.attribution ? (
            <figcaption className="mt-4 text-sm text-muted">{block.attribution}</figcaption>
          ) : null}
        </figure>
      );
    case "image":
      return block.url ? <ImageFigure url={block.url} alt={block.alt} caption={block.caption} /> : null;
    case "youtube":
      return block.videoId ? <YoutubeFacade videoId={block.videoId} title={block.title} /> : null;
    case "tweet":
      return <TweetPlaceholder author={block.author} handle={block.handle} text={block.text} />;
    case "video":
      return <VideoPlaceholder src={block.src} poster={block.poster} title={block.title} />;
  }
}

export function PostBody({ blocks }: PostBodyProps) {
  return (
    <div className="flex flex-col gap-7">
      {blocks.map((block, index) => (
        <div key={`${block.type}-${index}`}>{renderBlock(block, index)}</div>
      ))}
    </div>
  );
}
