"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminRealtimeRefresher() {
  const router = useRouter();
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("admin-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contributions" },
        () => {
          if (tRef.current) clearTimeout(tRef.current);
          tRef.current = setTimeout(() => {
            router.refresh();
          }, 250);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          if (tRef.current) clearTimeout(tRef.current);
          tRef.current = setTimeout(() => {
            router.refresh();
          }, 250);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clusters" },
        () => {
          if (tRef.current) clearTimeout(tRef.current);
          tRef.current = setTimeout(() => {
            router.refresh();
          }, 250);
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, [router]);
  return null;
}
