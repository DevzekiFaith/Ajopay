"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Users, Plus, UserPlus, Settings } from "lucide-react";
import { AjoPaySpinner } from "@/components/ui/AjoPaySpinner";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface SavingsCircle {
  id: string;
  name: string;
  description: string;
  type: 'ajo' | 'esusu' | 'thrift' | 'investment';
  contributionAmount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  duration: number; // in cycles
  maxMembers: number;
  currentMembers: Member[];
  createdBy: string;
  createdAt: string;
  startDate: string;
  currentCycle: number;
  totalPool: number;
  nextPayoutDate: string;
  nextPayoutRecipient: string;
  isActive: boolean;
  joinCode: string;
  rules: string[];
}

interface Member {
  id: string;
  name: string;
  avatar: string;
  joinedAt: string;
  contributionHistory: Contribution[];
  totalContributed: number;
  isAdmin: boolean;
  payoutReceived: boolean;
  payoutCycle?: number;
}

interface Contribution {
  id: string;
  memberId: string;
  amount: number;
  cycle: number;
  date: string;
  status: 'paid' | 'pending' | 'late';
}



export function SavingsCircles() {
  const [circles, setCircles] = useState<SavingsCircle[]>([]);
  const [showCreateCircle, setShowCreateCircle] = useState(false);
  const [showJoinCircle, setShowJoinCircle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [newCircle, setNewCircle] = useState({
    name: '',
    description: '',
    type: 'ajo' as 'ajo' | 'esusu' | 'thrift' | 'investment',
    contributionAmount: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
    duration: '',
    maxMembers: '',
    rules: ''
  });

  const supabase = getSupabaseBrowserClient();
  const { isConnected, lastUpdate, triggerUpdate } = useRealtimeUpdates(currentUserId || undefined);

  // Load savings circles from database
  const loadCircles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      console.log("Loading circles for user:", user.id);

      // Load circles where user is a member or creator (simplified query)
      const { data: circlesData, error: circlesError } = await supabase
        .from("savings_circles")
        .select("*")
        .or(`created_by.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (circlesError) {
        console.error("Error loading circles:", circlesError);
        setCircles([]);
        return;
      }

      if (circlesData) {
        console.log("Raw circles data:", circlesData);
        const formattedCircles = circlesData.map((circle: any) => ({
          id: circle.id,
          name: circle.name,
          description: circle.description || '',
          type: circle.type,
          contributionAmount: circle.contribution_amount,
          frequency: circle.frequency,
          duration: circle.duration,
          maxMembers: circle.max_members,
          currentMembers: [], // Simplified - will load separately if needed
          createdBy: circle.created_by,
          createdAt: circle.created_at,
          startDate: circle.start_date,
          currentCycle: circle.current_cycle || 1,
          totalPool: circle.total_pool || 0,
          nextPayoutDate: circle.next_payout_date || '',
          nextPayoutRecipient: circle.next_payout_recipient || '',
          isActive: circle.is_active || false,
          joinCode: circle.join_code || '',
          rules: circle.rules ? JSON.parse(circle.rules) : []
        }));
        console.log("Formatted circles:", formattedCircles);
        setCircles(formattedCircles);
      } else {
        console.log("No circles data received");
        setCircles([]);
      }
    } catch (error) {
      console.error("Error loading savings circles:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reload data when real-time updates occur
  useEffect(() => {
    if (lastUpdate) {
      loadCircles();
    }
  }, [lastUpdate]);

  useEffect(() => {
    loadCircles();
  }, []);


  const createCircle = async () => {
    if (!newCircle.name || !newCircle.contributionAmount || !newCircle.duration || !newCircle.maxMembers || !currentUserId) {
      toast.error("Please fill in all required fields");
      return;
    }

    console.log("Starting circle creation with:", {
      name: newCircle.name,
      contributionAmount: newCircle.contributionAmount,
      duration: newCircle.duration,
      maxMembers: newCircle.maxMembers,
      currentUserId
    });

    // Check if user profile exists
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", currentUserId)
        .single();

      if (profileError) {
        console.error("Profile check failed:", profileError);
        toast.error("User profile not found. Please try logging out and back in.");
        return;
      }

      console.log("User profile found:", profile);
    } catch (profileCheckError) {
      console.error("Profile check error:", profileCheckError);
      toast.error("Error checking user profile. Please try again.");
      return;
    }

    try {
      const circleData = {
        name: newCircle.name,
        description: newCircle.description,
        type: newCircle.type,
        contribution_amount: parseFloat(newCircle.contributionAmount),
        frequency: newCircle.frequency,
        duration: parseInt(newCircle.duration),
        max_members: parseInt(newCircle.maxMembers),
        created_by: currentUserId,
        start_date: new Date().toISOString(),
        current_cycle: 1,
        total_pool: 0,
        is_active: false, // Will be activated when enough members join
        join_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        rules: JSON.stringify(newCircle.rules.split('\n').filter(rule => rule.trim()))
      };

      console.log("Creating circle with data:", circleData);
      
      const { data, error } = await supabase
        .from("savings_circles")
        .insert(circleData)
        .select()
        .single();

      if (error) {
        console.error("Error creating savings circle:", error);
        throw error;
      }

      // Add creator as first member and admin
      console.log("Adding creator as member:", { circle_id: data.id, user_id: currentUserId });
      
      const { error: memberError } = await supabase
        .from("circle_members")
        .insert({
          circle_id: data.id,
          user_id: currentUserId,
          is_admin: true,
          joined_at: new Date().toISOString()
        });

      if (memberError) {
        console.error("Error adding creator as member:", memberError);
        throw memberError;
      }

      // Trigger real-time update for circle creation
      triggerUpdate('circle_created', {
        circleName: newCircle.name,
        circleType: newCircle.type,
        joinCode: circleData.join_code
      });

      toast.success("Savings circle created! ", {
        description: `Share join code: ${circleData.join_code}`
      });

      setNewCircle({
        name: '',
        description: '',
        type: 'ajo',
        contributionAmount: '',
        frequency: 'monthly',
        duration: '',
        maxMembers: '',
        rules: ''
      });
      setShowCreateCircle(false);
      loadCircles();
    } catch (error: any) {
      console.error("Error creating circle:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      toast.error(`Failed to create savings circle: ${error.message || 'Unknown error'}`);
    }
  };

  const joinCircleByCode = async () => {
    if (!joinCode.trim() || !currentUserId) {
      toast.error("Please enter a valid join code");
      return;
    }

    try {
      // Find circle by join code
      const { data: circleData, error: circleError } = await supabase
        .from("savings_circles")
        .select("*")
        .eq("join_code", joinCode.toUpperCase())
        .single();

      if (circleError || !circleData) {
        toast.error("Invalid join code");
        return;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("circle_members")
        .select("*")
        .eq("circle_id", circleData.id)
        .eq("user_id", currentUserId)
        .single();

      if (existingMember) {
        toast.error("You are already a member of this circle");
        return;
      }

      // Check if circle is full
      const { data: memberCount } = await supabase
        .from("circle_members")
        .select("*", { count: 'exact' })
        .eq("circle_id", circleData.id);

      if (memberCount && memberCount.length >= circleData.max_members) {
        toast.error("This circle is full");
        return;
      }

      // Add user to circle
      const { error: joinError } = await supabase
        .from("circle_members")
        .insert({
          circle_id: circleData.id,
          user_id: currentUserId,
          is_admin: false,
          joined_at: new Date().toISOString()
        });

      if (joinError) throw joinError;

      // Trigger real-time update for circle join
      triggerUpdate('circle_joined', {
        circleName: circleData.name,
        circleId: circleData.id
      });

      toast.success("Successfully joined the circle! ", {
        description: `Welcome to ${circleData.name}`
      });

      setJoinCode('');
      setShowJoinCircle(false);
      loadCircles();
    } catch (error) {
      console.error("Error joining circle:", error);
      toast.error("Failed to join circle");
    }
  };

  const makeContribution = async (circleId: string, amount: number) => {
    if (!currentUserId) return;

    try {
      const circle = circles.find(c => c.id === circleId);
      if (!circle) return;

      // Record contribution
      const { error: contributionError } = await supabase
        .from("circle_contributions")
        .insert({
          circle_id: circleId,
          user_id: currentUserId,
          amount_kobo: amount * 100,
          contribution_date: new Date().toISOString(),
          cycle_number: circle.currentCycle
        });

      if (contributionError) throw contributionError;

      // Update member's total contribution
      const member = circle.currentMembers.find(m => m.id === currentUserId);
      const newTotal = (member?.totalContributed || 0) + amount;

      const { error: memberError } = await supabase
        .from("circle_members")
        .update({ total_contributed: newTotal })
        .eq("circle_id", circleId)
        .eq("user_id", currentUserId);

      if (memberError) throw memberError;

      // Update circle total pool
      const { error: circleError } = await supabase
        .from("savings_circles")
        .update({ total_pool: circle.totalPool + amount })
        .eq("id", circleId);

      if (circleError) throw circleError;

      // Trigger real-time update for contribution
      triggerUpdate('circle_contribution', {
        circleName: circle.name,
        amount,
        circleId
      });

      toast.success("Contribution recorded! ", {
        description: `₦${amount.toLocaleString()} added to ${circle.name}`
      });

      loadCircles();
    } catch (error) {
      console.error("Error making contribution:", error);
      toast.error("Failed to record contribution");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <AjoPaySpinner size="md" showText text="Loading savings circles..." />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900 dark:to-pink-900 min-h-screen">
      {/* Connection Status */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mb-4"
        >
          <motion.div 
            className="w-2 h-2 bg-green-500 rounded-full"
            animate={{ scale: [1, 1.2] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
          <span>Real-time updates active</span>
        </motion.div>
      )}

      {/* Header Section with Neuomorphic Design */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6"
      >
        <div className="space-y-2">
          <div className="relative inline-block">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-600 rounded-3xl blur-2xl opacity-20"
              animate={{ scale: [1, 1.1] }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
            <div className="relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl px-4 sm:px-6 py-2 sm:py-3 rounded-2xl sm:rounded-3xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155]">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                🔄 Savings Circles
              </h2>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium max-w-2xl">
            Join or create group savings with friends and family
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Dialog open={showJoinCircle} onOpenChange={setShowJoinCircle}>
            <DialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-2xl p-3 sm:p-4 shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-300 border border-white/30 dark:border-slate-700/30 w-full sm:w-auto"
              >
                <div className="relative flex items-center gap-2">
                  <motion.div whileHover={{ rotate: 15 }}>
                    <UserPlus className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                  </motion.div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm sm:text-base">Join Circle</span>
                </div>
              </motion.button>
            </DialogTrigger>
            <DialogContent className="max-w-lg mx-4 sm:mx-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border-0 shadow-[30px_30px_60px_#d1d9e6,-30px_-30px_60px_#ffffff] dark:shadow-[30px_30px_60px_#0f172a,-30px_-30px_60px_#334155] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4 sm:mb-6">
                  🔗 Join Circle
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 p-4">
                <div className="space-y-3">
                  <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Circle Join Code</Label>
                  <Input
                    placeholder="Enter 6-digit code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300 py-4 px-6 text-center font-mono text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={joinCircleByCode}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl py-4 px-6 shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-300 text-white font-bold text-lg"
                >
                  Join Circle
                </motion.button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCreateCircle} onOpenChange={setShowCreateCircle}>
            <DialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-3 sm:p-4 shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-300 w-full sm:w-auto"
              >
                <div className="relative flex items-center gap-2">
                  <motion.div whileHover={{ rotate: 90 }}>
                    <Plus className="w-5 h-5 text-white" />
                  </motion.div>
                  <span className="font-bold text-white text-sm sm:text-base">Create Circle</span>
                </div>
              </motion.button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl mx-4 sm:mx-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border-0 shadow-[30px_30px_60px_#d1d9e6,-30px_-30px_60px_#ffffff] dark:shadow-[30px_30px_60px_#0f172a,-30px_-30px_60px_#334155] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 sm:mb-6">
                  ✨ Create New Circle
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 max-h-96 overflow-y-auto p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Circle Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Family Savings Group"
                      value={newCircle.name}
                      onChange={(e) => setNewCircle({ ...newCircle, name: e.target.value })}
                      className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300 py-4 px-6"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Circle Type *</Label>
                    <Select value={newCircle.type} onValueChange={(value: any) => setNewCircle({ ...newCircle, type: value })}>
                      <SelectTrigger className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ajo">Ajo (Traditional)</SelectItem>
                        <SelectItem value="esusu">Esusu (Rotating)</SelectItem>
                        <SelectItem value="thrift">Thrift (Cooperative)</SelectItem>
                        <SelectItem value="investment">Investment Club</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="contributionAmount" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Contribution Amount (₦) *</Label>
                    <Input
                      id="contributionAmount"
                      type="number"
                      placeholder="5000"
                      value={newCircle.contributionAmount}
                      onChange={(e) => setNewCircle({ ...newCircle, contributionAmount: e.target.value })}
                      className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300 py-4 px-6"
                    />
                  </div>
                  <div>
                    <Label htmlFor="frequency" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Frequency *</Label>
                    <Select value={newCircle.frequency} onValueChange={(value: any) => setNewCircle({ ...newCircle, frequency: value })}>
                      <SelectTrigger className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="maxMembers" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Max Members *</Label>
                    <Input
                      id="maxMembers"
                      type="number"
                      placeholder="10"
                      value={newCircle.maxMembers}
                      onChange={(e) => setNewCircle({ ...newCircle, maxMembers: e.target.value })}
                      className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300 py-4 px-6"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="duration" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Duration (cycles) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="12"
                    value={newCircle.duration}
                    onChange={(e) => setNewCircle({ ...newCircle, duration: e.target.value })}
                    className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300 py-4 px-6"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose and goals of this savings circle..."
                    value={newCircle.description}
                    onChange={(e) => setNewCircle({ ...newCircle, description: e.target.value })}
                    className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300 py-4 px-6"
                  />
                </div>

                <div>
                  <Label htmlFor="rules" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Circle Rules</Label>
                  <Textarea
                    id="rules"
                    placeholder="Enter rules (one per line)&#10;e.g., Contributions must be made by the 5th of each month&#10;Late payments incur a ₦500 penalty"
                    value={newCircle.rules}
                    onChange={(e) => setNewCircle({ ...newCircle, rules: e.target.value })}
                    className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300 py-4 px-6"
                    rows={4}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={createCircle}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl py-4 px-6 shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-300 text-white font-bold text-lg"
                >
                  Create Circle
                </motion.button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Circles Grid */}
      {circles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl flex items-center justify-center shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155]"
          >
            <Users className="w-12 h-12 text-purple-600 dark:text-purple-400" />
          </motion.div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">No Savings Circles Yet</h3>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium max-w-md mx-auto px-4">
            Create your first savings circle or join an existing one to start saving together!
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {circles.map((circle, index) => (
            <motion.div
              key={circle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-600/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"
                animate={{ scale: [1, 1.05] }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: index * 0.5
                }}
              />
              <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-[25px_25px_50px_#d1d9e6,-25px_-25px_50px_#ffffff] dark:shadow-[25px_25px_50px_#0f172a,-25px_-25px_50px_#334155] hover:shadow-[30px_30px_60px_#d1d9e6,-30px_-30px_60px_#ffffff] dark:hover:shadow-[30px_30px_60px_#0f172a,-30px_-30px_60px_#334155] transition-all duration-700 border border-white/30 dark:border-slate-700/30">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-200">{circle.name}</h2>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                        {circle.type.toUpperCase()}
                      </Badge>
                      <Badge variant={circle.isActive ? "default" : "secondary"}>
                        {circle.isActive ? "Active" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Join Code</div>
                    <div className="font-bold text-purple-600 dark:text-purple-400 text-sm sm:text-base">{circle.joinCode}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  {circle.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{circle.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div>
                      <div className="text-slate-600 dark:text-slate-400">Contribution</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">₦{circle.contributionAmount.toLocaleString()}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{circle.frequency}</div>
                    </div>
                    <div>
                      <div className="text-slate-600 dark:text-slate-400">Members</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{circle.currentMembers.length}/{circle.maxMembers}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Cycle {circle.currentCycle}/{circle.duration}</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600 dark:text-slate-400">Total Pool</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">₦{circle.totalPool.toLocaleString()}</span>
                    </div>
                    <Progress 
                      value={(circle.currentMembers.length / circle.maxMembers) * 100} 
                      className="h-2" 
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => makeContribution(circle.id, circle.contributionAmount)}
                      disabled={!circle.isActive}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl py-2 sm:py-3 px-3 sm:px-4 shadow-[12px_12px_24px_#d1d9e6,-12px_-12px_24px_#ffffff] dark:shadow-[12px_12px_24px_#0f172a,-12px_-12px_24px_#334155] hover:shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:hover:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] transition-all duration-300 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      Contribute
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 15 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 sm:p-3 bg-slate-100/50 dark:bg-slate-700/50 rounded-2xl shadow-[12px_12px_24px_#d1d9e6,-12px_-12px_24px_#ffffff] dark:shadow-[12px_12px_24px_#0f172a,-12px_-12px_24px_#334155] hover:shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:hover:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] transition-all duration-300 w-full sm:w-auto"
                    >
                      <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
