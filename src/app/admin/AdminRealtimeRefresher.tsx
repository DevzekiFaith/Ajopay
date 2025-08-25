"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminRealtimeRefresher() {
  const router = useRouter();
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("admin-contributions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contributions" },
        () => {
          // Debounced refresh via microtask to batch rapid events
          Promise.resolve().then(() => router.refresh());
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [router]);
  return null;
}
