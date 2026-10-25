import type { Metadata } from "next";
import { AdminConsole } from "@/components/AdminConsole";
import { DeskChrome } from "@/components/DeskChrome";
import { Crumbs, JsonLd } from "@/components/Seo";
import { breadcrumbLd, pageMeta, webPageLd } from "@/lib/seo";
import { snapshot } from "@/lib/store";

const DESCRIPTION = "Register linked sites, API keys, and pairing codes for the Bloghave desk.";
const CRUMBS = [{ name: "Home", path: "/" }, { name: "Desks", path: "/admin" }];

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMeta({
  title: "Desks",
  description: DESCRIPTION,
  path: "/admin",
  keywords: ["API keys", "linked sites", "pairing"],
  index: false,
});

export default function AdminPage() {
  return (
    <DeskChrome>
      <div className="wrap">
        <Crumbs items={CRUMBS} />
        <JsonLd data={[breadcrumbLd(CRUMBS), webPageLd("Desks", DESCRIPTION, "/admin")]} />
      </div>
      <AdminConsole initial={snapshot()} />
    </DeskChrome>
  );
}
