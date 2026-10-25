import type { Metadata } from "next";
import Link from "next/link";
import { DeskChrome } from "@/components/DeskChrome";
import { DeletePost } from "@/components/DeletePost";
import { getSettings, listCards } from "@/lib/store";
import { formatStamp } from "@/lib/text";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Library", robots: { index: false, follow: false } };

export default async function DeskPage({ searchParams }: { searchParams: Promise<{ kind?: string; status?: string }> }) {
  const query = await searchParams;
  const systemId = getSettings().systemId;
  const cards = listCards().filter((card) => {
    if (query.kind === "article" || query.kind === "faq") return card.kind === query.kind;
    if (query.status) return card.status === query.status;
    return true;
  });
  const filters = [
    { href: "/desk", label: "All" },
    { href: "/desk?kind=article", label: "Articles" },
    { href: "/desk?kind=faq", label: "FAQs" },
    { href: "/desk?status=draft", label: "Drafts" },
    { href: "/desk?status=published", label: "Published" },
    { href: "/desk?status=received", label: "Arrived" },
  ];
  const current = query.kind ? `/desk?kind=${query.kind}` : query.status ? `/desk?status=${query.status}` : "/desk";
  return (
    <DeskChrome>
      <section className="library wrap">
        <div className="library-head">
          <div>
            <p className="kicker">Manuscripts</p>
            <h1>The library</h1>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <form action="/api/posts" method="post">
              <input type="hidden" name="kind" value="article" />
              <button className="btn btn-primary" type="submit">New story</button>
            </form>
            <form action="/api/posts" method="post">
              <input type="hidden" name="kind" value="faq" />
              <button className="btn btn-ghost" type="submit">New FAQ</button>
            </form>
          </div>
        </div>
        <div className="filters">
          {filters.map((filter) => (
            <Link key={filter.href} href={filter.href} aria-current={current === filter.href ? "page" : undefined}>{filter.label}</Link>
          ))}
        </div>
        <div className="morgue">
          {cards.map((card) => (
            <div className="row" key={card.id}>
              <div>
                <strong>{card.title || "Untitled"}</strong>
                <em>{card.excerpt || "No deck yet"}</em>
              </div>
              <span className="stamp">{card.kind === "faq" ? "FAQ" : "Story"}</span>
              <span>{card.author.name || "Unsigned"}</span>
              <span>{formatStamp(card.createdAt)}</span>
              <span>{card.publishedAt ? formatStamp(card.publishedAt) : card.status}</span>
              <div className="row-actions">
                <Link className="btn btn-ghost btn-tiny" href={`/desk/compose/${card.id}`}>Edit</Link>
                {card.status === "received" || card.publishedTo.includes(systemId) ? (
                  <Link className="btn btn-ghost btn-tiny" href={card.kind === "faq" ? `/faq/${card.slug}` : `/blog/${card.slug}`}>View</Link>
                ) : null}
                <DeletePost id={card.id} />
              </div>
            </div>
          ))}
          {cards.length === 0 ? <div className="empty">Nothing in this drawer.</div> : null}
        </div>
      </section>
    </DeskChrome>
  );
}
