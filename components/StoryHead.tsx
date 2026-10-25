"use client";

import { useEffect, useRef } from "react";
import type { Byline, Kind } from "@/lib/types";
import { formatStamp } from "@/lib/text";
import { Avatar, Cover } from "./Cards";

export function StoryHead({
  kind,
  section,
  title,
  excerpt,
  coverImage,
  coverCaption,
  author,
  createdAt,
  publishedAt,
  readingMinutes,
  sourceDeskName,
  editable = false,
  onSection,
  onTitle,
  onExcerpt,
  onCoverCaption,
  onCoverFile,
  onCoverClear,
}: {
  kind: Kind;
  section: string;
  title: string;
  excerpt: string;
  coverImage: string;
  coverCaption: string;
  author: Byline;
  createdAt: string;
  publishedAt: string | null;
  readingMinutes: number;
  sourceDeskName?: string | null;
  editable?: boolean;
  onSection?: (value: string) => void;
  onTitle?: (value: string) => void;
  onExcerpt?: (value: string) => void;
  onCoverCaption?: (value: string) => void;
  onCoverFile?: (file: File) => void;
  onCoverClear?: () => void;
}) {
  const faq = kind === "faq";
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const dekRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const fit = () => {
      for (const node of [titleRef.current, dekRef.current]) {
        if (!node) continue;
        node.style.height = "0px";
        node.style.height = `${node.scrollHeight}px`;
      }
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [title, excerpt, editable]);
  return (
    <header>
      <p className="kicker">{faq ? "FAQ" : "Story"}{!editable && section ? ` · ${section}` : ""}</p>
      {editable ? (
        <input
          className="sheet-input section-input"
          value={section}
          placeholder={faq ? "Category" : "Section"}
          onChange={(event) => onSection?.(event.target.value)}
        />
      ) : null}
      {editable ? (
        <textarea
          ref={titleRef}
          className="sheet-input title-input"
          rows={1}
          value={title}
          placeholder={faq ? "The question" : "The headline"}
          onChange={(event) => {
            event.target.style.height = "0px";
            event.target.style.height = `${event.target.scrollHeight}px`;
            onTitle?.(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
        />
      ) : (
        <h1 className="story-title">{title}</h1>
      )}
      {editable ? (
        <textarea
          ref={dekRef}
          className="sheet-input dek-input"
          rows={2}
          value={excerpt}
          placeholder={faq ? "The short answer" : "The deck"}
          onChange={(event) => onExcerpt?.(event.target.value)}
        />
      ) : excerpt ? (
        <p className="dek">{excerpt}</p>
      ) : null}
      <div className="byline">
        <Avatar author={author} />
        <div>
          <strong>{author.name || "Writer’s name"}</strong>
          <p>{[author.role, author.bio].filter(Boolean).join(" — ") || "Role and a short note"}</p>
        </div>
      </div>
      <div className="dates">
        <span>Created {formatStamp(createdAt)}</span>
        <span>{publishedAt ? `Published ${formatStamp(publishedAt)}` : "Publishes when you send"}</span>
        {readingMinutes ? <span>{readingMinutes} min read</span> : null}
        {sourceDeskName ? <span>Arrived from {sourceDeskName}</span> : null}
      </div>
      {editable ? (
        <div className="figure">
          <label className="cover-edit">
            {coverImage ? <Cover src={coverImage} seed={title || "cover"} alt={title} /> : <span>Add a figure</span>}
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onCoverFile?.(file);
                event.target.value = "";
              }}
            />
          </label>
          <div className="cover-actions">
            {coverImage ? (
              <button className="btn btn-ghost btn-tiny" type="button" onClick={onCoverClear}>
                Remove figure
              </button>
            ) : null}
          </div>
          {coverImage ? (
            <input
              className="sheet-input"
              style={{ marginTop: 8, color: "#3c342c" }}
              value={coverCaption}
              placeholder="Caption"
              onChange={(event) => onCoverCaption?.(event.target.value)}
            />
          ) : null}
        </div>
      ) : coverImage ? (
        <figure className="figure">
          <img src={coverImage} alt={title} />
          {coverCaption ? <figcaption>{coverCaption}</figcaption> : null}
        </figure>
      ) : null}
    </header>
  );
}
