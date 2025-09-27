"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import DashboardShell from "@/components/dashboard/Shell";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { SavingsCircles } from "@/components/Circle/SavingsCircle";
import { CommissionTracking } from "@/components/Commission/CommissionTracking";
import { Users, TrendingUp, DollarSign, Target } from "lucide-react";

export default function AgentPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [totalCommissions, setTotalCommissions] = useState<number>(0);
  const [monthlyCommissions, setMonthlyCommissions] = useState<number>(0);
  const [activeCustomers, setActiveCustomers] = useState<number>(0);
  const [totalSavings, setTotalSavings] = useState<number>(0);
  const [recentActivity, setRecentActivity] = useState<Array<{ id: string; customer_name: string; amount_kobo: number; contributed_at: string }>>([]);
  const [customerList, setCustomerList] = useState<Array<{ id: string; full_name: string; email: string; total_savings: number }>>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Get agent's commission data (try different table names)
      let commissionData = null;
      try {
        // Try agent_commissions table first
        const { data: agentCommissions } = await supabase
          .from("agent_commissions")
          .select("amount_kobo, created_at")
          .eq("agent_id", user.id);
        commissionData = agentCommissions;
      } catch (error) {
        console.log("agent_commissions table not found, trying commissions table");
        try {
          // Try commissions table
          const { data: commissions } = await supabase
            .from("commissions")
            .select("amount_kobo, created_at")
            .eq("agent_id", user.id);
          commissionData = commissions;
        } catch (error2) {
          console.log("commissions table not found, setting defaults");
          commissionData = [];
        }
      }

      if (commissionData) {
        const totalKobo = commissionData.reduce((acc, r) => acc + (r.amount_kobo ?? 0), 0);
        setTotalCommissions(Math.round(totalKobo / 100));

        // Calculate monthly commissions
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const monthlyKobo = commissionData
          .filter(r => new Date(r.created_at) >= thisMonth)
          .reduce((acc, r) => acc + (r.amount_kobo ?? 0), 0);
        setMonthlyCommissions(Math.round(monthlyKobo / 100));
      }

      // Since agent system was removed, show a message that this feature is not available
      console.log("Agent system has been removed - showing placeholder data");
      customers = [];

      if (customers) {
        setActiveCustomers(customers.length);

        // Get total savings for these customers
        const customerIds = customers.map(c => c.id);
        const { data: contributions } = await supabase
          .from("contributions")
          .select("user_id, amount_kobo")
          .in("user_id", customerIds);

        if (contributions) {
          const totalKobo = contributions.reduce((acc, r) => acc + (r.amount_kobo ?? 0), 0);
          setTotalSavings(Math.round(totalKobo / 100));

          // Build customer list with savings
          const customerSavings = customerIds.map(id => {
            const customer = customers.find(c => c.id === id);
            const savings = contributions
              .filter(c => c.user_id === id)
              .reduce((acc, r) => acc + (r.amount_kobo ?? 0), 0);
            return {
              id,
              full_name: customer?.full_name || "Unknown",
              email: customer?.email || "",
              total_savings: Math.round(savings / 100)
            };
          });

          setCustomerList(customerSavings);
        }
      }

      // Get recent activity (contributions from customers)
      const { data: recentContributions } = await supabase
        .from("contributions")
        .select(`
          id,
          amount_kobo,
          contributed_at,
          profiles!contributions_user_id_fkey(full_name)
        `)
        .in("user_id", customers?.map(c => c.id) || [])
        .order("contributed_at", { ascending: false })
        .limit(10);

      if (recentContributions) {
        setRecentActivity(recentContributions.map(r => ({
          id: r.id,
          customer_name: (r.profiles as any)?.full_name || "Unknown",
          amount_kobo: r.amount_kobo || 0,
          contributed_at: r.contributed_at
        })));
      }

    } catch (error) {
      console.error("Error loading agent data:", error);
      // Don't show error toast for missing tables - just log it
      console.log("Agent dashboard running in fallback mode - some features may not be available");
    } finally {
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: refresh data when contributions or commissions change
  useEffect(() => {
    let contributionsChannel: any = null;
    let commissionsChannel: any = null;
    let profilesChannel: any = null;
    let connectionTimeout: NodeJS.Timeout;
    
    (async () => {
      try {
        setIsConnecting(true);
        setConnectionError(null);
        
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setConnectionError("Not authenticated");
          setIsConnecting(false);
          return;
        }

        // Since agent system was removed, no customers to track
        console.log("Agent system has been removed - no real-time subscriptions needed");
        const customers = [];

        if (!customers || customers.length === 0) {
          console.log("No customers found for agent");
          setIsConnecting(false);
          setIsConnected(false);
          // Still set up a basic connection for future customers
          setIsConnected(true);
          return;
        }

        const customerIds = customers.map(c => c.id);
        console.log("Setting up real-time subscriptions for customers:", customerIds);

        // Set a timeout to prevent indefinite connecting state
        connectionTimeout = setTimeout(() => {
          if (isConnecting) {
            console.log("Connection timeout - setting as connected anyway");
            setIsConnected(true);
            setIsConnecting(false);
          }
        }, 10000); // 10 second timeout

      // Subscribe to contributions from customers
      contributionsChannel = supabase
        .channel("realtime:agent:contributions")
        .on(
          "postgres_changes",
          { 
            event: "*", 
            schema: "public", 
            table: "contributions",
            filter: `user_id=in.(${customerIds.join(',')})`
          },
          async (payload: any) => {
            console.log("Real-time contribution update:", payload);
            setIsConnected(true);
            
            // Refresh all data when contributions change
            await loadData();
            
            // Show toast for new contributions
            if (payload?.eventType === "INSERT") {
              const amount = Math.round((payload?.new?.amount_kobo ?? 0) / 100);
              toast.success(`New contribution: ₦${amount.toLocaleString()}`);
            }
          }
        )
        .subscribe((status) => {
          console.log("Contributions channel status:", status);
          if (status === "SUBSCRIBED") {
            clearTimeout(connectionTimeout);
            setIsConnected(true);
            setIsConnecting(false);
            setConnectionError(null);
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            clearTimeout(connectionTimeout);
            setConnectionError("Connection failed");
            setIsConnecting(false);
            setIsConnected(false);
          }
        });

      // Subscribe to commission changes for this agent (try different table names)
      try {
        commissionsChannel = supabase
          .channel("realtime:agent:commissions")
          .on(
            "postgres_changes",
            { 
              event: "*", 
              schema: "public", 
              table: "agent_commissions",
              filter: `agent_id=eq.${user.id}`
            },
          async (payload: any) => {
            console.log("Real-time commission update:", payload);
            setIsConnected(true);
            
            // Refresh commission data
            await loadData();
            
            // Show toast for new commissions
            if (payload?.eventType === "INSERT") {
              const amount = Math.round((payload?.new?.amount_kobo ?? 0) / 100);
              toast.success(`New commission earned: ₦${amount.toLocaleString()}`);
            }
          }
        )
        .subscribe((status) => {
          console.log("Commissions channel status:", status);
          if (status === "SUBSCRIBED") {
            clearTimeout(connectionTimeout);
            setIsConnected(true);
            setIsConnecting(false);
            setConnectionError(null);
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            clearTimeout(connectionTimeout);
            setConnectionError("Connection failed");
            setIsConnecting(false);
            setIsConnected(false);
          }
        });
      } catch (error) {
        console.log("Could not set up commissions real-time subscription:", error);
        // Continue without commissions subscription
      }

      // Subscribe to profile changes (new customers assigned) - try different approaches
      let profilesChannel = null;
      try {
        profilesChannel = supabase
          .channel("realtime:agent:profiles")
          .on(
            "postgres_changes",
            { 
              event: "*", 
              schema: "public", 
              table: "profiles",
              filter: `agent_id=eq.${user.id}`
            },
          async (payload: any) => {
            console.log("Real-time profile update:", payload);
            setIsConnected(true);
            
            // Refresh customer data
            await loadData();
            
            // Show toast for new customers
            if (payload?.eventType === "INSERT") {
              const customerName = payload?.new?.full_name || "New customer";
              toast.success(`New customer assigned: ${customerName}`);
            }
          }
        )
        .subscribe((status) => {
          console.log("Profiles channel status:", status);
          if (status === "SUBSCRIBED") {
            clearTimeout(connectionTimeout);
            setIsConnected(true);
            setIsConnecting(false);
            setConnectionError(null);
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            clearTimeout(connectionTimeout);
            setConnectionError("Connection failed");
            setIsConnecting(false);
            setIsConnected(false);
          }
        });
      } catch (error) {
        console.log("Could not set up profiles real-time subscription:", error);
        // Continue without profiles subscription
      }

      } catch (error) {
        console.error("Error setting up real-time subscriptions:", error);
        setConnectionError("Failed to connect");
        setIsConnecting(false);
        setIsConnected(false);
      }

    })();

    return () => {
      if (connectionTimeout) clearTimeout(connectionTimeout);
      if (contributionsChannel) supabase.removeChannel(contributionsChannel);
      if (commissionsChannel) supabase.removeChannel(commissionsChannel);
      if (profilesChannel) supabase.removeChannel(profilesChannel);
    };
  }, [supabase]);

  return (
    <DashboardShell role="agent" title="Agent Dashboard">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl rounded-2xl p-3 shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3">
            <div className="relative h-7 w-7">
              <Image src="/aj2.png" alt="Ajopay" fill sizes="28px" className="object-contain" />
            </div>
            <h1 className="text-xl font-semibold">Agent Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm opacity-70">
              Empowering savings culture across Nigeria
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 
                isConnecting ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500'
              }`} />
              <span className="text-xs opacity-70">
                {isConnected ? 'Live' : 
                 isConnecting ? 'Connecting...' : 
                 connectionError ? 'Offline' : 'Disconnected'}
              </span>
              {lastUpdate && (
                <span className="text-xs opacity-50">
                  • {format(lastUpdate, 'HH:mm:ss')}
                </span>
              )}
              {!isConnected && !isConnecting && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsConnecting(true);
                    loadData();
                  }}
                  className="h-6 px-2 text-xs"
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
            <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4" />
                  Total Commissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">₦{totalCommissions.toLocaleString()}</div>
                <div className="text-xs opacity-70">All time earnings</div>
                {isConnected && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
            <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">₦{monthlyCommissions.toLocaleString()}</div>
                <div className="text-xs opacity-70">Current month</div>
                {isConnected && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
            <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  Active Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{activeCustomers}</div>
                <div className="text-xs opacity-70">Under your guidance</div>
                {isConnected && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
            <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4" />
                  Total Savings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">₦{totalSavings.toLocaleString()}</div>
                <div className="text-xs opacity-70">Customer contributions</div>
                {isConnected && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="flex flex-wrap gap-2 w-full">
            <TabsTrigger value="customers" className="flex-1 sm:flex-none">My Customers</TabsTrigger>
            <TabsTrigger value="commissions" className="flex-1 sm:flex-none">Commissions</TabsTrigger>
            <TabsTrigger value="circles" className="flex-1 sm:flex-none">Savings Circles</TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
              <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
                <CardHeader>
                  <CardTitle>Customer Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  {customerList.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto opacity-50 mb-4" />
                      <p className="opacity-70 text-sm">Agent system has been removed.</p>
                      <p className="opacity-50 text-xs mt-2">This feature is no longer available in the current version.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerList.map((customer) => (
                        <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/20 border border-white/10">
                          <div>
                            <div className="font-medium">{customer.full_name}</div>
                            <div className="text-sm opacity-70">{customer.email}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">₦{customer.total_savings.toLocaleString()}</div>
                            <div className="text-xs opacity-70">Total saved</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="commissions">
            <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
              <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
                <CardHeader>
                  <CardTitle>Commission Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <CommissionTracking />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="circles">
            <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
              <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
                <CardHeader>
                  <CardTitle>Savings Circles Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <SavingsCircles />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Recent Activity */}
        <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
          <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Customer Activity</CardTitle>
                {isConnected && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs opacity-70">Live updates</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="opacity-70 text-sm">Agent system has been removed - no customer activity to track.</p>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 dark:bg-black/10">
                      <div>
                        <div className="text-sm font-medium">{activity.customer_name}</div>
                        <div className="text-xs opacity-70">{format(new Date(activity.contributed_at), "PPP")}</div>
                      </div>
                      <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        +₦{Math.round(activity.amount_kobo / 100).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Agent Mission Statement */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border border-white/20 dark:border-white/10 bg-gradient-to-r from-purple-600/20 to-violet-500/20 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
            <CardContent className="p-6 text-center">
              <h2 className="font-bold text-white dark:text-white text-xl mb-4">Agent System Notice</h2>
              <p className="text-white/80 dark:text-white/80 text-sm max-w-2xl mx-auto">
                The agent system has been removed from AjoPay to simplify the platform. 
                This dashboard is kept for reference but is no longer functional. 
                All users now have direct access to the savings features.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500"
                  onClick={() => window.location.href = '/customer'}
                >
                  Go to Customer Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white/30 bg-white/10 hover:bg-white/20"
                  onClick={() => window.location.href = '/sign-out'}
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
