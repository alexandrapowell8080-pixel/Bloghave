import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { Crumbs, JsonLd } from "@/components/Seo";
import { breadcrumbLd, pageMeta, webPageLd } from "@/lib/seo";
import { getSettings } from "@/lib/store";

const DESCRIPTION = "Sign in to the Bloghave desk to write articles and FAQs and send them to a linked site.";
const CRUMBS = [{ name: "Home", path: "/" }, { name: "Sign in", path: "/login" }];

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMeta({
  title: "Sign in",
  description: DESCRIPTION,
  path: "/login",
  keywords: ["sign in", "desk login"],
  index: false,
});

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const query = await searchParams;
  const settings = getSettings();
  const nextPath = query.next && query.next.startsWith("/") && !query.next.startsWith("//") ? query.next : "/desk";
  return (
    <>
      <div className="wrap">
        <Crumbs items={CRUMBS} />
        <JsonLd data={[breadcrumbLd(CRUMBS), webPageLd("Sign in", DESCRIPTION, "/login")]} />
      </div>
      <LoginForm hint={!settings.passwordChanged} nextPath={nextPath} />
    </>
  );
}
