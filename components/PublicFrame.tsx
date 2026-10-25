import { PublicChrome, SiteFooter } from "@/components/PublicChrome";
import { getSettings } from "@/lib/store";

export function PublicFrame({ children }: { children: React.ReactNode }) {
  const settings = getSettings();
  return (
    <>
      <PublicChrome deskName={settings.deskName} deskLine={settings.deskLine} systemId={settings.systemId} />
      <main id="content">{children}</main>
      <SiteFooter systemId={settings.systemId} />
    </>
  );
}
