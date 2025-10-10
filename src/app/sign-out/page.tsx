"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignOutPage() {
  const router = useRouter();
  
  // Clear service worker cache on sign out
  const clearServiceWorkerCache = async () => {
    if ('serviceWorker' in navigator && 'caches' in window) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = () => {
            console.log('Service worker cache cleared on sign out');
          };
          registration.active.postMessage({ type: 'CLEAR_CACHE' }, [messageChannel.port2]);
        }
      } catch (error) {
        console.log('Could not clear service worker cache:', error);
      }
    }
  };

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      try {
        await supabase.auth.signOut();
        // Clear cache after sign out
        await clearServiceWorkerCache();
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
