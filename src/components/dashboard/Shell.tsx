"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo } from "react";

type Role = "customer" | "admin";

export default function DashboardShell({
  role,
  title,
  children,
}: {
  role: Role;
  title?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  const links = useMemo(() => {
    const base = [
      { href: "/dashboard?hub=1", label: "Dashboard Hub" },
    ];
    if (role === "customer") {
      base.push({ href: "/customer", label: "My Wallet" });
    }
    if (role === "admin") {
      base.push(
        { href: "/admin", label: "Admin Overview" },
        { href: "/monitoring", label: "Monitoring" }
      );
    }
    // Add contact page for all roles
    base.push({ href: "/contact", label: "Contact Support" });
    return base;
  }, [role]);

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[220px_1fr]">
      <aside className="hidden md:block bg-white/40 dark:bg-white/5 backdrop-blur border-r border-neutral-200 dark:border-neutral-800">
        <div className="p-4 text-sm font-semibold tracking-tight bg-gradient-to-r from-purple-700 to-violet-500 bg-clip-text text-transparent">Ajopay</div>
        <nav className="p-2 space-y-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`block px-3 h-9 rounded-lg text-sm leading-9 transition border ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "border-white/40 bg-white/20 hover:bg-white/30 text-zinc-900 dark:text-white/90"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-h-screen">
        <header className="sticky top-0 z-40 bg-white/30 dark:bg-white/5 backdrop-blur border-b border-neutral-200/60 dark:border-neutral-800/60">
          <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="font-semibold tracking-tight bg-gradient-to-r from-purple-700 to-violet-500 bg-clip-text text-transparent">
                Ajopay
              </Link>
              {title && <div className="text-sm opacity-80">{title}</div>}
            </div>
            <div className="text-xs opacity-70">
              <Link href="/sign-out" className="underline hover:no-underline">Sign out</Link>
            </div>
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
