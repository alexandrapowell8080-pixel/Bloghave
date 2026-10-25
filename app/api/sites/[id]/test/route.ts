import { sendEnvelope } from "@/lib/deliver";
import { DeskError } from "@/lib/errors";
import { fail, json } from "@/lib/http";
import { fullSettings, getSite, patchSite, recordDelivery } from "@/lib/store";
import type { Envelope } from "@/lib/types";

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const site = getSite(id);
    if (!site) throw new DeskError("That linked desk is gone.", 404);
    const settings = fullSettings();
    const envelope: Envelope = {
      spec: "bloghave.v1",
      type: "ping",
      originSystemId: settings.systemId,
      originDeskName: settings.deskName,
      targetSystemId: site.systemId,
      sentAt: new Date().toISOString(),
    };
    const sent = await sendEnvelope(site, envelope);
    const saved = patchSite(id, {
      lastTestedAt: new Date().toISOString(),
      lastTestOk: sent.ok,
      lastTestMessage: sent.message,
    });
    recordDelivery({
      postId: "",
      postTitle: "Ping",
      systemId: site.systemId,
      siteName: site.name,
      action: "ping",
      ok: sent.ok,
      statusCode: sent.statusCode,
      message: sent.message,
    });
    return json({ site: saved, result: sent });
  } catch (error) {
    return fail(error);
  }
}
