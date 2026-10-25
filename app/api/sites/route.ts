import { newSecret } from "@/lib/auth";
import { fail, json } from "@/lib/http";
import { DeskError } from "@/lib/errors";
import { createSite } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      systemId?: string;
      name?: string;
      ingestUrl?: string;
      outboundKey?: string;
      notes?: string;
      requireSignature?: boolean;
    };
    if (!body.systemId) throw new DeskError("Give the other desk a system id.", 400);
    const site = createSite({
      systemId: body.systemId,
      name: body.name || body.systemId,
      ingestUrl: body.ingestUrl || "",
      outboundKey: body.outboundKey || "",
      inboundKey: newSecret("bh"),
      hmacSecret: newSecret("bhsec"),
      requireSignature: Boolean(body.requireSignature),
      notes: body.notes || "",
    });
    return json({ site });
  } catch (error) {
    return fail(error);
  }
}
