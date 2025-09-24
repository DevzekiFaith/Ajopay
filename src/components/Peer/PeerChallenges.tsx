"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Trophy, Plus, Send, Heart, MessageCircle, Share2, Crown, Target, Calendar, UserPlus, DollarSign, Flame, Award } from "lucide-react";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface Friend {
  id: string;
  name: string;
  full_name: string;
  email: string;
  avatar: string;
  level: number;
  totalSaved: number;
  streakDays: number;
  isOnline: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'savings' | 'streak' | 'goal';
  target: number;
  duration: number; // days
  participants: string[];
  createdBy: string;
  createdAt: string;
  endDate: string;
  prize: string;
  isActive: boolean;
  progress: Record<string, number>;
}

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  type: 'achievement' | 'milestone' | 'challenge' | 'general';
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  achievement?: {
    title: string;
    icon: string;
    amount?: number;
  };
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

const supabase = getSupabaseBrowserClient();

export function PeerChallenges() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState('challenges');
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeTarget, setNewChallengeTarget] = useState('');
  const [newChallengeDuration, setNewChallengeDuration] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const { isConnected, lastUpdate, triggerUpdate } = useRealtimeUpdates(currentUserId || undefined);

  // Load user data and peer challenges
  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found");
        return;
      }
      
      setCurrentUserId(user.id);
      console.log("Loading challenges for user:", user.id);

      // Load peer challenges from database
      const { data: challengesData, error: challengesError } = await supabase
        .from("peer_challenges")
        .select("*")
        .order("created_at", { ascending: false });

      if (challengesError) {
        console.error("Error loading challenges:", challengesError);
        return;
      }

      console.log("Raw challenges data:", challengesData);

      if (challengesData) {
        // Filter challenges to only show those the user created or is participating in
        const userChallenges = challengesData.filter(challenge => 
          challenge.created_by === user.id || 
          (challenge.participants && challenge.participants.includes(user.id))
        );
        
        console.log("Filtered challenges for user:", userChallenges);
        
        const formattedChallenges = userChallenges.map(challenge => ({
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          type: challenge.type,
          target: challenge.target,
          duration: challenge.duration,
          participants: challenge.participants || [],
          createdBy: challenge.created_by,
          createdAt: challenge.created_at,
          endDate: challenge.end_date,
          prize: challenge.prize || '',
          isActive: new Date(challenge.end_date) > new Date(),
          progress: challenge.progress || {}
        }));
        console.log("Formatted challenges:", formattedChallenges);
        setChallenges(formattedChallenges);
      } else {
        console.log("No challenges data received");
        setChallenges([]);
      }

      // Load friends/connections
      const { data: friendsData } = await supabase
        .from("user_connections")
        .select(`
          friend_id,
          profiles:friend_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "accepted");

      if (friendsData) {
        const formattedFriends = friendsData
          .filter(connection => connection.profiles) // Filter out null profiles
          .map(connection => {
            const profile = Array.isArray(connection.profiles) 
              ? connection.profiles[0] 
              : connection.profiles;
            
            return {
              id: connection.friend_id,
              name: profile?.full_name || 'Unknown User',
              full_name: profile?.full_name || 'Unknown User',
              email: profile?.email || '',
              avatar: profile?.avatar_url || '',
              level: 1, // Default values - could be enhanced with actual stats
              totalSaved: 0,
              streakDays: 0,
              isOnline: false
            };
          });
        setFriends(formattedFriends);
      }

      // Load activity feed/posts
      const { data: postsData } = await supabase
        .from("peer_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (postsData) {
        const formattedPosts = postsData.map(post => ({
          id: post.id,
          userId: post.user_id,
          userName: post.user_name || 'Unknown User',
          userAvatar: post.user_avatar || '',
          content: post.content,
          type: post.type,
          timestamp: post.created_at,
          likes: post.likes || 0,
          comments: post.comments || 0,
          isLiked: false, // Would need to check user's likes
          achievement: post.achievement ? JSON.parse(post.achievement) : undefined
        }));
        setPosts(formattedPosts);
      }

    } catch (error) {
      console.error("Error loading peer challenges data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reload data when real-time updates occur
  useEffect(() => {
    if (lastUpdate) {
      loadData();
    }
  }, [lastUpdate]);

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateChallenge = () => {
    if (!newChallengeTitle || !newChallengeTarget || !newChallengeDuration) {
      toast.error("Please fill in all fields");
      return;
    }

    const challengeData = {
      title: newChallengeTitle,
      description: `Save ₦${newChallengeTarget} in ${newChallengeDuration} days`,
      type: 'savings',
      target: parseFloat(newChallengeTarget),
      duration: parseInt(newChallengeDuration),
      participants: [],
      prize: ''
    };

    createChallenge(challengeData);
    
    // Reset form
    setNewChallengeTitle('');
    setNewChallengeTarget('');
    setNewChallengeDuration('');
  };

  const createChallenge = async (challengeData: any) => {
    if (!currentUserId) return;

    try {
      const newChallenge = {
        title: challengeData.title,
        description: challengeData.description,
        type: challengeData.type,
        target: challengeData.target,
        duration: challengeData.duration,
        participants: [currentUserId, ...challengeData.participants],
        created_by: currentUserId,
        end_date: new Date(Date.now() + challengeData.duration * 24 * 60 * 60 * 1000).toISOString(),
        prize: challengeData.prize || '',
        progress: {},
        status: 'active'
      };

      const { data, error } = await supabase
        .from("peer_challenges")
        .insert(newChallenge)
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      // Trigger real-time update for challenge creation
      triggerUpdate('challenge_created', {
        challengeTitle: challengeData.title,
        participants: challengeData.participants
      });

      toast.success("Challenge created successfully! 🎯", {
        description: "Your friends have been notified"
      });

      setShowCreateChallenge(false);
      loadData();
    } catch (error) {
      console.error("Error creating challenge:", error);
      toast.error("Failed to create challenge");
    }
  };

  const joinChallenge = async (challengeId: string) => {
    if (!currentUserId) return;

    try {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return;

      const updatedParticipants = [...challenge.participants, currentUserId];

      const { error } = await supabase
        .from("peer_challenges")
        .update({ participants: updatedParticipants })
        .eq("id", challengeId);

      if (error) throw error;

      // Trigger real-time update for challenge join
      triggerUpdate('challenge_joined', {
        challengeTitle: challenge.title,
        challengeId
      });

      toast.success("Joined challenge! 🚀", {
        description: "Good luck achieving your goal!"
      });

      loadData();
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast.error("Failed to join challenge");
    }
  };

  const updateChallengeProgress = async (challengeId: string, progress: number) => {
    if (!currentUserId) return;

    try {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return;

      const updatedProgress = {
        ...challenge.progress,
        [currentUserId]: progress
      };

      const { error } = await supabase
        .from("peer_challenges")
        .update({ progress: updatedProgress })
        .eq("id", challengeId);

      if (error) throw error;

      // Check if challenge is completed
      if (progress >= challenge.target) {
        triggerUpdate('challenge_completed', {
          challengeTitle: challenge.title,
          challengeId
        });
      }

      toast.success("Progress updated! 📈");
      loadData();
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    }
  };

  const createPost = async () => {
    if (!newPost.trim() || !currentUserId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const postData = {
        user_id: currentUserId,
        user_name: user.user_metadata?.full_name || 'Unknown User',
        user_avatar: user.user_metadata?.avatar_url || '',
        content: newPost.trim(),
        type: 'general',
        created_at: new Date().toISOString(),
        likes: 0,
        comments: 0
      };

      const { error } = await supabase
        .from("peer_activity")
        .insert(postData);

      if (error) throw error;

      toast.success("Post shared! 📝");
      setNewPost('');
      loadData(); // Reload to show the new post
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to share post");
    }
  };

  const likePost = async (postId: string) => {
    if (!currentUserId) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Toggle like status
      const newLikeCount = post.isLiked ? post.likes - 1 : post.likes + 1;
      const newIsLiked = !post.isLiked;

      // Update in database
      const { error } = await supabase
        .from("peer_activity")
        .update({ likes: newLikeCount })
        .eq("id", postId);

      if (error) throw error;

      // Update local state
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, likes: newLikeCount, isLiked: newIsLiked }
          : p
      ));

      toast.success(newIsLiked ? "Post liked! ❤️" : "Like removed");
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
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
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900 dark:to-pink-900 min-h-screen">
      {/* Header Section with Neuomorphic Design */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
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
          <div className="relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl px-8 py-4 rounded-3xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155]">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🏆 Peer Challenges
            </h1>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Challenge friends and compete in savings goals with neuomorphic design
        </p>
      </motion.div>

      {/* Tab Navigation - Neuomorphic */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center"
      >
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-2 rounded-3xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] border border-white/20 dark:border-slate-700/20">
          <div className="flex gap-2">
            {['challenges', 'friends', 'feed'].map((tab) => (
              <motion.button
                key={tab}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-700/40'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content based on active tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'challenges' && (
          <motion.div
            key="challenges"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Create Challenge Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center"
            >
              <Dialog open={showCreateChallenge} onOpenChange={setShowCreateChallenge}>
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
                        className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155]"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </motion.div>
                      <span className="font-bold text-lg text-slate-700 dark:text-slate-200">Create Challenge</span>
                    </div>
                  </motion.button>
                </DialogTrigger>
                <DialogContent className="max-w-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border-0 shadow-[30px_30px_60px_#d1d9e6,-30px_-30px_60px_#ffffff] dark:shadow-[30px_30px_60px_#0f172a,-30px_-30px_60px_#334155] rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                      🏆 New Challenge
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 p-4">
                    <div className="space-y-3">
                      <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Challenge Title</Label>
                      <Input
                        value={newChallengeTitle}
                        onChange={(e) => setNewChallengeTitle(e.target.value)}
                        placeholder="e.g., 30-Day Savings Sprint"
                        className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300 py-4 px-6"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Target (₦)</Label>
                        <Input
                          type="number"
                          value={newChallengeTarget}
                          onChange={(e) => setNewChallengeTarget(e.target.value)}
                          placeholder="10000"
                          className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300 py-4 px-6"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Duration (Days)</Label>
                        <Input
                          type="number"
                          value={newChallengeDuration}
                          onChange={(e) => setNewChallengeDuration(e.target.value)}
                          placeholder="30"
                          className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] transition-all duration-300 py-4 px-6"
                        />
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreateChallenge}
                      className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-lg rounded-2xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-500"
                    >
                      Create Challenge
                    </motion.button>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>

            {/* Challenges Grid */}
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="relative inline-block mb-8">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-600 rounded-full blur-3xl opacity-20"
                    animate={{ scale: [1, 1.3], rotate: [0, 360] }}
                    transition={{ 
                      duration: 6, 
                      repeat: Infinity, 
                      ease: "easeInOut"
                    }}
                  />
                  <div className="relative w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center text-4xl shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155]">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      ⏳
                    </motion.div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-4">
                  Loading Challenges...
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Fetching your peer challenges and activity
                </p>
              </motion.div>
            ) : challenges.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="relative inline-block mb-8">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-600 rounded-full blur-3xl opacity-20"
                    animate={{ scale: [1, 1.3], rotate: [0, 360] }}
                    transition={{ 
                      duration: 6, 
                      repeat: Infinity, 
                      ease: "easeInOut"
                    }}
                  />
                  <div className="relative w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center text-4xl shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155]">
                    🏆
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-4">
                  No Challenges Yet
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                  Be the first to create a savings challenge and invite your friends to join!
                </p>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateChallenge(true)}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-2xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-300"
                >
                  Create Your First Challenge
                </motion.button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {challenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-600/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"
                    animate={{ scale: [1, 1.05] }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                  />
                  
                  <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl p-8 shadow-[25px_25px_50px_#d1d9e6,-25px_-25px_50px_#ffffff] dark:shadow-[25px_25px_50px_#0f172a,-25px_-25px_50px_#334155] hover:shadow-[30px_30px_60px_#d1d9e6,-30px_-30px_60px_#ffffff] dark:hover:shadow-[30px_30px_60px_#0f172a,-30px_-30px_60px_#334155] transition-all duration-700 border border-white/30 dark:border-slate-700/30">
                    
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 15 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center text-3xl shadow-[12px_12px_24px_#d1d9e6,-12px_-12px_24px_#ffffff] dark:shadow-[12px_12px_24px_#0f172a,-12px_-12px_24px_#334155]"
                        >
                          🏆
                        </motion.div>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xl mb-1">{challenge.title}</h3>
                          <Badge className="bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 border-0 shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#334155]">
                            {challenge.participants?.length || 0} participants
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 mb-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-slate-100/40 dark:bg-slate-700/40 rounded-2xl shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] dark:shadow-[inset_6px_6px_12px_#0f172a,inset_-6px_-6px_12px_#334155]">
                          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                            ₦{challenge.target?.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Target</div>
                        </div>
                        <div className="text-center p-4 bg-slate-100/40 dark:bg-slate-700/40 rounded-2xl shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] dark:shadow-[inset_6px_6px_12px_#0f172a,inset_-6px_-6px_12px_#334155]">
                          <div className="text-xl font-bold text-pink-600 dark:text-pink-400">
                            {challenge.duration} days
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Duration</div>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => joinChallenge(challenge.id)}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-2xl shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] dark:shadow-[10px_10px_20px_#0f172a,-10px_-10px_20px_#334155] hover:shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:hover:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] transition-all duration-300"
                    >
                      Join Challenge
                    </motion.button>
                  </div>
                </motion.div>
              ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'friends' && (
          <motion.div
            key="friends"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {friends.map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl p-6 shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] hover:shadow-[25px_25px_50px_#d1d9e6,-25px_-25px_50px_#ffffff] dark:hover:shadow-[25px_25px_50px_#0f172a,-25px_-25px_50px_#334155] transition-all duration-500 border border-white/30 dark:border-slate-700/30"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155]">
                      {friend.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">{friend.full_name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{friend.email}</p>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-xl shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] hover:shadow-[12px_12px_24px_#d1d9e6,-12px_-12px_24px_#ffffff] dark:hover:shadow-[12px_12px_24px_#0f172a,-12px_-12px_24px_#334155] transition-all duration-300"
                  >
                    Challenge Friend
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'feed' && (
          <motion.div
            key="feed"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="space-y-6">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl p-8 shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] border border-white/30 dark:border-slate-700/30"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155]">
                      {post.userName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{post.userName}</h4>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(post.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mb-4">{post.content}</p>
                      
                      <div className="flex items-center gap-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => likePost(post.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-100/60 dark:bg-slate-700/60 rounded-2xl shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#334155] hover:shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:hover:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] transition-all duration-300"
                        >
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{post.likes}</span>
                        </motion.button>
                        
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100/60 dark:bg-slate-700/60 rounded-2xl shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#0f172a,inset_-4px_-4px_8px_#334155]">
                          <MessageCircle className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{post.comments}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const getProgressPercentage = (progress: number, target: number) => {
  return Math.min((progress / target) * 100, 100);
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
};
