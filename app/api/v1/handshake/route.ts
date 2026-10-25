import { newSecret } from "@/lib/auth";
import { DeskError } from "@/lib/errors";
import { fail, json, originFrom, withCors } from "@/lib/http";
import { consumePairingCode, createSite, fullSettings } from "@/lib/store";

export function OPTIONS() {
  return withCors(json({ ok: true }));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      pairingCode?: string;
      systemId?: string;
      name?: string;
      ingestUrl?: string;
      acceptKey?: string;
      hmacSecret?: string;
    };
    if (!body.pairingCode) throw new DeskError("A pairing code is required.", 400);
    if (!body.systemId || !body.ingestUrl || !body.acceptKey) throw new DeskError("The other desk did not introduce itself fully.", 400);
    if (!/^https?:\/\//i.test(body.ingestUrl)) throw new DeskError("The ingest address must be http or https.", 400);
    consumePairingCode(body.pairingCode, body.systemId);
    const settings = fullSettings();
    const apiKey = newSecret("bh");
    const site = createSite({
      systemId: body.systemId,
      name: body.name || body.systemId,
      ingestUrl: body.ingestUrl,
      outboundKey: body.acceptKey,
      inboundKey: apiKey,
      hmacSecret: body.hmacSecret || "",
      requireSignature: Boolean(body.hmacSecret),
      notes: "Paired from their desk.",
    });
    return withCors(json({
      ok: true,
      systemId: settings.systemId,
      deskName: settings.deskName,
      ingestUrl: `${originFrom(req)}/api/v1/ingest`,
      apiKey,
      hmacSecret: site.hmacSecret,
      message: "The desks are linked.",
    }));
  } catch (error) {
    return withCors(fail(error));
  }
}
