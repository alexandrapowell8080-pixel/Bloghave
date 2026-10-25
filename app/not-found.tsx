import type { Metadata } from "next";
import Link from "next/link";
import { PublicFrame } from "@/components/PublicFrame";
import { JsonLd } from "@/components/Seo";
import { pageMeta, webPageLd } from "@/lib/seo";

const DESCRIPTION = "That address is not on the Bloghave desk. It may have been unpublished, or the link drifted.";

export const metadata: Metadata = pageMeta({
  title: "Page not found",
  description: DESCRIPTION,
  path: "/404",
  keywords: ["missing page"],
  index: false,
});

export default function NotFound() {
  return (
    <PublicFrame crumbs={[{ name: "Home", path: "/" }, { name: "Missing page", path: "/404" }]}>
      <JsonLd data={webPageLd("Page not found", DESCRIPTION, "/404")} />
      <section className="wrap" style={{ padding: "64px 0" }}>
        <p className="kicker">Missing</p>
        <h1 className="story-title">That page isn’t on this desk.</h1>
        <p className="lede">It may have been unpublished, or the address drifted.</p>
        <Link className="btn btn-primary" href="/">Back to the front</Link>
      </section>
    </PublicFrame>
  );
}
