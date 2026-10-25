import { NextResponse } from "next/server";
import { DeskError } from "./errors";

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  const response = NextResponse.json(data, { status, headers });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function fail(error: unknown) {
  if (error instanceof DeskError) return json({ error: error.message }, error.status);
  console.error(error);
  return json({ error: "The desk couldn't finish that." }, 500);
}

export function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, X-Api-Key, X-Bloghave-Signature",
  );
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return response;
}

export function originFrom(req: Request) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export function bearer(req: Request) {
  const header = req.headers.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return req.headers.get("x-api-key")?.trim() || "";
}
