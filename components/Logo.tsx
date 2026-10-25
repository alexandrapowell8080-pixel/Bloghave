import Link from "next/link";

export function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <Link href="/" className="logo" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", color: light ? "#f6f1e7" : "#1c1712" }}>
      <svg width={compact ? 34 : 42} height={compact ? 34 : 42} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#1C1712" />
        <path d="M15.5 15h25.2c2.8 0 5.1 2.3 5.1 5.1V47.2c0 2.7-2.2 4.8-4.8 4.8H22.2c-3.7 0-6.7-3-6.7-6.7V19c0-2.2 1.8-4 4-4Z" fill="#F6F1E7" />
        <path d="M15.5 15H23v37h-1.1c-3.7 0-6.2-3-6.2-6.7V22.4c0-3 1.5-5.6 4.2-6.7.2-.2.4-.4.6-.7Z" fill="#E23D28" />
        <path d="M43.6 17.6 53 13.6l-1.5 8.8-7.9-4.8Z" fill="#1F6F66" />
        <path d="M30 31.2h13.2M30 36.4h10.4M30 41.6h7.6" stroke="#1C1712" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      {compact ? null : (
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 28, letterSpacing: "-0.04em", fontWeight: 560 }}>
            Blog<span style={{ fontStyle: "italic", color: "#e23d28" }}>have</span>
          </span>
        </span>
      )}
    </Link>
  );
}
