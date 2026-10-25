import type { Metadata } from "next";
import { FaqBoard } from "@/components/FaqBoard";
import { PublicFrame } from "@/components/PublicFrame";
import { JsonLd } from "@/components/Seo";
import { faqPageLd, pageMeta } from "@/lib/seo";
import { sanitizeContent } from "@/lib/sanitize";
import { listPublicPosts } from "@/lib/store";
import { outlineFromHtml, plainText } from "@/lib/text";

const DESCRIPTION = "Browse questions on Bloghave. Each FAQ keeps its category, short answer, and the fuller answer as it was written.";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ tag?: string }> }): Promise<Metadata> {
  const { tag } = await searchParams;
  const path = tag ? `/faq?tag=${encodeURIComponent(tag)}` : "/faq";
  return pageMeta({
    title: tag ? `FAQs tagged ${tag}` : "FAQs",
    description: tag ? `Questions on Bloghave tagged ${tag}, with the short answer and the fuller one.` : DESCRIPTION,
    path,
    keywords: ["FAQ", "questions", "answers", tag || "help"],
  });
}

export default async function FaqPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const cards = listPublicPosts("faq")
    .filter((card) => !tag || card.tags.includes(tag))
    .map((card) => {
      const contentHtml = sanitizeContent(card.contentHtml);
      return { ...card, contentHtml, outline: outlineFromHtml(contentHtml) };
    });
  return (
    <PublicFrame crumbs={[{ name: "Home", path: "/" }, { name: tag ? `FAQs · ${tag}` : "FAQs", path: tag ? `/faq?tag=${encodeURIComponent(tag)}` : "/faq" }]}>
      <JsonLd data={faqPageLd(cards.map((card) => ({ title: card.title, answer: plainText(card.contentHtml) || card.excerpt })))} />
      <section className="wrap" style={{ padding: "28px 0 20px" }}>
        <p className="kicker">Questions</p>
        <h1 className="story-title">FAQs</h1>
        <p className="lede">{tag ? `Tagged ${tag}.` : "Each question keeps the category, the short answer, and the fuller one you wrote."}</p>
        <FaqBoard cards={cards} />
      </section>
    </PublicFrame>
  );
}
