"use client";

import { useMemo, useState } from "react";
import { StoryCard } from "@/components/Cards";
import type { Card } from "@/lib/types";

export function Archive({ cards, placeholder }: { cards: Card[]; placeholder: string }) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return cards;
    return cards.filter((card) => `${card.title} ${card.excerpt} ${card.author.name} ${card.section} ${card.tags.join(" ")}`.toLowerCase().includes(needle));
  }, [cards, query]);
  return (
    <>
      <div className="archive-tools">
        <input className="text-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} aria-label={placeholder} />
      </div>
      {shown.length ? (
        <div className="story-grid">
          {shown.map((card) => <StoryCard key={card.id} card={card} />)}
        </div>
      ) : (
        <div className="empty">Nothing matches that yet.</div>
      )}
    </>
  );
}
