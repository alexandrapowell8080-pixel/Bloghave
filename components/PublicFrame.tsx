import { PublicChrome, SiteFooter } from "@/components/PublicChrome";
import { Crumbs, JsonLd } from "@/components/Seo";
import { breadcrumbLd, type Crumb } from "@/lib/seo";
import { getSettings } from "@/lib/store";

export function PublicFrame({ children, crumbs }: { children: React.ReactNode; crumbs: Crumb[] }) {
  const settings = getSettings();
  return (
    <>
      <PublicChrome deskName={settings.deskName} deskLine={settings.deskLine} systemId={settings.systemId} />
      <main id="content">
        <div className="wrap">
          <Crumbs items={crumbs} />
        </div>
        <JsonLd data={breadcrumbLd(crumbs)} />
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
