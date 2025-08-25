"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignOutPage() {
  const router = useRouter();
  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      try {
        await supabase.auth.signOut();
      } finally {
        router.replace("/");
      }
    };
    run();
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-48px)] grid place-items-center">
      <div className="rounded-2xl border border-white/40 bg-white/30 backdrop-blur-md dark:border-white/10 dark:bg-white/5 px-6 py-8 text-center">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">Signing you out…</p>
      </div>
    </div>
  );
}
