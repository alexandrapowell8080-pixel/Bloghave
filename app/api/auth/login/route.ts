import { cookies } from "next/headers";
import { signSession, verifyPassword } from "@/lib/auth";
import { fail, json } from "@/lib/http";
import { DeskError } from "@/lib/errors";
import { getPasswordHash } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { password?: string };
    const password = String(body.password || "");
    if (!verifyPassword(password, getPasswordHash())) throw new DeskError("That password does not open the desk.", 401);
    const jar = await cookies();
    jar.set("bh_session", signSession(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
      secure: new URL(req.url).protocol === "https:",
    });
    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
