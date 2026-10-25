import { hashPassword, newSecret, verifyPassword } from "@/lib/auth";
import { DeskError } from "@/lib/errors";
import { fail, json, originFrom } from "@/lib/http";
import {
  changePassword,
  createPairingCode,
  createSite,
  fullSettings,
  getPasswordHash,
  snapshot,
  updateIdentity,
} from "@/lib/store";

export async function GET() {
  return json(snapshot());
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: string;
      systemId?: string;
      deskName?: string;
      deskLine?: string;
      current?: string;
      next?: string;
      origin?: string;
      pairingCode?: string;
    };
    if (body.action === "identity") {
      updateIdentity({ systemId: body.systemId, deskName: body.deskName, deskLine: body.deskLine });
      return json(snapshot());
    }
    if (body.action === "password") {
      if (!verifyPassword(String(body.current || ""), getPasswordHash())) throw new DeskError("The current password is wrong.", 401);
      if (String(body.next || "").length < 8) throw new DeskError("Use at least 8 characters.", 400);
      changePassword(hashPassword(String(body.next)));
      return json(snapshot());
    }
    if (body.action === "pairing") return json({ code: createPairingCode(), snapshot: snapshot() });
    if (body.action === "link") {
      const remote = String(body.origin || "").trim().replace(/\/$/, "");
      if (!/^https?:\/\//i.test(remote)) throw new DeskError("Enter the other desk’s address, including http:// or https://.", 400);
      const settings = fullSettings();
      const inboundKey = newSecret("bh");
      const hmacSecret = newSecret("bhsec");
      const response = await fetch(`${remote}/api/v1/handshake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairingCode: body.pairingCode,
          systemId: settings.systemId,
          name: settings.deskName,
          ingestUrl: `${originFrom(req)}/api/v1/ingest`,
          acceptKey: inboundKey,
          hmacSecret,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        systemId?: string;
        deskName?: string;
        ingestUrl?: string;
        apiKey?: string;
        hmacSecret?: string;
      };
      if (!response.ok || !data.ok || !data.systemId || !data.apiKey || !data.ingestUrl) {
        throw new DeskError(data.error || "The other desk did not accept the pairing code.", 400);
      }
      const site = createSite({
        systemId: data.systemId,
        name: data.deskName || data.systemId,
        ingestUrl: data.ingestUrl,
        outboundKey: data.apiKey,
        inboundKey,
        hmacSecret: data.hmacSecret || hmacSecret,
        requireSignature: true,
        notes: "Paired with a code.",
      });
      return json({ site, snapshot: snapshot() });
    }
    throw new DeskError("Unknown desk action.", 400);
  } catch (error) {
    return fail(error);
  }
}
