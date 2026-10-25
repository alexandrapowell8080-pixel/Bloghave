import { fail, json } from "@/lib/http";
import { DeskError } from "@/lib/errors";
import { deletePost, getPost, savePost } from "@/lib/store";
import type { Post } from "@/lib/types";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const post = getPost(id);
  if (!post) return json({ error: "That piece is not on this desk." }, 404);
  return json({ post });
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as { post?: Partial<Post>; slugEdited?: boolean };
    if (!body.post) throw new DeskError("The draft was empty.", 400);
    return json({ post: savePost(id, body.post, Boolean(body.slugEdited)) });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    deletePost(id);
    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
