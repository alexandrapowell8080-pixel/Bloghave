import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeskChrome } from "@/components/DeskChrome";
import { Composer } from "@/components/editor/Composer";
import { Crumbs, JsonLd } from "@/components/Seo";
import { breadcrumbLd, metaDescription, pageMeta, webPageLd } from "@/lib/seo";
import { getPost, getSettings, listAuthors, listSites } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = getPost(id);
  if (!post) return { title: "Compose", robots: { index: false, follow: false } };
  return pageMeta({
    title: post.title || "Compose",
    description: metaDescription(post.excerpt, `Edit ${post.title || "this piece"} on the Bloghave desk.`),
    path: `/desk/compose/${post.id}`,
    keywords: ["compose", post.kind === "faq" ? "FAQ" : "article"],
    index: false,
  });
}

export default async function ComposePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = getPost(id);
  if (!post) notFound();
  const settings = getSettings();
  const sites = listSites().map((site) => ({
    id: site.id,
    systemId: site.systemId,
    name: site.name,
    ingestUrl: site.ingestUrl,
    active: site.active,
  }));
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Library", path: "/desk" },
    { name: post.title || "Compose", path: `/desk/compose/${post.id}` },
  ];
  const description = metaDescription(post.excerpt, `Edit ${post.title || "this piece"} on the Bloghave desk.`);
  return (
    <DeskChrome>
      <div className="wrap">
        <Crumbs items={crumbs} />
        <JsonLd data={[breadcrumbLd(crumbs), webPageLd(post.title || "Compose", description, `/desk/compose/${post.id}`)]} />
      </div>
      <Composer post={post} sites={sites} settings={{ systemId: settings.systemId, deskName: settings.deskName }} authors={listAuthors()} />
    </DeskChrome>
  );
}
