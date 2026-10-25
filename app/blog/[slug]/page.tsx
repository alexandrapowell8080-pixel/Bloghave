import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/ArticleView";
import { PublicFrame } from "@/components/PublicFrame";
import { ReadProgress } from "@/components/ReadProgress";
import { sanitizeContent } from "@/lib/sanitize";
import { getPostBySlug } from "@/lib/store";
import { outlineFromHtml, safeJson } from "@/lib/text";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug, "article");
  if (!post) return { title: "Story" };
  return { title: post.title, description: post.excerpt };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = getPostBySlug(slug, "article");
  if (!found) notFound();
  const contentHtml = sanitizeContent(found.contentHtml);
  const post = { ...found, contentHtml, outline: outlineFromHtml(contentHtml) };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    dateCreated: post.createdAt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.author.name },
    keywords: post.tags.join(", "),
  };
  return (
    <PublicFrame>
      <ReadProgress />
      <div className="layout-read wrap">
        <aside className="outline-list">
          <Link href="/blog">All stories</Link>
          {post.outline.map((item) => (
            <a key={item.id} className={`l${item.level}`} href={`#${item.id}`}>{item.text}</a>
          ))}
        </aside>
        <div>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />
          <ArticleView post={post} />
        </div>
      </div>
    </PublicFrame>
  );
}
