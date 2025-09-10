"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { NotificationSystem } from "@/components/Notifications/NotificationSystem";

export function Nav() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [signingOut, setSigningOut] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { theme, resolvedTheme, setTheme } = useTheme();

  const signOut = async () => {
    setSigningOut(true);
    try {
      try { if (typeof navigator !== "undefined" && "vibrate" in navigator) (navigator as any).vibrate?.(8); } catch {}
      await supabase.auth.signOut();
      toast.success("Signed out");
      setTimeout(() => {
        window.location.href = "/";
      }, 400);
    } finally {
      setSigningOut(false);
    }
  };

  // Sheet handles focus trap and aria; keep state only
  useEffect(() => {}, [mobileOpen]);

  useEffect(() => {
    // Load current user and listen to changes
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";
  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    toast.message(next === "dark" ? "Dark mode enabled" : "Light mode enabled");
  };
  
  // Check if we're on the home page
  const isHomePage = typeof window !== 'undefined' && window.location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl backdrop-saturate-150 bg-white/10 dark:bg-zinc-900/20 border-b border-white/20 dark:border-white/10 shadow-lg">
      <nav className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold tracking-tight bg-gradient-to-r from-purple-700 to-violet-500 bg-clip-text text-transparent">
            Ajopay
          </Link>
          <div className="hidden sm:flex items-center">
            <Link
              href={user ? "/dashboard" : "/sign-in"}
              className="px-4 h-9 inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-700 hover:to-violet-600 text-sm font-medium text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all"
            >
              Dashboard
            </Link>
          </div>
          {/* <Link
            href="/preview"
            className="px-3 h-8 inline-flex items-center rounded-lg border border-white/40 bg-white/20 hover:bg-white/30 text-sm text-zinc-900 dark:text-white/90"
          >
            Preview
          </Link> */}
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition border border-zinc-300 dark:border-zinc-700 ${
              isDark ? "bg-zinc-900" : "bg-white"
            }`}
          >
            <span className={`ml-2 text-xs ${isDark ? "text-white" : "text-zinc-700"}`}>{isDark ? "Dark" : "Light"}</span>
            <span
              className={`absolute right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-zinc-800 shadow transition-all ${
                isDark ? "translate-x-[-40px]" : "translate-x-0"
              }`}
            >
              <span className="h-3 w-3 rounded-full bg-violet-500" />
            </span>
          </button>
          {user ? (
            <NotificationSystem userId={user.id} />
          ) : (
            <></>
          )}
          {user ? (
            <button
              onClick={signOut}
              className="px-3 h-8 inline-flex items-center rounded-lg border border-white/30 dark:border-white/10 bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 text-sm text-zinc-900 dark:text-white/90 disabled:opacity-60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors"
              disabled={signingOut}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-3 h-8 inline-flex items-center rounded-lg bg-purple-700 text-white hover:bg-purple-800 text-sm"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="px-3 h-8 inline-flex items-center rounded-lg border border-white/30 dark:border-white/10 bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 text-sm text-zinc-900 dark:text-white/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile actions */}
        <div className="sm:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition border border-zinc-300 dark:border-zinc-700 ${
              isDark ? "bg-zinc-900" : "bg-white"
            }`}
          >
            <span className={`ml-2 text-[10px] ${isDark ? "text-white" : "text-zinc-700"}`}>{isDark ? "Dark" : "Light"}</span>
            <span
              className={`absolute right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-zinc-800 shadow transition-all ${
                isDark ? "translate-x-[-34px]" : "translate-x-0"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
            </span>
          </button>
          {!isHomePage || user ? (
            <button
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => {
                try { if (typeof navigator !== "undefined" && "vibrate" in navigator) (navigator as any).vibrate?.(6); } catch {}
                setMobileOpen((v) => !v);
              }}
              className="relative h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/30 dark:border-white/10 bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-xl transition-colors shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
            >
              <span className="sr-only">Menu</span>
              <span className="block relative h-3 w-4">
                <span
                  className={`absolute inset-x-0 top-0 h-0.5 bg-current transition-transform ${mobileOpen ? "translate-y-1.5 rotate-45" : ""}`}
                />
                <span
                  className={`absolute inset-x-0 top-1.5 h-0.5 bg-current transition-opacity ${mobileOpen ? "opacity-0" : "opacity-100"}`}
                />
                <span
                  className={`absolute inset-x-0 bottom-0 h-0.5 bg-current transition-transform ${mobileOpen ? "-translate-y-1.5 -rotate-45" : ""}`}
                />
              </span>
            </button>
          ) : null}
        </div>
      </nav>

      {/* Mobile Sheet menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="sm:hidden w-80 p-4 backdrop-blur-xl bg-white/10 dark:bg-zinc-900/30 border-l border-white/20 dark:border-white/10" ref={panelRef as any}>
          <SheetHeader className="mb-4">
            <SheetTitle className="text-left text-white">Menu</SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            <Link
              href="/dashboard?hub=1"
              onClick={() => setMobileOpen(false)}
              className="block px-3 h-10 rounded-lg border border-white/30 dark:border-white/10 bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 text-sm leading-10 text-center text-zinc-900 dark:text-white/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors"
            >
              Dashboard Hub
            </Link>
            <Link
              href="/customer"
              onClick={() => setMobileOpen(false)}
              className="block px-3 h-10 rounded-lg border border-white/30 dark:border-white/10 bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 text-sm leading-10 text-center text-zinc-900 dark:text-white/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors mt-2"
            >
              My Wallet
            </Link>
            {user ? (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut();
                }}
                className="w-full px-3 h-10 rounded-lg border border-white/30 dark:border-white/10 bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 text-sm text-zinc-900 dark:text-white/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 h-10 rounded-lg bg-purple-700 text-white hover:bg-purple-800 text-sm leading-10 text-center"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 h-10 rounded-lg border border-white/30 dark:border-white/10 bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 text-sm leading-10 text-center text-zinc-900 dark:text-white/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
