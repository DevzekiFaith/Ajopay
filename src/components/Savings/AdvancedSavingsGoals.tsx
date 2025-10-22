"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Target, 
  Plus, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Brain,
  Lightbulb,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  PiggyBank,
  Zap,
  Crown,
  Star
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { FinancialAdvisor } from "@/components/AI/FinancialAdvisor";

interface SavingsGoal {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'emergency' | 'vacation' | 'education' | 'business' | 'house' | 'car' | 'wedding' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  autoSave: boolean;
  autoSaveAmount: number;
  autoSaveFrequency: 'daily' | 'weekly' | 'monthly';
  createdAt: string;
  completedAt?: string;
  milestones: Milestone[];
  aiInsights: AIInsight[];
}

interface Milestone {
  id: string;
  name: string;
  targetAmount: number;
  achieved: boolean;
  achievedAt?: string;
  reward?: string;
}

interface AIInsight {
  id: string;
  type: 'suggestion' | 'warning' | 'achievement' | 'opportunity';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  impact: number;
}

const goalCategories = [
  { value: 'emergency', label: 'Emergency Fund', icon: '🚨', description: 'Financial safety net' },
  { value: 'vacation', label: 'Vacation', icon: '✈️', description: 'Travel and leisure' },
  { value: 'education', label: 'Education', icon: '🎓', description: 'School fees and training' },
  { value: 'business', label: 'Business', icon: '💼', description: 'Startup capital' },
  { value: 'house', label: 'House', icon: '🏠', description: 'Home purchase' },
  { value: 'car', label: 'Car', icon: '🚗', description: 'Vehicle purchase' },
  { value: 'wedding', label: 'Wedding', icon: '💒', description: 'Wedding expenses' },
  { value: 'other', label: 'Other', icon: '🎯', description: 'Custom goal' }
];

const priorityColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
};

const statusColors = {
  active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
};

export function AdvancedSavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const supabase = getSupabaseBrowserClient();

  // Form state for creating new goals
  const [newGoal, setNewGoal] = useState({
    name: '',
    description: '',
    targetAmount: '',
    targetDate: '',
    category: 'other' as const,
    priority: 'medium' as const,
    autoSave: false,
    autoSaveAmount: '',
    autoSaveFrequency: 'monthly' as const
  });

  // Load goals from database
  const loadGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // For now, use mock data - replace with actual database query
      const mockGoals: SavingsGoal[] = [
        {
          id: '1',
          name: 'Emergency Fund',
          description: '6 months of expenses for financial security',
          targetAmount: 500000, // ₦5,000
          currentAmount: 150000, // ₦1,500
          targetDate: '2024-12-31',
          category: 'emergency',
          priority: 'high',
          status: 'active',
          autoSave: true,
          autoSaveAmount: 25000, // ₦250
          autoSaveFrequency: 'monthly',
          createdAt: '2024-01-01',
          milestones: [
            { id: '1', name: '25% Complete', targetAmount: 125000, achieved: true, achievedAt: '2024-02-15' },
            { id: '2', name: '50% Complete', targetAmount: 250000, achieved: false },
            { id: '3', name: '75% Complete', targetAmount: 375000, achieved: false },
            { id: '4', name: '100% Complete', targetAmount: 500000, achieved: false }
          ],
          aiInsights: [
            {
              id: '1',
              type: 'suggestion',
              title: 'Increase Auto-Save',
              description: 'Consider increasing your monthly auto-save to ₦500 to reach your goal 2 months earlier.',
              action: 'Update auto-save amount',
              priority: 'medium',
              impact: 7
            }
          ]
        },
        {
          id: '2',
          name: 'Vacation to Dubai',
          description: 'Dream vacation with family',
          targetAmount: 2000000, // ₦20,000
          currentAmount: 800000, // ₦8,000
          targetDate: '2024-08-15',
          category: 'vacation',
          priority: 'medium',
          status: 'active',
          autoSave: true,
          autoSaveAmount: 100000, // ₦1,000
          autoSaveFrequency: 'monthly',
          createdAt: '2024-01-15',
          milestones: [
            { id: '1', name: 'Flight Tickets', targetAmount: 600000, achieved: true, achievedAt: '2024-03-01' },
            { id: '2', name: 'Hotel Booking', targetAmount: 1200000, achieved: false },
            { id: '3', name: 'Spending Money', targetAmount: 2000000, achieved: false }
          ],
          aiInsights: [
            {
              id: '1',
              type: 'achievement',
              title: 'Great Progress!',
              description: 'You\'ve saved 40% of your vacation fund. Keep up the excellent work!',
              priority: 'low',
              impact: 8
            }
          ]
        }
      ];

      setGoals(mockGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
      toast.error('Failed to load savings goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const createGoal = async () => {
    try {
      if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) {
        toast.error('Please fill in all required fields');
        return;
      }

      const goal: SavingsGoal = {
        id: Date.now().toString(),
        name: newGoal.name,
        description: newGoal.description,
        targetAmount: parseFloat(newGoal.targetAmount) * 100, // Convert to kobo
        currentAmount: 0,
        targetDate: newGoal.targetDate,
        category: newGoal.category,
        priority: newGoal.priority,
        status: 'active',
        autoSave: newGoal.autoSave,
        autoSaveAmount: newGoal.autoSave ? parseFloat(newGoal.autoSaveAmount) * 100 : 0,
        autoSaveFrequency: newGoal.autoSaveFrequency,
        createdAt: new Date().toISOString(),
        milestones: generateMilestones(parseFloat(newGoal.targetAmount) * 100),
        aiInsights: []
      };

      setGoals(prev => [goal, ...prev]);
      setShowCreateDialog(false);
      setNewGoal({
        name: '',
        description: '',
        targetAmount: '',
        targetDate: '',
        category: 'other',
        priority: 'medium',
        autoSave: false,
        autoSaveAmount: '',
        autoSaveFrequency: 'monthly'
      });

      toast.success('Savings goal created successfully!');
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create savings goal');
    }
  };

  const generateMilestones = (targetAmount: number): Milestone[] => {
    return [
      { id: '1', name: '25% Complete', targetAmount: targetAmount * 0.25, achieved: false },
      { id: '2', name: '50% Complete', targetAmount: targetAmount * 0.5, achieved: false },
      { id: '3', name: '75% Complete', targetAmount: targetAmount * 0.75, achieved: false },
      { id: '4', name: '100% Complete', targetAmount: targetAmount, achieved: false }
    ];
  };

  const addToGoal = async (goalId: string, amount: number) => {
    try {
      setGoals(prev => prev.map(goal => {
        if (goal.id === goalId) {
          const newAmount = goal.currentAmount + amount;
          const updatedMilestones = goal.milestones.map(milestone => {
            if (!milestone.achieved && newAmount >= milestone.targetAmount) {
              return { ...milestone, achieved: true, achievedAt: new Date().toISOString() };
            }
            return milestone;
          });

          const isCompleted = newAmount >= goal.targetAmount;
          
          return {
            ...goal,
            currentAmount: newAmount,
            status: isCompleted ? 'completed' : goal.status,
            completedAt: isCompleted ? new Date().toISOString() : goal.completedAt,
            milestones: updatedMilestones
          };
        }
        return goal;
      }));

      toast.success(`Added ₦${(amount / 100).toLocaleString()} to ${goals.find(g => g.id === goalId)?.name}`);
    } catch (error) {
      console.error('Error adding to goal:', error);
      toast.error('Failed to add amount to goal');
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return goal.status === 'active';
    if (activeTab === 'completed') return goal.status === 'completed';
    return goal.category === activeTab;
  });

  const getProgressPercentage = (goal: SavingsGoal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCategoryIcon = (category: string) => {
    const cat = goalCategories.find(c => c.value === category);
    return cat?.icon || '🎯';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Savings Goals</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Set and track your financial objectives</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Goal</span>
              <span className="sm:hidden">Create</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle>Create New Savings Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Goal Name *</Label>
                <Input
                  id="name"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Emergency Fund"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your goal..."
                />
              </div>
              <div>
                <Label htmlFor="targetAmount">Target Amount (₦) *</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                  placeholder="5000"
                />
              </div>
              <div>
                <Label htmlFor="targetDate">Target Date *</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newGoal.category} onValueChange={(value: any) => setNewGoal(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {goalCategories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newGoal.priority} onValueChange={(value: any) => setNewGoal(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoSave"
                  checked={newGoal.autoSave}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, autoSave: e.target.checked }))}
                />
                <Label htmlFor="autoSave">Enable Auto-Save</Label>
              </div>
              {newGoal.autoSave && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="autoSaveAmount">Amount (₦)</Label>
                    <Input
                      id="autoSaveAmount"
                      type="number"
                      value={newGoal.autoSaveAmount}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, autoSaveAmount: e.target.value }))}
                      placeholder="250"
                    />
                  </div>
                  <div>
                    <Label htmlFor="autoSaveFrequency">Frequency</Label>
                    <Select value={newGoal.autoSaveFrequency} onValueChange={(value: any) => setNewGoal(prev => ({ ...prev, autoSaveFrequency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <Button onClick={createGoal} className="w-full">
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 gap-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
          <TabsTrigger value="active" className="text-xs sm:text-sm">Active</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">Done</TabsTrigger>
          <TabsTrigger value="emergency" className="text-xs sm:text-sm hidden sm:block">Emergency</TabsTrigger>
          <TabsTrigger value="vacation" className="text-xs sm:text-sm hidden sm:block">Vacation</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredGoals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No goals found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {activeTab === 'all' 
                    ? 'Create your first savings goal to get started'
                    : `No ${activeTab} goals found`
                  }
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredGoals.map((goal) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="text-xl sm:text-2xl">{getCategoryIcon(goal.category)}</div>
                          <div className="flex-1">
                            <CardTitle className="text-base sm:text-lg">{goal.name}</CardTitle>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              {goal.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={`${priorityColors[goal.priority]} text-xs`}>
                            {goal.priority}
                          </Badge>
                          <Badge className={`${statusColors[goal.status]} text-xs`}>
                            {goal.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{getProgressPercentage(goal).toFixed(1)}%</span>
                        </div>
                        <Progress value={getProgressPercentage(goal)} className="h-2" />
                        <div className="flex justify-between text-sm mt-2">
                          <span>₦{(goal.currentAmount / 100).toLocaleString()}</span>
                          <span>₦{(goal.targetAmount / 100).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Milestones */}
                      <div>
                        <h4 className="font-medium mb-2">Milestones</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {goal.milestones.map((milestone) => (
                            <div
                              key={milestone.id}
                              className={`flex items-center gap-2 p-2 rounded-lg ${
                                milestone.achieved 
                                  ? 'bg-green-100 dark:bg-green-900/20' 
                                  : 'bg-gray-100 dark:bg-gray-800'
                              }`}
                            >
                              {milestone.achieved ? (
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                              )}
                              <span className="text-xs sm:text-sm truncate">
                                {milestone.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Insights */}
                      {goal.aiInsights.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            AI Insights
                          </h4>
                          <div className="space-y-2">
                            {goal.aiInsights.map((insight) => (
                              <div
                                key={insight.id}
                                className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                              >
                                <div className="flex items-start gap-2">
                                  <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-sm">{insight.title}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {insight.description}
                                    </p>
                                    {insight.action && (
                                      <Button size="sm" variant="outline" className="mt-2">
                                        {insight.action}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="sm"
                          onClick={() => addToGoal(goal.id, 25000)} // ₦250
                          disabled={goal.status === 'completed'}
                          className="w-full sm:w-auto"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="text-xs sm:text-sm">Add ₦250</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedGoal(goal)}
                          className="w-full sm:w-auto"
                        >
                          <span className="text-xs sm:text-sm">View Details</span>
                        </Button>
                      </div>

                      {/* Goal Info */}
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                        <span>
                          {getDaysRemaining(goal.targetDate) > 0 
                            ? `${getDaysRemaining(goal.targetDate)} days left`
                            : 'Overdue'
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* AI Financial Advisor */}
      <FinancialAdvisor
        userBalance={goals.reduce((sum, goal) => sum + goal.currentAmount, 0)}
        savingsGoals={goals}
        onActionClick={(action) => {
          if (action === 'Set up automatic savings') {
            setShowCreateDialog(true);
          }
        }}
      />
    </div>
  );
}
