import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/ArticleView";
import { PublicFrame } from "@/components/PublicFrame";
import { ReadProgress } from "@/components/ReadProgress";
import { sanitizeContent } from "@/lib/sanitize";
import { getPostBySlug } from "@/lib/store";
import { metaDescription, pageMeta, qaPageLd } from "@/lib/seo";
import { JsonLd } from "@/components/Seo";
import { outlineFromHtml, plainText } from "@/lib/text";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug, "faq");
  if (!post) return { title: "Question", robots: { index: false, follow: false } };
  const answer = plainText(post.contentHtml) || post.excerpt;
  return pageMeta({
    title: post.title,
    description: metaDescription(post.excerpt || answer, `The answer to ${post.title}, written by ${post.author.name} on Bloghave.`),
    path: `/faq/${post.slug}`,
    keywords: [post.section, post.author.name, "FAQ", "question", ...post.tags],
  });
}

export default async function FaqEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = getPostBySlug(slug, "faq");
  if (!found) notFound();
  const contentHtml = sanitizeContent(found.contentHtml);
  const post = { ...found, contentHtml, outline: outlineFromHtml(contentHtml) };
  const answer = plainText(contentHtml) || post.excerpt;
  return (
    <PublicFrame crumbs={[{ name: "Home", path: "/" }, { name: "FAQs", path: "/faq" }, { name: post.title, path: `/faq/${post.slug}` }]}>
      <ReadProgress />
      <JsonLd data={qaPageLd({ title: post.title, slug: post.slug, answer, publishedAt: post.publishedAt, createdAt: post.createdAt, authorName: post.author.name })} />
      <div className="layout-read wrap">
        <aside className="outline-list">
          <Link href="/faq">All questions</Link>
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
