import type { Metadata } from "next";
import { Archive } from "@/components/Archive";
import { PublicFrame } from "@/components/PublicFrame";
import { JsonLd } from "@/components/Seo";
import { itemListLd, pageMeta } from "@/lib/seo";
import { listCards } from "@/lib/store";

const DESCRIPTION = "Read every article published on Bloghave, with the writer, the section, and the dates the desk stamped.";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ tag?: string }> }): Promise<Metadata> {
  const { tag } = await searchParams;
  const path = tag ? `/blog?tag=${encodeURIComponent(tag)}` : "/blog";
  return pageMeta({
    title: tag ? `Stories tagged ${tag}` : "Stories",
    description: tag ? `Articles on Bloghave tagged ${tag}, with each writer and published date.` : DESCRIPTION,
    path,
    keywords: ["story archive", "articles", tag || "published stories"],
  });
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const cards = listCards({ kind: "article", publicOnly: true }).filter((card) => !tag || card.tags.includes(tag));
  return (
    <PublicFrame crumbs={[{ name: "Home", path: "/" }, { name: tag ? `Stories · ${tag}` : "Stories", path: tag ? `/blog?tag=${encodeURIComponent(tag)}` : "/blog" }]}>
      <JsonLd data={itemListLd(tag ? `Stories tagged ${tag}` : "Stories", tag ? `/blog?tag=${encodeURIComponent(tag)}` : "/blog", cards.map((card) => ({ name: card.title, path: `/blog/${card.slug}` })))} />
      <section className="wrap" style={{ padding: "28px 0 48px" }}>
        <p className="kicker">Archive</p>
        <h1 className="story-title">Stories</h1>
        <p className="lede">{tag ? `Tagged ${tag}.` : "Every article published to this desk, in the shape it was edited."}</p>
        <Archive cards={cards} placeholder="Search headlines, writers, sections" />
      </section>
    </PublicFrame>
  );
}
