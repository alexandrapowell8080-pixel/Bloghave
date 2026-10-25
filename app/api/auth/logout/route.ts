import { cookies } from "next/headers";
import { json } from "@/lib/http";

export async function POST() {
  const jar = await cookies();
  jar.set("bh_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return json({ ok: true });
}
