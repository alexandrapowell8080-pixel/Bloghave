import { NextResponse } from "next/server";
import { fail, json } from "@/lib/http";
import { createPost } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const type = req.headers.get("content-type") || "";
    if (type.includes("application/json")) {
      const body = (await req.json()) as { kind?: string };
      return json({ post: createPost(body.kind === "faq" ? "faq" : "article") });
    }
    const form = await req.formData();
    const post = createPost(form.get("kind") === "faq" ? "faq" : "article");
    return NextResponse.redirect(new URL(`/desk/compose/${post.id}`, req.url), 303);
  } catch (error) {
    return fail(error);
  }
}
