"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, TrendingUp, Calendar, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";

interface Commission {
  id: string;
  amount_kobo: number;
  created_at: string;
  contribution_id: string;
  referral_user_id: string;
  referral_user_name?: string;
}

interface CommissionStats {
  totalEarnings: number;
  monthlyEarnings: number;
  totalReferrals: number;
  activeReferrals: number;
}

export function CommissionTracking() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<CommissionStats>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    totalReferrals: 0,
    activeReferrals: 0
  });
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const supabase = getSupabaseBrowserClient();
  const { isConnected, lastUpdate } = useRealtimeUpdates();

  const loadCommissionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // Load commissions (handle missing table gracefully)
      let commissionsData: any[] | null = null;
      try {
        const { data: agentCommissions } = await supabase
          .from("agent_commissions")
          .select(`
            id,
            amount_kobo,
            created_at,
            contribution_id,
            referral_user_id
          `)
          .eq("agent_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);
        commissionsData = agentCommissions;
      } catch (error) {
        console.log("agent_commissions table not found, trying commissions table");
        try {
          const { data: commissions } = await supabase
            .from("commissions")
            .select(`
              id,
              amount_kobo,
              created_at,
              contribution_id,
              referral_user_id
            `)
            .eq("agent_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50);
          commissionsData = commissions;
        } catch (error2) {
          console.log("No commission tables found - feature not available");
          commissionsData = [];
        }
      }

      if (commissionsData) {
        setCommissions(commissionsData);

        // Calculate stats
        const totalEarnings = commissionsData.reduce((sum, c) => sum + (c.amount_kobo || 0), 0) / 100;
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyEarnings = commissionsData
          .filter(c => {
            const date = new Date(c.created_at);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          })
          .reduce((sum, c) => sum + (c.amount_kobo || 0), 0) / 100;

        const uniqueReferrals = new Set(commissionsData.map(c => c.referral_user_id)).size;

        setStats({
          totalEarnings,
          monthlyEarnings,
          totalReferrals: uniqueReferrals,
          activeReferrals: uniqueReferrals // Simplified - could be enhanced with activity tracking
        });
      }

      // Get or create referral code (handle missing column gracefully)
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("referral_code")
          .eq("id", user.id)
          .single();

        if (profileData?.referral_code) {
          setReferralCode(profileData.referral_code);
        } else {
          // Generate a referral code if none exists
          const code = `REF${user.id.slice(0, 8).toUpperCase()}`;
          const { error } = await supabase
            .from("profiles")
            .update({ referral_code: code })
            .eq("id", user.id);

          if (!error) {
            setReferralCode(code);
          }
        }
      } catch (error) {
        console.log("Referral code feature not available - column may not exist in current schema");
        // Set a fallback referral code for display purposes
        setReferralCode(`REF${user.id.slice(0, 8).toUpperCase()}`);
      }

    } catch (error) {
      console.error("Error loading commission data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommissionData();
  }, []);

  // Reload data when real-time updates occur
  useEffect(() => {
    if (lastUpdate) {
      loadCommissionData();
    }
  }, [lastUpdate]);

  const copyReferralCode = async () => {
    if (!referralCode) return;
    
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success("Referral code copied! 📋");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy referral code");
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Commission Tracking</h2>
          <p className="text-black/70 font-medium">Earn money by referring friends to Thriftly</p>
        </div>
        {isConnected && (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -2, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <Card className="border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black/70">Total Earnings</p>
                  <p className="text-2xl font-bold text-black">₦{stats.totalEarnings.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -2, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <Card className="border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black/70">This Month</p>
                  <p className="text-2xl font-bold text-black">₦{stats.monthlyEarnings.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -2, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <Card className="border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black/70">Total Referrals</p>
                  <p className="text-2xl font-bold text-black">{stats.totalReferrals}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -2, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <Card className="border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black/70">Active Referrals</p>
                  <p className="text-2xl font-bold text-black">{stats.activeReferrals}</p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Referral Code Section */}
      <Card className="border border-white/20 bg-white/30 backdrop-blur-2xl">
        <CardHeader>
          <CardTitle className="text-black">Your Referral Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1 p-3 bg-white/20 rounded-lg border border-white/30">
              <code className="text-lg font-mono font-bold text-black">{referralCode}</code>
            </div>
            <button
              onClick={copyReferralCode}
              className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transition-all duration-200 hover:scale-105"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-sm text-black/70 mt-2">
            Share this code with friends to earn 10% commission on their contributions!
          </p>
        </CardContent>
      </Card>

      {/* Recent Commissions */}
      <Card className="border border-white/20 bg-white/30 backdrop-blur-2xl">
        <CardHeader>
          <CardTitle className="text-black">Recent Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 mx-auto text-black/30 mb-4" />
              <p className="text-black/60 font-medium">No commissions yet</p>
              <p className="text-sm text-black/50 mt-1">Start referring friends to earn commissions!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {commissions.slice(0, 10).map((commission) => (
                <motion.div
                  key={commission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 bg-white/20 rounded-lg border border-white/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-black">Commission Earned</p>
                      <p className="text-sm text-black/60">From referral contribution</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+₦{Math.round((commission.amount_kobo || 0) / 100).toLocaleString()}</p>
                    <p className="text-xs text-black/50">{formatTimeAgo(commission.created_at)}</p>
                  </div>
                </motion.div>
              ))}
              
              {commissions.length > 10 && (
                <p className="text-center text-sm text-black/60 mt-4">
                  Showing 10 of {commissions.length} commissions
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
