"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardShell from "@/components/dashboard/Shell";
const COMMISSION_PERCENT = Number(process.env.NEXT_PUBLIC_AGENT_COMMISSION_PERCENT ?? "10");

type Row = { id: string; amount_kobo: number; created_at: string; contribution_id: string };

export default function AgentCommissionsPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("agent_commissions")
        .select("id, amount_kobo, created_at, contribution_id")
        .eq("agent_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) {
        setRows(data as any);
        setTotal(Math.round(((data as any[]).reduce((a, r) => a + (r.amount_kobo ?? 0), 0)) / 100));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: keep commissions live for this agent
  useEffect(() => {
    const tRef = { current: null as any };
    let channel: any = null;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel("agent:commissions")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "agent_commissions", filter: `agent_id=eq.${user.id}` },
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
    <DashboardShell role="agent" title="Agent • Commissions">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My Commissions</h1>
          <div className="flex items-center gap-4 text-sm opacity-80">
            <span>Rate: {COMMISSION_PERCENT}%</span>
            <span>Total shown: ₦{total.toLocaleString()}</span>
          </div>
        </div>

        {loading ? (
          <p className="text-sm opacity-70">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm opacity-70">No commissions yet.</p>
        ) : (
          <div className="overflow-x-auto border rounded border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <thead className="bg-white/40 dark:bg-white/5">
                <tr className="text-left border-b border-neutral-200 dark:border-neutral-800">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Contribution</th>
                  <th className="py-2 px-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-200 dark:border-neutral-800">
                    <td className="py-2 px-3">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-2 px-3 font-mono text-xs">{r.contribution_id}</td>
                    <td className="py-2 px-3">₦{Math.round((r.amount_kobo ?? 0) / 100).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
