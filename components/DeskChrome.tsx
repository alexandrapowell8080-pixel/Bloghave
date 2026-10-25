"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { SiteFooter } from "./PublicChrome";

const links = [
  { href: "/desk", label: "Library" },
  { href: "/admin", label: "Desks" },
  { href: "/blog", label: "Stories" },
  { href: "/faq", label: "FAQs" },
];

export function DeskChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <div className="desk-page on-night">
      <header className="desk-top">
        <div className="wrap desk-row">
          <Logo light />
          <button className="btn btn-ghost btn-tiny nav-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            Menu
          </button>
          <nav className={`nav-links ${open ? "open" : ""}`} aria-label="Desk">
            {links.map((link) => (
              <Link key={link.href} href={link.href} aria-current={pathname === link.href || (link.href !== "/desk" && pathname.startsWith(link.href)) ? "page" : undefined}>
                {link.label}
              </Link>
            ))}
            <button
              className="linkish"
              type="button"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
                router.refresh();
              }}
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      {children}
      <SiteFooter />
    </div>
  );
}
