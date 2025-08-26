"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ClusterSwitcher() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [clusters, setClusters] = useState<Array<{ id: string; name: string }>>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("clusters").select("id, name").order("name");
      if (c) setClusters(c);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: me } = await supabase.from("profiles").select("cluster_id").eq("id", user.id).maybeSingle();
      setCurrent(me?.cluster_id ?? null);
    })();
    // Realtime: refresh clusters list and current selection
    let channel: any;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      channel = supabase
        .channel("admin:cluster-switcher")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "clusters" },
          async () => {
            const { data: c } = await supabase.from("clusters").select("id, name").order("name");
            if (c) setClusters(c);
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "profiles", filter: user ? `id=eq.${user.id}` : undefined as any },
          async (payload) => {
            const next = (payload as any)?.new?.cluster_id ?? null;
            setCurrent(next);
          }
        )
        .subscribe();
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  const onSwitch = async (clusterId: string | null) => {
    setSaving(true);
    setMsg(null);
    // haptic feedback (mobile)
    try { if (typeof navigator !== "undefined" && "vibrate" in navigator) (navigator as any).vibrate?.(6); } catch {}
    toast.loading("Updating cluster…", { id: "cluster" });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").update({ cluster_id: clusterId }).eq("id", user.id);
      if (error) throw error;
      setCurrent(clusterId);
      setMsg("Cluster updated");
      toast.success("Cluster updated", { id: "cluster" });
    } catch (e: any) {
      setMsg(e.message || "Failed to update");
      toast.error(e.message || "Failed to update", { id: "cluster" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className="border rounded px-2 py-1 bg-transparent"
        value={current ?? ""}
        onChange={(e) => onSwitch(e.target.value || null)}
        disabled={saving}
      >
        <option value="">No cluster</option>
        {clusters.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {msg && <span className="text-xs opacity-70">{msg}</span>}
    </div>
  );
}
