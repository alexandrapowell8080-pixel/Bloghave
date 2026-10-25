import Link from "next/link";
import type { Byline, Card, Kind } from "@/lib/types";
import { formatStamp, hueFrom } from "@/lib/text";

export function Avatar({ author, size = 46 }: { author: Byline; size?: number }) {
  if (author.avatarUrl) {
    return <img className="avatar" src={author.avatarUrl} alt="" width={size} height={size} />;
  }
  const letter = (author.name || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="avatar-letter" style={{ width: size, height: size }} aria-hidden>
      {letter}
    </span>
  );
}

export function Cover({ src, seed, alt, className = "cover", mark = true }: { src?: string; seed: string; alt: string; className?: string; mark?: boolean }) {
  if (src) return <img className={className} src={src} alt={alt} />;
  const hue = hueFrom(seed);
  return (
    <div
      className={`cover-fallback ${className}`}
      style={{ background: `linear-gradient(145deg, hsl(${hue} 52% 42%), hsl(${hue + 24} 28% 16%))` }}
      aria-hidden={!alt}
    >
      {mark ? <span>{(alt || seed).slice(0, 1).toUpperCase()}</span> : null}
    </div>
  );
}

export function StoryCard({ card }: { card: Card }) {
  const href = card.kind === "faq" ? `/faq/${card.slug}` : `/blog/${card.slug}`;
  return (
    <Link className="story-card" href={href}>
      <Cover src={card.coverImage} seed={card.slug} alt="" />
      <div className="pad">
        <span className="stamp">{card.kind === "faq" ? "FAQ" : card.section || "Story"}</span>
        <h3>{card.title}</h3>
        <p className="meta" style={{ margin: 0 }}>{card.excerpt}</p>
        <p className="meta" style={{ marginTop: "auto" }}>
          {card.author.name} · {formatStamp(card.publishedAt || card.createdAt)}
          {card.readingMinutes ? ` · ${card.readingMinutes} min` : ""}
        </p>
      </div>
    </Link>
  );
}

export function TagRow({ tags, kind }: { tags: string[]; kind: Kind }) {
  if (!tags.length) return null;
  const base = kind === "faq" ? "/faq" : "/blog";
  return (
    <div className="tags">
      {tags.map((tag) => (
        <Link key={tag} href={`${base}?tag=${encodeURIComponent(tag)}`}>
          {tag}
        </Link>
      ))}
    </div>
  );
}
