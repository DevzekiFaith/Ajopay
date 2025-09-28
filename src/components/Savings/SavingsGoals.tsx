"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Target, Calendar, Trash2, Edit3, Trophy, Shield, Plane, Smartphone, GraduationCap, Home, Car, Briefcase, DollarSign } from "lucide-react";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface SavingsGoal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  emoji: string;
  createdAt: string;
  isCompleted: boolean;
}

const goalCategories = [
  { value: "emergency", label: "Emergency Fund", icon: Shield },
  { value: "vacation", label: "Vacation", icon: Plane },
  { value: "gadget", label: "Gadget/Electronics", icon: Smartphone },
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "home", label: "Home/Property", icon: Home },
  { value: "car", label: "Vehicle", icon: Car },
  { value: "business", label: "Business", icon: Briefcase },
  { value: "other", label: "Other", icon: Target },
];

export function SavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [addingToGoal, setAddingToGoal] = useState<SavingsGoal | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    targetAmount: "",
    targetDate: "",
    category: "",
  });

  const supabase = getSupabaseBrowserClient();
  const { isConnected, lastUpdate, triggerUpdate } = useRealtimeUpdates(currentUserId || undefined);

  // Load savings goals from database
  const loadGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      const { data: goalsData } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (goalsData) {
        const formattedGoals = goalsData.map(goal => ({
          id: goal.id,
          title: goal.title,
          description: goal.description || '',
          targetAmount: goal.target_amount,
          currentAmount: goal.current_amount || 0,
          targetDate: goal.target_date,
          category: goal.category || 'other',
          emoji: getCategoryEmoji(goal.category || 'other'),
          createdAt: goal.created_at,
          isCompleted: goal.current_amount >= goal.target_amount
        }));
        setGoals(formattedGoals);
      }
    } catch (error) {
      console.error("Error loading savings goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      emergency: '🛡️',
      vacation: '✈️',
      gadget: '📱',
      education: '🎓',
      home: '🏠',
      car: '🚗',
      business: '💼',
      other: '🎯'
    };
    return emojiMap[category] || '🎯';
  };

  // Reload data when real-time updates occur
  useEffect(() => {
    if (lastUpdate) {
      loadGoals();
    }
  }, [lastUpdate]);

  useEffect(() => {
    loadGoals();
  }, []);

  const createGoal = async () => {
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.targetDate || !currentUserId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const goalData = {
        user_id: currentUserId,
        title: newGoal.title,
        description: newGoal.description,
        target_amount: parseFloat(newGoal.targetAmount),
        current_amount: 0,
        target_date: newGoal.targetDate,
        category: newGoal.category || 'other'
      };

      const { data, error } = await supabase
        .from("savings_goals")
        .insert(goalData)
        .select()
        .single();

      if (error) throw error;

      // Trigger real-time update for goal creation
      triggerUpdate('goal_created', {
        goalTitle: newGoal.title,
        targetAmount: parseFloat(newGoal.targetAmount)
      });

      toast.success("Savings goal created! 🎯", {
        description: "Start saving towards your goal today"
      });

      setNewGoal({ title: "", description: "", targetAmount: "", targetDate: "", category: "" });
      setIsCreateDialogOpen(false);
      loadGoals();
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("Failed to create savings goal");
    }
  };

  const updateGoalProgress = async (goalId: string, amount: number) => {
    if (!currentUserId) return;

    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const newCurrentAmount = goal.currentAmount + amount;
      const isCompleted = newCurrentAmount >= goal.targetAmount;

      const { error } = await supabase
        .from("savings_goals")
        .update({ current_amount: newCurrentAmount })
        .eq("id", goalId);

      if (error) throw error;

      // Trigger real-time update for goal progress
      if (isCompleted && !goal.isCompleted) {
        triggerUpdate('goal_completed', {
          goalTitle: goal.title,
          goalId,
          targetAmount: goal.targetAmount
        });
      } else {
        triggerUpdate('goal_progress', {
          goalTitle: goal.title,
          goalId,
          newAmount: newCurrentAmount,
          targetAmount: goal.targetAmount
        });
      }

      toast.success(isCompleted ? "Goal completed! 🎉" : "Progress updated! 📈");
      loadGoals();
    } catch (error) {
      console.error("Error updating goal progress:", error);
      toast.error("Failed to update progress");
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from("savings_goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;

      toast.success("Goal deleted successfully");
      loadGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal");
    }
  };

  const editGoal = async (goalId: string, updatedData: Partial<SavingsGoal>) => {
    if (!currentUserId) return;

    try {
      const updateData: any = {};
      if (updatedData.title) updateData.title = updatedData.title;
      if (updatedData.description !== undefined) updateData.description = updatedData.description;
      if (updatedData.targetAmount) updateData.target_amount = updatedData.targetAmount;
      if (updatedData.targetDate) updateData.target_date = updatedData.targetDate;
      if (updatedData.category) updateData.category = updatedData.category;

      const { error } = await supabase
        .from("savings_goals")
        .update(updateData)
        .eq("id", goalId);

      if (error) throw error;

      toast.success("Goal updated successfully! ✏️");
      setEditingGoal(null);
      loadGoals();
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error("Failed to update goal");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 min-h-screen">
      {/* Header Section with Neuomorphic Design */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="relative inline-block">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-3xl blur-2xl opacity-20"
            animate={{ scale: [1, 1.1] }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
          <div className="relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl px-8 py-4 rounded-3xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155]">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              💰 Savings Goals
            </h1>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Set and track your financial goals with intelligent neuomorphic design
        </p>
      </motion.div>

      {/* Create Goal Button - Neuomorphic */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center"
      >
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-10 py-5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-500 border border-white/20 dark:border-slate-700/20"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ rotate: 180, scale: 1.2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155]"
                >
                  <Plus className="w-5 h-5 text-white" />
                </motion.div>
                <span className="font-bold text-lg text-slate-700 dark:text-slate-200">Create New Goal</span>
              </div>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                layoutId="button-glow"
              />
            </motion.button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border-0 shadow-[30px_30px_60px_#d1d9e6,-30px_-30px_60px_#ffffff] dark:shadow-[30px_30px_60px_#0f172a,-30px_-30px_60px_#334155] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                🎯 New Savings Goal
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-4">
              {/* Neuomorphic Input Fields */}
              <div className="space-y-3">
                <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Goal Title</Label>
                <Input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g., Emergency Fund"
                  className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] focus:shadow-[inset_10px_10px_20px_#d1d9e6,inset_-10px_-10px_20px_#ffffff] dark:focus:shadow-[inset_10px_10px_20px_#0f172a,inset_-10px_-10px_20px_#334155] transition-all duration-300 py-4 px-6 text-slate-700 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Target Amount (₦)</Label>
                  <Input
                    type="number"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                    placeholder="50000"
                    className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300 py-4 px-6"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Target Date</Label>
                  <Input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300 py-4 px-6"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={createGoal}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-500"
              >
                Create Goal
              </motion.button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Edit Goal Dialog */}
      <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
        <DialogContent className="max-w-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border-0 shadow-[30px_30px_60px_#d1d9e6,-30px_-30px_60px_#ffffff] dark:shadow-[30px_30px_60px_#0f172a,-30px_-30px_60px_#334155] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              ✏️ Edit Savings Goal
            </DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <div className="space-y-6 p-4">
              {/* Neuomorphic Input Fields */}
              <div className="space-y-3">
                <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Goal Title</Label>
                <Input
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  placeholder="e.g., Emergency Fund"
                  className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] focus:shadow-[inset_10px_10px_20px_#d1d9e6,inset_-10px_-10px_20px_#ffffff] dark:focus:shadow-[inset_10px_10px_20px_#0f172a,inset_-10px_-10px_20px_#334155] transition-all duration-300 py-4 px-6 text-slate-700 dark:text-slate-200"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Description</Label>
                <Textarea
                  value={editingGoal.description}
                  onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                  placeholder="Describe your goal..."
                  className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300 py-4 px-6 min-h-[100px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Target Amount (₦)</Label>
                  <Input
                    type="number"
                    value={editingGoal.targetAmount}
                    onChange={(e) => setEditingGoal({ ...editingGoal, targetAmount: Number(e.target.value) })}
                    placeholder="50000"
                    className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300 py-4 px-6"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Target Date</Label>
                  <Input
                    type="date"
                    value={editingGoal.targetDate}
                    onChange={(e) => setEditingGoal({ ...editingGoal, targetDate: e.target.value })}
                    className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300 py-4 px-6"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Category</Label>
                <Select value={editingGoal.category} onValueChange={(value) => setEditingGoal({ ...editingGoal, category: value })}>
                  <SelectTrigger className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300 py-4 px-6">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <category.icon className="w-4 h-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditingGoal(null)}
                  className="flex-1 py-4 bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-bold text-lg rounded-2xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-500"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => editGoal(editingGoal.id, editingGoal)}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-500"
                >
                  Update Goal
                </motion.button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Amount Dialog */}
      <Dialog open={!!addingToGoal} onOpenChange={() => setAddingToGoal(null)}>
        <DialogContent className="max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border-0 shadow-[30px_30px_60px_#d1d9e6,-30px_-30px_60px_#ffffff] dark:shadow-[30px_30px_60px_#0f172a,-30px_-30px_60px_#334155] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">
              💰 Add to Goal
            </DialogTitle>
          </DialogHeader>
          {addingToGoal && (
            <div className="space-y-6 p-4">
              <div className="text-center">
                <div className="text-4xl mb-2">{addingToGoal.emoji}</div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">{addingToGoal.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Current: ₦{addingToGoal.currentAmount.toLocaleString()} / ₦{addingToGoal.targetAmount.toLocaleString()}
                </p>
                <div className="w-full bg-slate-200/60 dark:bg-slate-700/60 rounded-full h-2 mt-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((addingToGoal.currentAmount / addingToGoal.targetAmount) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Amount to Add (₦)</Label>
                <Input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] focus:shadow-[inset_10px_10px_20px_#d1d9e6,inset_-10px_-10px_20px_#ffffff] dark:focus:shadow-[inset_10px_10px_20px_#0f172a,inset_-10px_-10px_20px_#334155] transition-all duration-300 py-4 px-6 text-slate-700 dark:text-slate-200 text-center text-lg"
                />
                
                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {[1000, 5000, 10000, 25000, 50000].map((amount) => (
                    <motion.button
                      key={amount}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAddAmount(amount.toString())}
                      className="px-3 py-2 bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 rounded-xl shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#334155] hover:shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:hover:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] transition-all duration-300 text-sm font-medium"
                    >
                      ₦{amount.toLocaleString()}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAddingToGoal(null)}
                  className="flex-1 py-4 bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-bold text-lg rounded-2xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-500"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const amount = Number(addAmount);
                    if (amount > 0) {
                      updateGoalProgress(addingToGoal.id, amount);
                      setAddingToGoal(null);
                      setAddAmount("");
                    } else {
                      toast.error("Please enter a valid amount");
                    }
                  }}
                  className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-2xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-500"
                >
                  Add Amount
                </motion.button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Goals Grid - Neuomorphic Cards */}
      <AnimatePresence>
        {goals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="relative inline-block mb-8">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-3xl opacity-20"
                animate={{ scale: [1, 1.3], rotate: [0, 360] }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity, 
                  ease: "easeInOut"
                }}
              />
              <div className="relative text-9xl filter drop-shadow-2xl">🎯</div>
            </div>
            <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl p-8 rounded-3xl shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] max-w-md mx-auto">
              <h3 className="text-3xl font-bold text-slate-700 dark:text-slate-300 mb-4">No Goals Yet</h3>
              <p className="text-slate-500 dark:text-slate-400 text-lg">Create your first savings goal to get started!</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {goals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative"
              >
                {/* Glow Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"
                  animate={{ scale: [1, 1.05] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                />
                
                {/* Main Card */}
                <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl p-4 sm:p-6 lg:p-8 shadow-[25px_25px_50px_#d1d9e6,-25px_-25px_50px_#ffffff] dark:shadow-[25px_25px_50px_#0f172a,-25px_-25px_50px_#334155] hover:shadow-[30px_30px_60px_#d1d9e6,-30px_-30px_60px_#ffffff] dark:hover:shadow-[30px_30px_60px_#0f172a,-30px_-30px_60px_#334155] transition-all duration-700 border border-white/30 dark:border-slate-700/30">
                  
                  {/* Goal Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 15 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center text-2xl sm:text-3xl shadow-[12px_12px_24px_#d1d9e6,-12px_-12px_24px_#ffffff] dark:shadow-[12px_12px_24px_#0f172a,-12px_-12px_24px_#334155] flex-shrink-0"
                      >
                        {goal.emoji}
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg sm:text-xl mb-1 truncate">{goal.title}</h3>
                        <Badge className="bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 border-0 shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#334155] text-xs">
                          {goalCategories.find(c => c.value === goal.category)?.label || 'Other'}
                        </Badge>
                      </div>
                    </div>
                    
                    {goal.isCompleted && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                        className="bg-gradient-to-r from-green-400 to-emerald-600 p-3 rounded-2xl shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] dark:shadow-[10px_10px_20px_#0f172a,-10px_-10px_20px_#334155]"
                      >
                        <Trophy className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-medium text-sm sm:text-base">Progress</span>
                      <span className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300">
                        {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                      </span>
                    </div>
                    
                    {/* Neuomorphic Progress Bar */}
                    <div className="relative">
                      <div className="h-4 bg-slate-200/60 dark:bg-slate-700/60 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#334155] relative overflow-hidden"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                        </motion.div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-slate-100/40 dark:bg-slate-700/40 rounded-2xl shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] dark:shadow-[inset_6px_6px_12px_#0f172a,inset_-6px_-6px_12px_#334155]">
                        <div className="text-sm sm:text-lg lg:text-xl font-bold text-blue-600 dark:text-blue-400 truncate">
                          ₦{goal.currentAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Current</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-slate-100/40 dark:bg-slate-700/40 rounded-2xl shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] dark:shadow-[inset_6px_6px_12px_#0f172a,inset_-6px_-6px_12px_#334155]">
                        <div className="text-sm sm:text-lg lg:text-xl font-bold text-purple-600 dark:text-purple-400 truncate">
                          ₦{goal.targetAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Target</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setAddingToGoal(goal);
                        setAddAmount("");
                      }}
                      className="flex-1 py-2 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-green-400 to-emerald-600 text-white font-bold rounded-2xl shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] dark:shadow-[10px_10px_20px_#0f172a,-10px_-10px_20px_#334155] hover:shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:hover:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <DollarSign className="w-4 h-4" />
                      Add
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditingGoal(goal)}
                      className="p-2 sm:p-3 bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 rounded-2xl shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] dark:shadow-[10px_10px_20px_#0f172a,-10px_-10px_20px_#334155] hover:shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:hover:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] transition-all duration-300 flex items-center justify-center"
                    >
                      <Edit3 className="w-4 h-4" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this goal?")) {
                          deleteGoal(goal.id);
                        }
                      }}
                      className="p-2 sm:p-3 bg-red-100/60 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-2xl shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] dark:shadow-[10px_10px_20px_#0f172a,-10px_-10px_20px_#334155] hover:shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:hover:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] transition-all duration-300 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
