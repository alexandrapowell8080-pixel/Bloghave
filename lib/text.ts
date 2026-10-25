import type { OutlineItem } from "./types";

export function slugify(input: string) {
  const s = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return s || "piece";
}

export function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function plainText(html: string) {
  return decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

export function countWords(html: string) {
  const text = plainText(html);
  if (!text) return 0;
  return text.split(" ").filter(Boolean).length;
}

export function readingMinutes(words: number) {
  if (!words) return 0;
  return Math.max(1, Math.round(words / 220));
}

function uniqueId(base: string, used: Map<string, number>) {
  const n = used.get(base) || 0;
  used.set(base, n + 1);
  return n === 0 ? base : `${base}-${n + 1}`;
}

export function outlineFromHtml(html: string): OutlineItem[] {
  const re = /<h([2-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  const items: OutlineItem[] = [];
  const used = new Map<string, number>();
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const text = decodeEntities(match[2].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    if (!text) continue;
    items.push({
      id: uniqueId(slugify(text), used),
      level: Number(match[1]),
      text,
    });
  }
  return items;
}

export function stampHeadingIds(html: string, outline: OutlineItem[]) {
  let index = 0;
  return html.replace(/<h([2-4])\b([^>]*)>/gi, (full, level: string, attrs: string) => {
    const id = outline[index]?.id || `section-${index + 1}`;
    index += 1;
    const cleaned = attrs.replace(/\sid=(["']).*?\1/i, "");
    return `<h${level}${cleaned} id="${id}">`;
  });
}

type JsonNode = {
  type?: string;
  text?: string;
  attrs?: { level?: number };
  content?: JsonNode[];
};

function textOf(node: JsonNode): string {
  if (node.text) return node.text;
  return (node.content || []).map(textOf).join("");
}

export function outlineFromJson(json: unknown): OutlineItem[] {
  const items: OutlineItem[] = [];
  const used = new Map<string, number>();
  const walk = (node: JsonNode | undefined) => {
    if (!node) return;
    if (node.type === "heading") {
      const text = textOf(node).replace(/\s+/g, " ").trim();
      const level = node.attrs?.level || 2;
      if (text && level >= 2 && level <= 4) {
        items.push({ id: uniqueId(slugify(text), used), level, text });
      }
    }
    node.content?.forEach(walk);
  };
  walk(json as JsonNode);
  return items;
}

export function formatStamp(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDay(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function hueFrom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return 12 + (hash % 28);
}

export function isSystemId(value: string) {
  return /^[a-z][a-z0-9-]{1,38}[a-z0-9]$/.test(value);
}

export function safeJson(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
