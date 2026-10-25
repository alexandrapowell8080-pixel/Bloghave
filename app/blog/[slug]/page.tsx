import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/ArticleView";
import { PublicFrame } from "@/components/PublicFrame";
import { ReadProgress } from "@/components/ReadProgress";
import { sanitizeContent } from "@/lib/sanitize";
import { getPostBySlug } from "@/lib/store";
import { articleLd, metaDescription, pageMeta } from "@/lib/seo";
import { outlineFromHtml } from "@/lib/text";
import { JsonLd } from "@/components/Seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug, "article");
  if (!post) return { title: "Story", robots: { index: false, follow: false } };
  return pageMeta({
    title: post.title,
    description: metaDescription(post.excerpt, `${post.title} by ${post.author.name}, published on Bloghave.`),
    path: `/blog/${post.slug}`,
    keywords: [post.section, post.author.name, "article", ...post.tags],
    image: post.coverImage,
    article: {
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      tags: post.tags,
    },
  });
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = getPostBySlug(slug, "article");
  if (!found) notFound();
  const contentHtml = sanitizeContent(found.contentHtml);
  const post = { ...found, contentHtml, outline: outlineFromHtml(contentHtml) };
  return (
    <PublicFrame crumbs={[{ name: "Home", path: "/" }, { name: "Stories", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }]}>
      <ReadProgress />
      <JsonLd data={articleLd(post)} />
      <div className="layout-read wrap">
        <aside className="outline-list">
          <Link href="/blog">All stories</Link>
          {post.outline.map((item) => (
            <a key={item.id} className={`l${item.level}`} href={`#${item.id}`}>{item.text}</a>
          ))}
        </aside>
        <div>
          <ArticleView post={post} />
        </div>
      </div>
    </PublicFrame>
  );
}
