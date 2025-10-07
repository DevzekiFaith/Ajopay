"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface AdminRealtimeRefresherProps {
  onRefresh: () => void;
}

export default function AdminRealtimeRefresher({ onRefresh }: AdminRealtimeRefresherProps) {
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
            onRefresh();
          }, 250);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          if (tRef.current) clearTimeout(tRef.current);
          tRef.current = setTimeout(() => {
            onRefresh();
          }, 250);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clusters" },
        () => {
          if (tRef.current) clearTimeout(tRef.current);
          tRef.current = setTimeout(() => {
            onRefresh();
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
  }, [onRefresh]);
  return null;
}
