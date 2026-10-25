import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeskChrome } from "@/components/DeskChrome";
import { Composer } from "@/components/editor/Composer";
import { getPost, getSettings, listAuthors, listSites } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compose", robots: { index: false, follow: false } };

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
  return (
    <DeskChrome>
      <Composer post={post} sites={sites} settings={{ systemId: settings.systemId, deskName: settings.deskName }} authors={listAuthors()} />
    </DeskChrome>
  );
}
