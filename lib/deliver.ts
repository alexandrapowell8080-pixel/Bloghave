import fs from "fs";
import path from "path";
import { signBody } from "./auth";
import type { Asset, Envelope, Entry, Post, Site } from "./types";
import { plainText } from "./text";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

function uploadFile(urlPath: string) {
  if (!urlPath.startsWith("/uploads/")) return null;
  const name = path.basename(urlPath);
  if (!name || `/uploads/${name}` !== urlPath) return null;
  const root = path.resolve(process.cwd(), "public", "uploads");
  const full = path.resolve(root, name);
  if (!full.startsWith(root)) return null;
  if (!fs.existsSync(full)) return null;
  return { name, full };
}

function assetFor(urlPath: string, origin: string): Asset | null {
  const file = uploadFile(urlPath);
  if (!file) return null;
  const ext = path.extname(file.name).toLowerCase();
  const mime = MIME[ext];
  if (!mime) return null;
  const data = fs.readFileSync(file.full);
  if (data.length > 6 * 1024 * 1024) return null;
  return {
    sourceUrl: `${origin}${urlPath}`,
    filename: file.name,
    mime,
    dataBase64: data.toString("base64"),
  };
}

function collect(html: string, extras: string[], origin: string) {
  const urls = new Set<string>();
  const re = /\ssrc="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) urls.add(match[1]);
  for (const extra of extras) if (extra) urls.add(extra);
  const assets: Asset[] = [];
  let nextHtml = html;
  const map = new Map<string, string>();
  for (const url of urls) {
    const relative = url.startsWith(origin) ? url.slice(origin.length) : url;
    const asset = assetFor(relative, origin);
    if (!asset) continue;
    assets.push(asset);
    map.set(url, asset.sourceUrl);
    if (relative !== url) map.set(relative, asset.sourceUrl);
  }
  for (const [from, to] of map) nextHtml = nextHtml.split(from).join(to);
  return { html: nextHtml, assets };
}

export function toEntry(post: Post, origin: string): { entry: Entry; assets: Asset[] } {
  const packed = collect(post.contentHtml, [post.coverImage, post.author.avatarUrl], origin);
  let cover = post.coverImage;
  let avatar = post.author.avatarUrl;
  const coverAsset = post.coverImage ? assetFor(post.coverImage, origin) : null;
  const avatarAsset = post.author.avatarUrl ? assetFor(post.author.avatarUrl, origin) : null;
  if (coverAsset) cover = coverAsset.sourceUrl;
  if (avatarAsset) avatar = avatarAsset.sourceUrl;
  const assets = packed.assets;
  for (const extra of [coverAsset, avatarAsset]) {
    if (extra && !assets.some((asset) => asset.filename === extra.filename)) assets.push(extra);
  }
  return {
    assets,
    entry: {
      id: post.id,
      kind: post.kind,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      section: post.section,
      contentHtml: packed.html,
      contentText: plainText(packed.html),
      coverImage: cover || null,
      coverCaption: post.coverCaption,
      tags: post.tags,
      author: { ...post.author, avatarUrl: avatar },
      outline: post.outline,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      publishedAt: post.publishedAt || post.lastPublishedAt || new Date().toISOString(),
      readingMinutes: post.readingMinutes,
      wordCount: post.wordCount,
      featured: post.featured,
    },
  };
}

export function envelopeFor(post: Post, origin: string, originSystemId: string, originDeskName: string, target: Site, type: "entry" | "retract"): Envelope {
  const sentAt = new Date().toISOString();
  if (type === "retract") {
    return {
      spec: "bloghave.v1",
      type,
      originSystemId,
      originDeskName,
      targetSystemId: target.systemId,
      sentAt,
      entryId: post.id,
    };
  }
  const { entry, assets } = toEntry(post, origin);
  return {
    spec: "bloghave.v1",
    type,
    originSystemId,
    originDeskName,
    targetSystemId: target.systemId,
    sentAt,
    entry,
    assets,
  };
}

export async function sendEnvelope(site: Site, envelope: Envelope) {
  if (!site.ingestUrl) return { ok: false, statusCode: null, message: "This desk has no ingest address yet." };
  if (!site.outboundKey) return { ok: false, statusCode: null, message: "Add the key this desk expects before sending." };
  const body = JSON.stringify(envelope);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${site.outboundKey}`,
    "X-Api-Key": site.outboundKey,
  };
  if (site.hmacSecret) headers["X-Bloghave-Signature"] = signBody(site.hmacSecret, body);
  try {
    const response = await fetch(site.ingestUrl, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(15000),
    });
    const text = await response.text();
    let message = text.slice(0, 400) || (response.ok ? "Received." : "The other desk refused the piece.");
    try {
      const data = JSON.parse(text) as { ok?: boolean; error?: string; message?: string };
      message = data.message || data.error || (data.ok ? "Received." : message);
    } catch {
      /* keep the text */
    }
    return { ok: response.ok, statusCode: response.status, message };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The other desk could not be reached.";
    return { ok: false, statusCode: null, message };
  }
}

export function saveIncomingAssets(assets: Asset[] | undefined) {
  const map = new Map<string, string>();
  if (!assets?.length) return map;
  const dir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  for (const asset of assets) {
    const ext = path.extname(asset.filename || "").toLowerCase();
    const mimeOk = Object.values(MIME).includes(asset.mime) && MIME[ext] === asset.mime;
    if (!mimeOk) continue;
    const buffer = Buffer.from(asset.dataBase64 || "", "base64");
    if (!buffer.length || buffer.length > 6 * 1024 * 1024) continue;
    const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;
    fs.writeFileSync(path.join(dir, name), buffer);
    map.set(asset.sourceUrl, `/uploads/${name}`);
    map.set(asset.filename, `/uploads/${name}`);
  }
  return map;
}

export function rewriteSources(value: string, map: Map<string, string>) {
  let next = value || "";
  for (const [from, to] of map) {
    if (from) next = next.split(from).join(to);
  }
  return next;
}
