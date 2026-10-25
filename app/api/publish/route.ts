import { envelopeFor, sendEnvelope } from "@/lib/deliver";
import { DeskError } from "@/lib/errors";
import { fail, json, originFrom } from "@/lib/http";
import { commitTargets, fullSettings, getSiteBySystemId, isPublic, preparePiece, recordDelivery } from "@/lib/store";
import type { Post } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { post?: Partial<Post> & { id?: string }; slugEdited?: boolean; systemIds?: string[]; retract?: boolean };
    const id = String(body.post?.id || "");
    const systemIds = [...new Set((body.systemIds || []).map((item) => String(item).trim()).filter(Boolean))];
    const retract = Boolean(body.retract);
    if (!id || !body.post) throw new DeskError("The manuscript is missing.", 400);
    if (!systemIds.length) throw new DeskError("Choose the system id that should receive this.", 400);
    const prepared = preparePiece(id, body.post, Boolean(body.slugEdited), !retract);
    const settings = fullSettings();
    const origin = originFrom(req);
    const results: { systemId: string; name: string; ok: boolean; message: string }[] = [];

    for (const systemId of systemIds) {
      if (systemId === settings.systemId) {
        results.push({
          systemId,
          name: settings.deskName,
          ok: true,
          message: retract ? "Taken off this desk." : "Published on this desk.",
        });
        recordDelivery({
          postId: prepared.id,
          postTitle: prepared.title || "Untitled",
          systemId,
          siteName: settings.deskName,
          action: retract ? "retract" : "publish",
          ok: true,
          statusCode: 200,
          message: retract ? "Taken off this desk." : "Published on this desk.",
        });
        continue;
      }
      const site = getSiteBySystemId(systemId);
      if (!site || !site.active) {
        results.push({ systemId, name: systemId, ok: false, message: "That system id is not an active linked desk." });
        continue;
      }
      const sent = await sendEnvelope(site, envelopeFor(prepared, origin, settings.systemId, settings.deskName, site, retract ? "retract" : "entry"));
      recordDelivery({
        postId: prepared.id,
        postTitle: prepared.title || "Untitled",
        systemId,
        siteName: site.name,
        action: retract ? "retract" : "publish",
        ok: sent.ok,
        statusCode: sent.statusCode,
        message: sent.message,
      });
      results.push({ systemId, name: site.name, ok: sent.ok, message: sent.message });
    }

    const succeeded = results.filter((item) => item.ok).map((item) => item.systemId);
    const post = commitTargets(prepared.id, succeeded, retract);
    const publicPath = !retract && isPublic(post, settings.systemId)
      ? `/${post.kind === "faq" ? "faq" : "blog"}/${post.slug}`
      : null;
    return json({ post, results, publicPath });
  } catch (error) {
    return fail(error);
  }
}
