import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const query = await searchParams;
  const settings = getSettings();
  const nextPath = query.next && query.next.startsWith("/") && !query.next.startsWith("//") ? query.next : "/desk";
  return <LoginForm hint={!settings.passwordChanged} nextPath={nextPath} />;
}
