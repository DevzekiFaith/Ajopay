"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardShell from "@/components/dashboard/Shell";
import { toast } from "sonner";

type Row = {
  id: string;
  user_id: string;
  amount_kobo: number;
  proof_url?: string | null;
  contributed_at: string;
  status: string;
};

export default function AgentApprovalsPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch pending contributions attributed to this agent (MVP simplification)
      const { data, error } = await supabase
        .from("contributions")
        .select("id, user_id, amount_kobo, contributed_at, status")
        .eq("agent_id", user.id)
        .eq("status", "pending")
        .order("contributed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setRows((data as any) ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string) => {
    // haptic feedback
    try { if (typeof navigator !== "undefined" && "vibrate" in navigator) (navigator as any).vibrate?.(10); } catch {}
    toast.loading("Approving…", { id });
    try {
      const { error } = await supabase
        .from("contributions")
        .update({ status: "approved" })
        .eq("id", id)
        .eq("status", "pending");
      if (error) throw error;
      toast.success("Approved", { id });
      await load();
    } catch (e) {
      console.error(e);
      toast.error((e as any)?.message || "Failed to approve", { id });
    }
  };

  const reject = async (id: string) => {
    // haptic feedback
    try { if (typeof navigator !== "undefined" && "vibrate" in navigator) (navigator as any).vibrate?.(8); } catch {}
    toast.loading("Rejecting…", { id });
    try {
      const { error } = await supabase
        .from("contributions")
        .update({ status: "rejected" })
        .eq("id", id)
        .eq("status", "pending");
      if (error) throw error;
      toast.success("Rejected", { id });
      await load();
    } catch (e) {
      console.error(e);
      toast.error((e as any)?.message || "Failed to reject", { id });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: keep approvals queue live for this agent
  useEffect(() => {
    const tRef = { current: null as any };
    let channel: any = null;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel("agent:approvals")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "contributions", filter: `agent_id=eq.${user.id}` },
          () => {
            if (tRef.current) clearTimeout(tRef.current);
            tRef.current = setTimeout(() => load(), 250);
          }
        )
        .subscribe();
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
      if (tRef.current) clearTimeout(tRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardShell role="agent" title="Agent • Approvals">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Approvals Queue</h1>
          {loading ? (
            <span className="text-xs opacity-70">Loading…</span>
          ) : (
            <button onClick={load} className="text-xs border rounded px-2 h-8 border-neutral-200 dark:border-neutral-800">Refresh</button>
          )}
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {rows.length === 0 ? (
          <p className="text-sm opacity-70">No pending contributions.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rows.map((r) => (
              <div key={r.id} className="rounded border p-3 bg-white/60 dark:bg-white/5 border-neutral-200 dark:border-neutral-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">₦{Math.round((r.amount_kobo ?? 0) / 100).toLocaleString()}</div>
                    <div className="text-xs opacity-70">{r.contributed_at}</div>
                    <div className="text-[11px] opacity-60 font-mono mt-1">{r.user_id}</div>
                  </div>
                  {r.proof_url ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded">
                      <Image src={r.proof_url} alt="proof" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded bg-neutral-100 dark:bg-neutral-900 grid place-items-center text-[10px] opacity-60">No proof</div>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => approve(r.id)} className="px-3 h-8 rounded bg-green-600 text-white">Approve</button>
                  <button onClick={() => reject(r.id)} className="px-3 h-8 rounded border border-neutral-200 dark:border-neutral-800">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
