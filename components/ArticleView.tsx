import { stampHeadingIds } from "@/lib/text";
import type { Post } from "@/lib/types";
import { StoryHead } from "./StoryHead";
import { TagRow } from "./Cards";

export function ArticleView({ post }: { post: Post }) {
  const html = stampHeadingIds(post.contentHtml, post.outline);
  return (
    <article className="sheet">
      <StoryHead
        kind={post.kind}
        section={post.section}
        title={post.title}
        excerpt={post.excerpt}
        coverImage={post.coverImage}
        coverCaption={post.coverCaption}
        author={post.author}
        createdAt={post.createdAt}
        publishedAt={post.publishedAt}
        readingMinutes={post.readingMinutes}
        sourceDeskName={post.sourceDeskName}
      />
      <div className="prose-bh" dangerouslySetInnerHTML={{ __html: html }} />
      <TagRow tags={post.tags} kind={post.kind} />
    </article>
  );
}
