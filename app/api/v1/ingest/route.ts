import { signBody, timingSafeString } from "@/lib/auth";
import { rewriteSources, saveIncomingAssets } from "@/lib/deliver";
import { DeskError } from "@/lib/errors";
import { bearer, fail, json, withCors } from "@/lib/http";
import { sanitizeContent } from "@/lib/sanitize";
import { findSiteByInboundKey, fullSettings, retractReceived, upsertReceived } from "@/lib/store";
import type { Envelope, Kind } from "@/lib/types";

export function OPTIONS() {
  return withCors(json({ ok: true }));
}

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const key = bearer(req);
    const site = findSiteByInboundKey(key);
    if (!site) return withCors(json({ error: "The API key was not recognised." }, 401));
    if (site.requireSignature) {
      const provided = req.headers.get("x-bloghave-signature") || "";
      const expected = signBody(site.hmacSecret, raw);
      if (!timingSafeString(provided, expected)) return withCors(json({ error: "The signature did not match." }, 401));
    }
    let body: Envelope;
    try {
      body = JSON.parse(raw) as Envelope;
    } catch {
      throw new DeskError("The envelope was not JSON.", 400);
    }
    if (body.spec !== "bloghave.v1") throw new DeskError("This desk speaks bloghave.v1.", 400);
    const settings = fullSettings();
    const known = body.originSystemId === site.systemId || body.originSystemId === settings.systemId;
    if (!known) throw new DeskError("That system id does not match the key.", 401);
    if (body.type === "ping") {
      return withCors(json({ ok: true, spec: "bloghave.v1", systemId: settings.systemId, deskName: settings.deskName, message: "This desk is listening." }));
    }
    if (body.originSystemId === settings.systemId) {
      return withCors(json({ ok: true, echo: true, message: "This desk already holds the manuscript." }));
    }
    if (body.type === "retract") {
      const removed = retractReceived(body.originSystemId, String(body.entryId || ""));
      return withCors(json({ ok: true, removed, message: removed ? "The piece was taken down." : "This desk had no copy to take down." }));
    }
    if (body.type !== "entry" || !body.entry) throw new DeskError("The envelope had no piece.", 400);
    const entry = body.entry;
    const kind: Kind = entry.kind === "faq" ? "faq" : "article";
    if (!entry.title?.trim()) throw new DeskError("The piece needs a headline.", 400);
    if (!entry.author?.name?.trim()) throw new DeskError("The piece needs the writer’s name.", 400);
    const map = saveIncomingAssets(body.assets);
    const contentHtml = sanitizeContent(rewriteSources(entry.contentHtml || "", map));
    if (!contentHtml.replace(/<[^>]+>/g, "").trim()) throw new DeskError("The piece had no body.", 400);
    const post = upsertReceived({
      originSystemId: body.originSystemId,
      originDeskName: body.originDeskName || site.name,
      entryId: entry.id,
      kind,
      title: entry.title.trim(),
      slug: entry.slug || entry.title,
      excerpt: entry.excerpt || "",
      section: entry.section || "",
      contentHtml,
      coverImage: rewriteSources(entry.coverImage || "", map),
      coverCaption: entry.coverCaption || "",
      tags: entry.tags || [],
      author: { ...entry.author, avatarUrl: rewriteSources(entry.author.avatarUrl || "", map) },
      createdAt: entry.createdAt || body.sentAt,
      publishedAt: entry.publishedAt || body.sentAt,
      featured: Boolean(entry.featured),
    });
    return withCors(json({
      ok: true,
      id: post.id,
      slug: post.slug,
      url: `/${post.kind === "faq" ? "faq" : "blog"}/${post.slug}`,
      message: "Received.",
    }));
  } catch (error) {
    return withCors(fail(error));
  }
}
