import type { Metadata } from "next";
import { Archive } from "@/components/Archive";
import { PublicFrame } from "@/components/PublicFrame";
import { listCards } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Stories" };

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const cards = listCards({ kind: "article", publicOnly: true }).filter((card) => !tag || card.tags.includes(tag));
  return (
    <PublicFrame>
      <section className="wrap" style={{ padding: "28px 0 48px" }}>
        <p className="kicker">Archive</p>
        <h1 className="story-title">Stories</h1>
        <p className="lede">{tag ? `Tagged ${tag}.` : "Every article published to this desk, in the shape it was edited."}</p>
        <Archive cards={cards} placeholder="Search headlines, writers, sections" />
      </section>
    </PublicFrame>
  );
}
