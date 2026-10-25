"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Post } from "@/lib/types";
import { formatStamp, stampHeadingIds } from "@/lib/text";

export function FaqBoard({ cards }: { cards: Post[] }) {
  const categories = useMemo(() => ["All", ...Array.from(new Set(cards.map((card) => card.section).filter(Boolean)))], [cards]);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(cards[0]?.id || null);
  const shown = cards.filter((card) => {
    const inCategory = category === "All" || card.section === category;
    const needle = query.trim().toLowerCase();
    const hay = `${card.title} ${card.excerpt} ${card.author.name}`.toLowerCase();
    return inCategory && (!needle || hay.includes(needle));
  });
  return (
    <div className="faq-layout">
      <aside className="cat-list">
        {categories.map((item) => (
          <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>
        ))}
      </aside>
      <div>
        <input className="text-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions" aria-label="Search questions" />
        <div style={{ marginTop: 12 }}>
          {shown.map((card) => (
            <article key={card.id} className="question">
              <button className="q" type="button" aria-expanded={open === card.id} onClick={() => setOpen((current) => current === card.id ? null : card.id)}>
                {card.title}
              </button>
              <p className="short">{card.excerpt}</p>
              <p className="meta">{card.section} · {card.author.name} · Published {formatStamp(card.publishedAt)}</p>
              {open === card.id ? (
                <div>
                  <div className="prose-bh" dangerouslySetInnerHTML={{ __html: stampHeadingIds(card.contentHtml, card.outline) }} />
                  <p style={{ marginTop: 8 }}>
                    <Link href={`/faq/${card.slug}`}>Open the full answer</Link>
                  </p>
                </div>
              ) : null}
            </article>
          ))}
          {shown.length === 0 ? <div className="empty">No questions in this category.</div> : null}
        </div>
      </div>
    </div>
  );
}
