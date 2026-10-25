import fs from "fs";
import path from "path";
import { fail, json } from "@/lib/http";
import { DeskError } from "@/lib/errors";

const TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new DeskError("Choose an image to upload.", 400);
    const ext = TYPES[file.type];
    if (!ext) throw new DeskError("Use a PNG, JPEG, GIF, or WebP image.", 400);
    if (file.size > 6 * 1024 * 1024) throw new DeskError("Images need to be under 6 MB.", 400);
    const dir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(dir, { recursive: true });
    const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(dir, name), bytes);
    return json({ url: `/uploads/${name}` });
  } catch (error) {
    return fail(error);
  }
}
