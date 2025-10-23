"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ExportCsvButton from "./ExportCsvButton";
import AdminRealtimeRefresher from "./AdminRealtimeRefresher";
import AdminTotalCard from "./AdminTotalCard";
import Link from "next/link";
import Image from "next/image";
import CustomersExportCsvButton from "./customers/CustomersExportCsvButton";
import { AdvancedLoadingSpinner, CardSkeleton } from "@/components/ui/loading-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminStats {
  totalKobo: number;
  todayKobo: number;
  last7Naira: number;
  prev7Naira: number;
  wowPct: number;
  isUp: boolean;
  sparkPoints: string;
  sumByUser: Record<string, number>;
  userLabel: Record<string, { name: string; email: string | null }>;
  recent: Array<{
    id: string;
    user_id: string;
    amount_kobo: number;
    method: string;
    status: string;
    contributed_at: string;
  }>;
  today: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);

  const loadStats = async () => {
    try {
      console.log('Loading admin stats...');
      const res = await fetch('/api/admin/stats', { cache: 'no-store' });
      console.log('Admin stats response:', { status: res.status, ok: res.ok });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Admin stats API error:', errorData);
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to fetch admin stats`);
      }
      const data = await res.json();
      console.log('Admin stats data received:', data);
      setStats(data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
      // Try to get more detailed error info
      try {
        const healthRes = await fetch('/api/admin/health', { cache: 'no-store' });
        const healthData = await healthRes.json();
        console.log('Admin health check:', healthData);
      } catch (healthError) {
        console.error('Health check failed:', healthError);
      }
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async () => {
    setPromoting(true);
    try {
      const res = await fetch('/api/admin/promote-user', { method: 'POST' });
      if (res.ok) {
        alert('Successfully promoted to admin! Please refresh the page.');
        window.location.reload();
      } else {
        const error = await res.json();
        alert('Failed to promote: ' + error.error);
      }
    } catch (error) {
      alert('Error promoting to admin');
    } finally {
      setPromoting(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <DashboardShell role="admin" title="Admin Dashboard">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Header skeleton */}
          <div className="relative flex flex-wrap items-center justify-between gap-3 border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl rounded-2xl p-3 shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <div className="h-8 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="h-8 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} className="h-32" />
            ))}
          </div>

          {/* Tables skeleton */}
          <div className="space-y-6">
            <CardSkeleton className="h-64" />
            <CardSkeleton className="h-64" />
          </div>

          {/* Loading indicator */}
          <div className="flex justify-center py-8">
            <AdvancedLoadingSpinner 
              text="Loading Admin Dashboard" 
              size="lg"
            />
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!stats) {
    return (
      <DashboardShell role="admin">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md mx-auto">
            <div className="relative">
              <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Failed to Load Admin Data
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                This could be due to insufficient permissions or a server error. 
                Please check the browser console for more details.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={loadStats}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Try Again
              </button>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/debug/env', { cache: 'no-store' });
                    const data = await res.json();
                    console.log('Environment debug info:', data);
                    alert('Check browser console for debug info');
                  } catch (error) {
                    console.error('Debug check failed:', error);
                    alert('Debug check failed - see console');
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Debug Info
              </button>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const { totalKobo, todayKobo, last7Naira, prev7Naira, wowPct, isUp, sparkPoints, sumByUser, userLabel, recent, today } = stats;

  // Active days in last 30 within scope (simplified calculation)
  const activeDays30 = Math.min(30, Object.keys(sumByUser).length); // Simplified for now
  const activePct30 = Math.round((activeDays30 / 30) * 100);

  // Sorting & pagination for Customers (simplified for client-side)
  const sortKey: "deposited" | "name" = "deposited"; // Default sort
  const sortDir: "asc" | "desc" = "desc"; // Default direction
  const page = 1; // Default page
  const pageSize = 10; // Default page size
  const entries = Object.entries(sumByUser).map(([uid, total]) => ({ uid, total, name: userLabel[uid]?.name ?? uid }));
  const cmp = (a: { uid: string; total: number; name: string }, b: { uid: string; total: number; name: string }) => {
    const mult = (sortDir as "asc" | "desc") === "asc" ? 1 : -1;
    if ((sortKey as "deposited" | "name") === "name") return a.name.localeCompare(b.name) * mult;
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
    commission: 0, // No commissions since agent system was removed
  }));

  return (
    <DashboardShell role="admin" title="Admin Dashboard">
        <AdminRealtimeRefresher onRefresh={loadStats} />
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
            <Button 
              onClick={promoteToAdmin}
              disabled={promoting}
              variant="outline" 
              size="sm" 
              className="bg-green-500/20 border-green-500/30 hover:bg-green-500/30 text-green-600"
            >
              {promoting ? "Promoting..." : "👑 Become Admin"}
            </Button>
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
                      <Link href={makeUrl({ sort: "name", dir: (sortKey as "deposited" | "name") === "name" && (sortDir as "asc" | "desc") === "asc" ? "desc" : "asc", page: "1" })} className="hover:underline">Customer</Link>
                    </TableHead>
                    <TableHead className="text-right">
                      <Link href={makeUrl({ sort: "deposited", dir: (sortKey as "deposited" | "name") === "deposited" && (sortDir as "asc" | "desc") === "asc" ? "desc" : "asc", page: "1" })} className="hover:underline">Total Deposited</Link>
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
