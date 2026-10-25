import type { Metadata } from "next";
import { AdminConsole } from "@/components/AdminConsole";
import { DeskChrome } from "@/components/DeskChrome";
import { snapshot } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Desks", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <DeskChrome>
      <AdminConsole initial={snapshot()} />
    </DeskChrome>
  );
}
