"use client";

import { useRouter, usePathname } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Hide on home page
  if (pathname === "/") return null;

  return (
    <div className="fixed top-3 left-3 z-50">
      <button
        onClick={() => router.back()}
        className="px-3 h-9 inline-flex items-center gap-2 rounded-lg border border-white/20 dark:border-white/10 bg-white/30 hover:bg-white/40 dark:bg-neutral-900/60 dark:hover:bg-neutral-900/70 text-sm text-neutral-900 dark:text-white/90 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
        aria-label="Go back"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </button>
    </div>
  );
}
