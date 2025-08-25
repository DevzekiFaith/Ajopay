import { getSupabaseServerClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/dashboard/Shell";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COMMISSION_PERCENT = Number(process.env.NEXT_PUBLIC_AGENT_COMMISSION_PERCENT ?? "10");

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient();
  const agentId = params.id;

  // Current admin & cluster
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase.from("profiles").select("cluster_id").eq("id", user.id).maybeSingle();
  const clusterId = me?.cluster_id ?? null;

  // Agent profile
  const { data: agent } = await supabase.from("profiles").select("id, full_name, email").eq("id", agentId).maybeSingle();

  // Contributions by this agent within current cluster
  const clusterUserIds = (
    (await supabase.from("profiles").select("id").eq("cluster_id", clusterId as any)).data?.map((p: any) => p.id) ?? []
  ) as any;

  const { data: rows } = await supabase
    .from("contributions")
    .select("id, user_id, amount_kobo, method, contributed_at, status")
    .eq("agent_id", agentId)
    .in("user_id", clusterUserIds)
    .order("created_at", { ascending: false })
    .limit(50);

  const totalKobo = (rows ?? []).reduce((acc, r: any) => acc + (r.amount_kobo ?? 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayKobo = (rows ?? [])
    .filter((r: any) => (r.contributed_at || "").slice(0, 10) === today)
    .reduce((acc, r: any) => acc + (r.amount_kobo ?? 0), 0);

  // Per-customer sums (₦)
  const byUser: Record<string, number> = {};
  for (const r of rows ?? []) {
    const naira = Math.round(((r as any).amount_kobo ?? 0) / 100);
    byUser[(r as any).user_id] = (byUser[(r as any).user_id] ?? 0) + naira;
  }
  const uids = Object.keys(byUser);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", (uids as any) ?? []);
  const userLabel: Record<string, { name: string; email?: string | null }> = {};
  for (const p of profiles ?? []) userLabel[p.id] = { name: p.full_name ?? p.email ?? p.id, email: p.email } as any;

  return (
    <DashboardShell role="admin" title={`Agent • ${agent?.full_name ?? agent?.email ?? agentId}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-3">
          <div>
            <h1 className="text-2xl font-semibold">{agent?.full_name ?? agent?.email ?? agentId}</h1>
            {agent?.email && <div className="text-sm opacity-70">{agent.email}</div>}
          </div>
          <Link className="text-sm underline" href="/admin">← Back to Admin</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/5 backdrop-blur-xl shadow-lg">
            <CardHeader><CardTitle>Total Collected</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">₦{Math.round(totalKobo / 100).toLocaleString()}</div>
              <div className="text-xs opacity-70">All time for this agent</div>
            </CardContent>
          </Card>
          <Card className="border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/5 backdrop-blur-xl shadow-lg">
            <CardHeader><CardTitle>Today</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">₦{Math.round(todayKobo / 100).toLocaleString()}</div>
              <div className="text-xs opacity-70">{today}</div>
            </CardContent>
          </Card>
          <Card className="border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/5 backdrop-blur-xl shadow-lg">
            <CardHeader><CardTitle>Commission Rate</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{COMMISSION_PERCENT}%</div>
              <div className="text-xs opacity-70">Applied on confirmed contributions</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/5 backdrop-blur-xl shadow-lg">
          <CardHeader><CardTitle>Per-Customer Breakdown</CardTitle></CardHeader>
          <CardContent>
            {Object.keys(byUser).length === 0 ? (
              <p className="opacity-70 text-sm">No customers yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Deposited</TableHead>
                    <TableHead className="text-right">Commission to date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(byUser)
                    .sort((a, b) => b[1] - a[1])
                    .map(([uid, total]) => (
                      <TableRow key={uid}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{userLabel[uid]?.name ?? uid}</span>
                            {userLabel[uid]?.email && <span className="text-xs opacity-70">{userLabel[uid]?.email}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">₦{total.toLocaleString()}</TableCell>
                        <TableCell className="text-right">₦{Math.floor((total * COMMISSION_PERCENT) / 100).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/5 backdrop-blur-xl shadow-lg">
          <CardHeader><CardTitle>Recent Contributions</CardTitle></CardHeader>
          <CardContent>
            {!rows || rows.length === 0 ? (
              <p className="opacity-70 text-sm">No contributions yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(rows ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{(r.contributed_at || '').slice(0,10)}</TableCell>
                      <TableCell className="font-mono text-xs">{r.user_id}</TableCell>
                      <TableCell>{r.method}</TableCell>
                      <TableCell>{(r as any).status ?? '-'}</TableCell>
                      <TableCell className="text-right">₦{Math.round(((r as any).amount_kobo ?? 0)/100).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
