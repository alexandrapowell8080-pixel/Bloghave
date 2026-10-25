"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { formatDay } from "@/lib/text";

const links = [
  { href: "/blog", label: "Stories" },
  { href: "/faq", label: "FAQs" },
  { href: "/desk", label: "Write" },
  { href: "/admin", label: "Desks" },
];

export function PublicChrome({
  deskName,
  deskLine,
  systemId,
}: {
  deskName: string;
  deskLine: string;
  systemId: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="mast">
      <a className="skip" href="#content">Skip to the piece</a>
      <div className="wrap utility">
        <span>{formatDay(new Date().toISOString())}</span>
        <span>{deskName} · {systemId}</span>
      </div>
      <div className="wrap mast-row">
        <Logo />
        <button className="btn btn-ghost btn-tiny nav-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          Menu
        </button>
        <nav className={`nav-links ${open ? "open" : ""}`} aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href} aria-current={pathname.startsWith(link.href) ? "page" : undefined} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="wrap" style={{ paddingBottom: 10, color: "#4a433b" }}>{deskLine}</div>
    </header>
  );
}

export function SiteFooter({ systemId }: { systemId: string }) {
  return (
    <footer className="site-footer wrap">
      <div>
        <strong>Bloghave</strong>
        <div>The manuscript leaves whole.</div>
      </div>
      <div>This desk · {systemId}</div>
    </footer>
  );
}
