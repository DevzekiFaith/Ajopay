import { getSupabaseServerClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/dashboard/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ExportCsvButton from "./ExportCsvButton";
import AdminRealtimeRefresher from "./AdminRealtimeRefresher";
import AdminTotalCard from "./AdminTotalCard";
import Link from "next/link";
import Image from "next/image";
import { Tooltip } from "@/components/ui/tooltip";
import CustomersExportCsvButton from "./customers/CustomersExportCsvButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// type Row = { id: string; user_id: string; amount_kobo: number; method: string; contributed_at: string };

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // All contributions (global scope)
  const { data: allRows } = await supabase.from("contributions").select("amount_kobo, contributed_at, user_id, method, status");
  const totalKobo = (allRows ?? []).reduce((acc, r: { amount_kobo?: number }) => acc + (r.amount_kobo ?? 0), 0);

  // Build per-user totals (₦)
  const sumByUser: Record<string, number> = {};
  for (const r of allRows ?? []) {
    const naira = Math.round((r.amount_kobo ?? 0) / 100);
    sumByUser[r.user_id] = (sumByUser[r.user_id] ?? 0) + naira;
  }

  // Fetch minimal profile info for users we need to label
  const userIds = Object.keys(sumByUser);
  const { data: userProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds ?? []);

  const userLabel: Record<string, { name: string; email: string | null }> = {};
  for (const p of userProfiles ?? []) {
    userLabel[p.id] = { name: p.full_name ?? p.email ?? p.id, email: p.email };
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: todayRows } = await supabase.from("contributions").select("amount_kobo, user_id").eq("contributed_at", today);
  const todayKobo = (todayRows ?? []).reduce((acc, r: { amount_kobo?: number }) => acc + (r.amount_kobo ?? 0), 0);

  const { data: recent } = await supabase
    .from("contributions")
    .select("id, user_id, amount_kobo, method, status, contributed_at")
    .order("created_at", { ascending: false })
    .limit(30);

  // Ensure label maps include names for any IDs present only in recent
  {
    const recentUserIds = Array.from(new Set((recent ?? []).map((r) => r.user_id))).filter((id) => !userLabel[id]);
    if (recentUserIds.length) {
      const { data: extra } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", recentUserIds);
      for (const p of extra ?? []) userLabel[p.id] = { name: p.full_name ?? p.email ?? p.id, email: p.email };
    }
  }

  // Build last 14 days totals for sparkline (₦)
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  const daySums: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
  for (const r of allRows ?? []) {
    const d = (r as { contributed_at?: string }).contributed_at?.slice(0, 10);
    if (d && d in daySums) {
      daySums[d] += Math.round(((r as { amount_kobo?: number }).amount_kobo ?? 0) / 100);
    }
  }
  const series = days.map((d) => daySums[d] ?? 0);
  const maxVal = Math.max(1, ...series);
  const sparkPoints = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * 100;
      const y = 30 - (v / maxVal) * 30;
      return `${x},${y}`;
    })
    .join(" ");

  // Derive last 7 vs previous 7 from series
  const prev7Naira = series.slice(0, 7).reduce((a, b) => a + b, 0);
  const last7Naira = series.slice(7).reduce((a, b) => a + b, 0);
  const wowPct = prev7Naira === 0 ? (last7Naira > 0 ? 100 : 0) : Math.round(((last7Naira - prev7Naira) / prev7Naira) * 100);
  const isUp = prev7Naira === 0 ? last7Naira > 0 : last7Naira >= prev7Naira;

  // Active days in last 30 within scope
  const days30 = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
  const dayHit: Record<string, boolean> = Object.fromEntries(days30.map((d) => [d, false]));
  for (const r of allRows ?? []) {
    const d = (r as { contributed_at?: string }).contributed_at?.slice(0, 10);
    if (d && d in dayHit) dayHit[d] = true;
  }
  const activeDays30 = days30.reduce((acc, d) => acc + (dayHit[d] ? 1 : 0), 0);
  const activePct30 = Math.round((activeDays30 / 30) * 100);

  // Sorting & pagination for Customers
  const params = await searchParams;
  const sortKey = (Array.isArray(params?.sort) ? params?.sort[0] : params?.sort) || "deposited";
  const sortDir = (Array.isArray(params?.dir) ? params?.dir[0] : params?.dir) || "desc";
  const page = parseInt(((Array.isArray(params?.page) ? params?.page[0] : params?.page) || "1") as string, 10) || 1;
  const pageSize = parseInt(((Array.isArray(params?.pageSize) ? params?.pageSize[0] : params?.pageSize) || "10") as string, 10) || 10;
  const entries = Object.entries(sumByUser).map(([uid, total]) => ({ uid, total, name: userLabel[uid]?.name ?? uid }));
  const cmp = (a: { uid: string; total: number; name: string }, b: { uid: string; total: number; name: string }) => {
    const mult = sortDir === "asc" ? 1 : -1;
    if (sortKey === "name") return a.name.localeCompare(b.name) * mult;
    // default deposited
    return (a.total - b.total) * mult;
  };
  const sorted = entries.sort(cmp);
  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const makeUrl = (next: Record<string, string>) => {
    const sp = new URLSearchParams();
    sp.set("sort", next.sort ?? sortKey);
    sp.set("dir", next.dir ?? sortDir);
    sp.set("page", next.page ?? String(currentPage));
    sp.set("pageSize", next.pageSize ?? String(pageSize));
    return `?${sp.toString()}`;
  };

  // Build full customers dataset for CSV export
  const csvRows = sorted.map(({ uid, total }) => ({
    name: userLabel[uid]?.name ?? uid,
    email: userLabel[uid]?.email ?? "",
    deposited: total,
  }));

  return (
    <DashboardShell role="admin" title="Admin Dashboard">
      <AdminRealtimeRefresher />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="relative flex flex-wrap items-center justify-between gap-3 border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl rounded-2xl p-3 shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
          {/* sheen */}
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:radial-gradient(120%_60%_at_50%_0%,#000_35%,transparent_60%)]">
            <div className="absolute -top-8 left-0 right-0 h-20 bg-gradient-to-b from-white/30 to-transparent dark:from-white/6" />
          </div>

        {/* 30-day Active Days progress */}
        <Card className="relative border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)] flex-1 min-w-[260px]">
          {/* sheen */}
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:radial-gradient(120%_60%_at_50%_0%,#000_35%,transparent_60%)]">
            <div className="absolute -top-8 left-0 right-0 h-20 bg-gradient-to-b from-white/30 to-transparent dark:from-white/6" />
          </div>
          <CardHeader>
            <CardTitle>Active Days • 30</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs opacity-80">
              <span>{activeDays30}/30 days with contributions (Global)</span>
              <span>{activePct30}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: `${activePct30}%` }} />
            </div>
          </CardContent>
        </Card>

          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-8 w-8">
              <Image src="/aj2.png" alt="Ajopay" fill sizes="32px" className="object-contain" />
            </div>
            <h1 className="text-2xl font-semibold truncate">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <Link href="/monitoring">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20">
                📊 Monitoring
              </Button>
            </Link>
            <div className="shrink-0"><ExportCsvButton /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminTotalCard
            title="Total Collected"
            totalNaira={Math.round(totalKobo / 100)}
            subtitle="All time (MVP)"
            sparkPoints={"" + sparkPoints}
          />
          <AdminTotalCard
            title="Today"
            totalNaira={Math.round(todayKobo / 100)}
            subtitle={today}
          />
          <Card className="relative border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
            {/* sheen */}
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:radial-gradient(120%_60%_at_50%_0%,#000_35%,transparent_60%)]">
              <div className="absolute -top-8 left-0 right-0 h-20 bg-gradient-to-b from-white/30 to-transparent dark:from-white/6" />
            </div>
            <CardHeader>
              <CardTitle>Last 7 days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">₦{last7Naira.toLocaleString()}</div>
              <div className={`mt-1 inline-flex items-center gap-1 text-xs ${isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                <span>{isUp ? "▲" : "▼"}</span>
                <span>{isFinite(wowPct) ? wowPct : 0}% WoW</span>
              </div>
            </CardContent>
          </Card>
          <Card className="relative border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
            {/* sheen */}
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:radial-gradient(120%_60%_at_50%_0%,#000_35%,transparent_60%)]">
              <div className="absolute -top-8 left-0 right-0 h-20 bg-gradient-to-b from-white/30 to-transparent dark:from-white/6" />
            </div>
            <CardHeader>
              <CardTitle>Active Days (30)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{activeDays30}</div>
              <div className="text-sm opacity-70">{activePct30}% of last 30 days</div>
            </CardContent>
          </Card>
        </div>

        {/* Customers with contributions */}
        <Card className="relative border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
          {/* sheen */}
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:radial-gradient(120%_60%_at_50%_0%,#000_35%,transparent_60%)]">
            <div className="absolute -top-8 left-0 right-0 h-20 bg-gradient-to-b from-white/30 to-transparent dark:from-white/6" />
          </div>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="flex items-center gap-2 min-w-0">
                <span className="truncate">Customers</span>
              </CardTitle>
              <div className="ml-auto shrink-0"><CustomersExportCsvButton rows={csvRows} /></div>
            </div>
          </CardHeader>
          <CardContent>
            {Object.keys(sumByUser).length === 0 ? (
              <p className="opacity-70 text-sm">No customers with contributions yet.</p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Link href={makeUrl({ sort: "name", dir: sortKey === "name" && sortDir === "asc" ? "desc" : "asc", page: "1" })} className="hover:underline">Customer</Link>
                    </TableHead>
                    <TableHead className="text-right">
                      <Link href={makeUrl({ sort: "deposited", dir: sortKey === "deposited" && sortDir === "asc" ? "desc" : "asc", page: "1" })} className="hover:underline">Total Deposited</Link>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map(({ uid, total }) => (
                    <TableRow key={uid}>
                      <TableCell className="max-w-[260px]">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{userLabel[uid]?.name ?? uid}</span>
                          {userLabel[uid]?.email && <span className="text-xs opacity-70 truncate">{userLabel[uid]?.email}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">₦{total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
            {/* Pagination controls */}
            {totalItems > pageSize && (
              <div className="flex items-center justify-between mt-3 text-sm gap-3 flex-wrap">
                <div className="opacity-70">
                  Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
                </div>
                <form action="" className="flex items-center gap-2">
                  <label className="opacity-70">Rows:</label>
                  <select
                    name="pageSize"
                    defaultValue={String(pageSize)}
                    onChange={(e) => {
                      const href = makeUrl({ pageSize: e.target.value, page: "1" });
                      window.location.href = href;
                    }}
                    className="bg-transparent border rounded px-2 py-1"
                  >
                    {[10, 25, 50].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <label className="opacity-70">Page:</label>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    defaultValue={currentPage}
                    className="bg-transparent border rounded px-2 py-1 w-16"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const target = e.target as HTMLInputElement;
                        const val = Math.max(1, Math.min(totalPages, parseInt(target.value || "1", 10)));
                        window.location.href = makeUrl({ page: String(val) });
                      }
                    }}
                  />
                </form>
                <div className="flex items-center gap-2 ml-auto">
                  <Link
                    aria-disabled={currentPage <= 1}
                    className={`px-2 py-1 rounded border ${currentPage <= 1 ? "opacity-40 pointer-events-none" : "hover:bg-white/10"}`}
                    href={makeUrl({ page: String(currentPage - 1) })}
                  >
                    Prev
                  </Link>
                  <Link
                    aria-disabled={currentPage >= totalPages}
                    className={`px-2 py-1 rounded border ${currentPage >= totalPages ? "opacity-40 pointer-events-none" : "hover:bg-white/10"}`}
                    href={makeUrl({ page: String(currentPage + 1) })}
                  >
                    Next
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
          {/* sheen */}
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:radial-gradient(120%_60%_at_50%_0%,#000_35%,transparent_60%)]">
            <div className="absolute -top-8 left-0 right-0 h-20 bg-gradient-to-b from-white/30 to-transparent dark:from-white/6" />
          </div>
          <CardHeader>
            <CardTitle>Recent Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            {!recent || recent.length === 0 ? (
              <p className="opacity-70 text-sm">No contributions yet.</p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.contributed_at}</TableCell>
                      <TableCell className="text-sm max-w-[220px]">
                        <div className="truncate">{userLabel[r.user_id]?.name ?? r.user_id}</div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[220px]">
                        <div className="truncate">{r.agent_id ? (agentLabel[r.agent_id]?.name ?? r.agent_id) : "-"}</div>
                      </TableCell>
                      <TableCell>{r.method}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">₦{Math.round((r.amount_kobo ?? 0) / 100).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
