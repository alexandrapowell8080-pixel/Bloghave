import type { Metadata } from "next";
import { FaqBoard } from "@/components/FaqBoard";
import { PublicFrame } from "@/components/PublicFrame";
import { sanitizeContent } from "@/lib/sanitize";
import { listPublicPosts } from "@/lib/store";
import { outlineFromHtml, safeJson } from "@/lib/text";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "FAQs" };

export default async function FaqPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const cards = listPublicPosts("faq")
    .filter((card) => !tag || card.tags.includes(tag))
    .map((card) => {
      const contentHtml = sanitizeContent(card.contentHtml);
      return { ...card, contentHtml, outline: outlineFromHtml(contentHtml) };
    });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: cards.map((card) => ({
      "@type": "Question",
      name: card.title,
      acceptedAnswer: { "@type": "Answer", text: card.excerpt },
    })),
  };
  return (
    <PublicFrame>
      <section className="wrap" style={{ padding: "28px 0 20px" }}>
        <p className="kicker">Questions</p>
        <h1 className="story-title">FAQs</h1>
        <p className="lede">{tag ? `Tagged ${tag}.` : "Each question keeps the category, the short answer, and the fuller one you wrote."}</p>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />
        <FaqBoard cards={cards} />
      </section>
    </PublicFrame>
  );
}
