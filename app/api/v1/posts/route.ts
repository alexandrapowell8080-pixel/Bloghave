import { toEntry } from "@/lib/deliver";
import { bearer, json, originFrom, withCors } from "@/lib/http";
import { findSiteByInboundKey, postsForSystem } from "@/lib/store";

export function OPTIONS() {
  return withCors(json({ ok: true }));
}

export async function GET(req: Request) {
  const site = findSiteByInboundKey(bearer(req));
  if (!site) return withCors(json({ error: "The API key was not recognised." }, 401));
  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const embed = url.searchParams.get("embed") === "1";
  const origin = originFrom(req);
  const posts = postsForSystem(site.systemId)
    .filter((post) => !since || (post.lastPublishedAt || post.publishedAt || "") > since)
    .map((post) => {
      const packed = toEntry(post, origin);
      return embed ? { entry: packed.entry, assets: packed.assets } : { entry: packed.entry };
    });
  return withCors(json({ spec: "bloghave.v1", systemId: site.systemId, posts }));
}
