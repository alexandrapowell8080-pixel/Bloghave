import { fail, json } from "@/lib/http";
import { patchSite, removeSite } from "@/lib/store";
import type { Site } from "@/lib/types";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as Partial<Site>;
    return json({ site: patchSite(id, body) });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    removeSite(id);
    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
