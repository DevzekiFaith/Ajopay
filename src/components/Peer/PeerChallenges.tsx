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
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState('challenges');
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showShareAchievement, setShowShareAchievement] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [newPost, setNewPost] = useState('');
  const [achievementTitle, setAchievementTitle] = useState('');
  const [achievementDescription, setAchievementDescription] = useState('');
  const [achievementAmount, setAchievementAmount] = useState('');
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

    // Load friends/connections (both sent and received)
    const { data: friendsData } = await supabase
      .from("user_connections")
      .select(`
        id,
        user_id,
        friend_id,
        status,
        user_profile:user_id (
          id,
          full_name,
          email,
          avatar_url
        ),
        friend_profile:friend_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq("status", "accepted");

    console.log("Raw friends data:", friendsData);
    if (friendsData) {
      const formattedFriends = friendsData
        .map(connection => {
          // Determine which profile to use based on who is the current user
          const isCurrentUserSender = connection.user_id === user.id;
          const friendProfileRaw = isCurrentUserSender ? connection.friend_profile : connection.user_profile;
          const friendId = isCurrentUserSender ? connection.friend_id : connection.user_id;

          // Handle profile data (might be array or object)
          const friendProfile = Array.isArray(friendProfileRaw) ? friendProfileRaw[0] : friendProfileRaw;

          // Skip if no profile found
          if (!friendProfile || typeof friendProfile !== 'object') return null;

          return {
            id: friendId,
            name: (friendProfile as any).full_name || 'Unknown User',
            full_name: (friendProfile as any).full_name || 'Unknown User',
            email: (friendProfile as any).email || '',
            avatar: (friendProfile as any).avatar_url || '',
            level: 1, // Default values - could be enhanced with actual stats
            totalSaved: 0,
            streakDays: 0,
            isOnline: false
          };
        })
        .filter(friend => friend !== null); // Remove null entries
      
      console.log("Formatted friends:", formattedFriends);
      setFriends(formattedFriends);
    } else {
      console.log("No friends data received");
      setFriends([]);
    }

    // Load pending friend requests (received)
    const { data: pendingData } = await supabase
      .from("user_connections")
      .select(`
        id,
        user_id,
        friend_id,
        status,
        profiles:user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq("friend_id", user.id)
      .eq("status", "pending");

    if (pendingData) {
      const formattedPending = pendingData
        .filter(connection => connection.profiles)
        .map(connection => {
          const profile = Array.isArray(connection.profiles)
            ? connection.profiles[0]
            : connection.profiles;

          return {
            id: connection.id,
            userId: connection.user_id,
            userName: profile?.full_name || 'Unknown User',
            userEmail: profile?.email || '',
            userAvatar: profile?.avatar_url || '',
            status: connection.status
          };
        });
      setPendingRequests(formattedPending);
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

  // Set up real-time subscriptions for live updates
  useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to user_connections changes
    const connectionsSubscription = supabase
      .channel('user_connections_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_connections',
        filter: `or(user_id.eq.${currentUserId},friend_id.eq.${currentUserId})`
      }, (payload) => {
        console.log('Connection change:', payload);
        loadData(); // Reload data when connections change
      })
      .subscribe();

    // Subscribe to peer_challenges changes
    const challengesSubscription = supabase
      .channel('peer_challenges_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'peer_challenges'
      }, (payload) => {
        console.log('Challenge change:', payload);
        loadData(); // Reload data when challenges change
      })
      .subscribe();

    // Subscribe to peer_activity changes
    const activitySubscription = supabase
      .channel('peer_activity_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'peer_activity'
      }, (payload) => {
        console.log('New activity:', payload);
        loadData(); // Reload data when new activity is posted
      })
      .subscribe();

    return () => {
      connectionsSubscription.unsubscribe();
      challengesSubscription.unsubscribe();
      activitySubscription.unsubscribe();
    };
  }, [currentUserId]);

  useEffect(() => {
    loadData();
  }, []);

  // Add sample data for testing if no data exists
  const addSampleData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Add sample friends if none exist
      if (friends.length === 0) {
        const sampleFriends = [
          {
            id: 'sample-friend-1',
            name: 'John Doe',
            full_name: 'John Doe',
            email: 'john@example.com',
            avatar: '',
            level: 5,
            totalSaved: 50000,
            streakDays: 15,
            isOnline: true
          },
          {
            id: 'sample-friend-2',
            name: 'Jane Smith',
            full_name: 'Jane Smith',
            email: 'jane@example.com',
            avatar: '',
            level: 3,
            totalSaved: 25000,
            streakDays: 8,
            isOnline: false
          }
        ];
        setFriends(sampleFriends);
      }

      // Add sample posts if none exist
      if (posts.length === 0) {
        const samplePosts = [
          {
            id: 'sample-post-1',
            userId: 'sample-user-1',
            userName: 'John Doe',
            userAvatar: '',
            content: 'Just reached my savings goal of ₦50,000! 🎉',
            type: 'achievement' as const,
            timestamp: new Date().toISOString(),
            likes: 5,
            comments: 2,
            isLiked: false,
            achievement: {
              title: 'Savings Goal Reached',
              icon: '🎯',
              amount: 50000
            }
          },
          {
            id: 'sample-post-2',
            userId: 'sample-user-2',
            userName: 'Jane Smith',
            userAvatar: '',
            content: 'Completed the 30-day savings challenge! 💪',
            type: 'challenge' as const,
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            likes: 8,
            comments: 3,
            isLiked: true
          }
        ];
        setPosts(samplePosts);
      }
    } catch (error) {
      console.error('Error adding sample data:', error);
    }
  };

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

  const sendFriendRequest = async () => {
    if (!currentUserId || !friendEmail.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    console.log("Sending friend request to:", friendEmail.trim());
    console.log("Current user ID:", currentUserId);

    try {
      // First, find the user by email
      const { data: targetUser, error: userError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("email", friendEmail.trim())
        .single();

      console.log("Target user found:", targetUser);
      console.log("User error:", userError);

      if (userError || !targetUser) {
        toast.error("User not found with this email address");
        return;
      }

      if (targetUser.id === currentUserId) {
        toast.error("You cannot add yourself as a friend");
        return;
      }

      // Check if connection already exists
      const { data: existingConnection } = await supabase
        .from("user_connections")
        .select("*")
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${targetUser.id}),and(user_id.eq.${targetUser.id},friend_id.eq.${currentUserId})`)
        .single();

      if (existingConnection) {
        toast.error("Connection already exists with this user");
        return;
      }

      // Create friend request
      const { error } = await supabase
        .from("user_connections")
        .insert({
          user_id: currentUserId,
          friend_id: targetUser.id,
          status: "pending"
        });

      if (error) throw error;

      toast.success(`Friend request sent to ${targetUser.full_name || targetUser.email || 'user'}! 📤`);
      setFriendEmail("");
      setShowAddFriend(false);
      
      // Reload data to show the new connection
      console.log("Friend request sent, reloading data...");
      loadData();
      
      // Trigger real-time update
      triggerUpdate('challenge_created', {
        challengeTitle: `Friend request sent to ${targetUser.full_name || targetUser.email || 'user'}`,
        challengeId: targetUser.id
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

  const acceptFriendRequest = async (connectionId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from("user_connections")
        .update({ status: "accepted" })
        .eq("id", connectionId);

      if (error) throw error;

      toast.success("Friend request accepted! 🎉");
      
      // Reload data to show the new friend
      console.log("Friend request accepted, reloading data...");
      loadData();
      
      // Trigger real-time update
      triggerUpdate('challenge_completed', {
        challengeTitle: 'Friend request accepted',
        challengeId: connectionId
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const rejectFriendRequest = async (connectionId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from("user_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;

      toast.success("Friend request rejected");
      loadData();
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Failed to reject friend request");
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

  const shareAchievement = async () => {
    if (!currentUserId || !achievementTitle.trim() || !achievementDescription.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const achievementData = {
        user_id: currentUserId,
        user_name: user.user_metadata?.full_name || 'Unknown User',
        user_avatar: user.user_metadata?.avatar_url || '',
        content: `🏆 Achievement: ${achievementTitle}\n\n${achievementDescription}${achievementAmount ? `\n\n💰 Amount: ₦${Number(achievementAmount).toLocaleString()}` : ''}`,
        type: 'achievement',
        created_at: new Date().toISOString(),
        likes: 0,
        comments: 0,
        achievement: JSON.stringify({
          title: achievementTitle,
          description: achievementDescription,
          amount: achievementAmount ? Number(achievementAmount) : null,
          icon: '🏆'
        })
      };

      const { error } = await supabase
        .from("peer_activity")
        .insert(achievementData);

      if (error) throw error;

      toast.success("Achievement shared! 🎉", {
        description: "Your friends can now see your accomplishment!"
      });
      
      // Reset form
      setAchievementTitle("");
      setAchievementDescription("");
      setAchievementAmount("");
      setShowShareAchievement(false);
      
      // Trigger real-time update
      triggerUpdate('challenge_completed', {
        challengeTitle: `Achievement shared: ${achievementTitle}`,
        challengeId: currentUserId
      });
      
      loadData();
    } catch (error) {
      console.error("Error sharing achievement:", error);
      toast.error("Failed to share achievement");
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
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900 dark:to-pink-900 min-h-screen">
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
          <div className="relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-3xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155]">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🏆 Peer Challenges
            </h1>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-sm sm:text-base px-4">
          Challenge friends and compete in savings goals with neuomorphic design
        </p>
        
        {/* Live Updates Status */}
        <div className="flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isConnected ? 'Live updates active' : 'Connecting...'}
          </span>
        </div>
      </motion.div>

      {/* Tab Navigation - Neuomorphic */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center"
      >
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-1 sm:p-2 rounded-3xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] border border-white/20 dark:border-slate-700/20">
          <div className="flex gap-1 sm:gap-2">
            {['challenges', 'friends', 'feed'].map((tab) => (
              <motion.button
                key={tab}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab as any)}
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-sm ${
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
                    className="group relative px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-500 border border-white/20 dark:border-slate-700/20"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                      <motion.div
                        whileHover={{ rotate: 180, scale: 1.2 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155]"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                      </motion.div>
                      <span className="font-bold text-sm sm:text-base lg:text-lg text-slate-700 dark:text-slate-200">Create Challenge</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
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
                  
                  <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl p-4 sm:p-6 lg:p-8 shadow-[25px_25px_50px_#d1d9e6,-25px_-25px_50px_#ffffff] dark:shadow-[25px_25px_50px_#0f172a,-25px_-25px_50px_#334155] hover:shadow-[30px_30px_60px_#d1d9e6,-30px_-30px_60px_#ffffff] dark:hover:shadow-[30px_30px_60px_#0f172a,-30px_-30px_60px_#334155] transition-all duration-700 border border-white/30 dark:border-slate-700/30">
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 15 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center text-2xl sm:text-3xl shadow-[12px_12px_24px_#d1d9e6,-12px_-12px_24px_#ffffff] dark:shadow-[12px_12px_24px_#0f172a,-12px_-12px_24px_#334155] flex-shrink-0"
                        >
                          🏆
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg sm:text-xl mb-1 truncate">{challenge.title}</h3>
                          <Badge className="bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 border-0 shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#334155] text-xs">
                            {challenge.participants?.length || 0} participants
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="text-center p-3 sm:p-4 bg-slate-100/40 dark:bg-slate-700/40 rounded-2xl shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] dark:shadow-[inset_6px_6px_12px_#0f172a,inset_-6px_-6px_12px_#334155]">
                          <div className="text-sm sm:text-lg lg:text-xl font-bold text-purple-600 dark:text-purple-400 truncate">
                            ₦{challenge.target?.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Target</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-slate-100/40 dark:bg-slate-700/40 rounded-2xl shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] dark:shadow-[inset_6px_6px_12px_#0f172a,inset_-6px_-6px_12px_#334155]">
                          <div className="text-sm sm:text-lg lg:text-xl font-bold text-pink-600 dark:text-pink-400">
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
                      className="w-full py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-2xl shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] dark:shadow-[10px_10px_20px_#0f172a,-10px_-10px_20px_#334155] hover:shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:hover:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] transition-all duration-300 text-sm sm:text-base"
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
            {/* Pending Friend Requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Pending Friend Requests ({pendingRequests.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pendingRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-2xl p-4 shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] border border-white/30 dark:border-slate-700/30"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] flex-shrink-0">
                          {request.userName?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{request.userName}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{request.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => acceptFriendRequest(request.id)}
                          className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] hover:shadow-[12px_12px_24px_#d1d9e6,-12px_-12px_24px_#ffffff] dark:hover:shadow-[12px_12px_24px_#0f172a,-12px_-12px_24px_#334155] transition-all duration-300 text-xs"
                        >
                          Accept
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => rejectFriendRequest(request.id)}
                          className="flex-1 py-2 bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 font-medium rounded-xl shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] hover:shadow-[12px_12px_24px_#d1d9e6,-12px_-12px_24px_#ffffff] dark:hover:shadow-[12px_12px_24px_#0f172a,-12px_-12px_24px_#334155] transition-all duration-300 text-xs"
                        >
                          Reject
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Friends Yet</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Connect with friends to start challenging each other!</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddFriend(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-2xl shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] dark:shadow-[10px_10px_20px_#0f172a,-10px_-10px_20px_#334155] hover:shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:hover:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] transition-all duration-300"
                  >
                    Add Friends
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      console.log("Current friends state:", friends);
                      console.log("Current user ID:", currentUserId);
                      loadData();
                    }}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl text-sm"
                  >
                    Debug Friends
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addSampleData}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-2xl shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] dark:shadow-[10px_10px_20px_#0f172a,-10px_-10px_20px_#334155] hover:shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:hover:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] transition-all duration-300"
                  >
                    Load Sample Data
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {friends.map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl p-4 sm:p-6 shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] hover:shadow-[25px_25px_50px_#d1d9e6,-25px_-25px_50px_#ffffff] dark:hover:shadow-[25px_25px_50px_#0f172a,-25px_-25px_50px_#334155] transition-all duration-500 border border-white/30 dark:border-slate-700/30"
                >
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] flex-shrink-0">
                      {friend.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base truncate">{friend.full_name}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">{friend.email}</p>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-xl shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] hover:shadow-[12px_12px_24px_#d1d9e6,-12px_-12px_24px_#ffffff] dark:hover:shadow-[12px_12px_24px_#0f172a,-12px_-12px_24px_#334155] transition-all duration-300 text-xs sm:text-sm"
                  >
                    Challenge Friend
                  </motion.button>
                </motion.div>
              ))}
            </div>
            )}
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
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Activity Yet</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Be the first to share your savings achievements!</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowShareAchievement(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-2xl shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] dark:shadow-[10px_10px_20px_#0f172a,-10px_-10px_20px_#334155] hover:shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:hover:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] transition-all duration-300"
                  >
                    Share Achievement
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addSampleData}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-2xl shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] dark:shadow-[10px_10px_20px_#0f172a,-10px_-10px_20px_#334155] hover:shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:hover:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] transition-all duration-300"
                  >
                    Load Sample Data
                  </motion.button>
                </div>
              </div>
            ) : (
            <div className="space-y-6">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl p-4 sm:p-6 lg:p-8 shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] border border-white/30 dark:border-slate-700/30"
                >
                  <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] flex-shrink-0">
                      {post.userName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base truncate">{post.userName}</h4>
                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                          {new Date(post.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mb-3 sm:mb-4 text-sm sm:text-base break-words">{post.content}</p>
                      
                      <div className="flex items-center gap-2 sm:gap-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => likePost(post.id)}
                          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-100/60 dark:bg-slate-700/60 rounded-2xl shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#334155] hover:shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:hover:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] transition-all duration-300"
                        >
                          <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                          <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">{post.likes}</span>
                        </motion.button>
                        
                        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-100/60 dark:bg-slate-700/60 rounded-2xl shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#0f172a,inset_-4px_-4px_8px_#334155]">
                          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                          <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">{post.comments}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Friend Dialog - Moved to root level for proper z-index */}
      <Dialog open={showAddFriend} onOpenChange={setShowAddFriend}>
        <DialogContent className="max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border-0 shadow-[30px_30px_60px_#d1d9e6,-30px_-30px_60px_#ffffff] dark:shadow-[30px_30px_60px_#0f172a,-30px_-30px_60px_#334155] rounded-3xl z-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              👥 Add Friend
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 p-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Enter your friend's email address to send them a friend request
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Friend's Email</Label>
              <Input
                type="email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="friend@example.com"
                className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] focus:shadow-[inset_10px_10px_20px_#d1d9e6,inset_-10px_-10px_20px_#ffffff] dark:focus:shadow-[inset_10px_10px_20px_#0f172a,inset_-10px_-10px_20px_#334155] transition-all duration-300 py-4 px-6 text-slate-700 dark:text-slate-200"
              />
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddFriend(false)}
                className="flex-1 py-4 bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-bold text-lg rounded-2xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-500"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={sendFriendRequest}
                className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-lg rounded-2xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-500"
              >
                Send Request
              </motion.button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Achievement Dialog */}
      <Dialog open={showShareAchievement} onOpenChange={setShowShareAchievement}>
        <DialogContent className="max-w-lg max-h-[90vh] bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border-0 shadow-[30px_30px_60px_#d1d9e6,-30px_-30px_60px_#ffffff] dark:shadow-[30px_30px_60px_#0f172a,-30px_-30px_60px_#334155] rounded-3xl z-50 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              🏆 Share Achievement
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 p-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                Share your savings achievement with friends and inspire others!
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-3">
                <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Achievement Title *</Label>
                <Input
                  value={achievementTitle}
                  onChange={(e) => setAchievementTitle(e.target.value)}
                  placeholder="e.g., Emergency Fund Complete!"
                  className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] focus:shadow-[inset_10px_10px_20px_#d1d9e6,inset_-10px_-10px_20px_#ffffff] dark:focus:shadow-[inset_10px_10px_20px_#0f172a,inset_-10px_-10px_20px_#334155] transition-all duration-300 py-3 px-4 text-slate-700 dark:text-slate-200 text-sm"
                />
                
                {/* Quick Templates */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { title: "Emergency Fund Complete!", desc: "Built my emergency fund successfully!" },
                    { title: "Savings Goal Achieved!", desc: "Reached my monthly savings target!" },
                    { title: "Debt-Free Journey!", desc: "Paid off a significant debt!" },
                    { title: "Investment Milestone!", desc: "Made my first investment!" }
                  ].map((template, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setAchievementTitle(template.title);
                        setAchievementDescription(template.desc);
                      }}
                      className="px-3 py-2 bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 rounded-xl shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#334155] hover:shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:hover:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] transition-all duration-300 text-xs font-medium"
                    >
                      {template.title}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Description *</Label>
                <textarea
                  value={achievementDescription}
                  onChange={(e) => setAchievementDescription(e.target.value)}
                  placeholder="Tell your friends about your achievement..."
                  rows={3}
                  className="w-full bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] focus:shadow-[inset_10px_10px_20px_#d1d9e6,inset_-10px_-10px_20px_#ffffff] dark:focus:shadow-[inset_10px_10px_20px_#0f172a,inset_-10px_-10px_20px_#334155] transition-all duration-300 py-3 px-4 text-slate-700 dark:text-slate-200 resize-none text-sm"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Amount (Optional)</Label>
                <Input
                  type="number"
                  value={achievementAmount}
                  onChange={(e) => setAchievementAmount(e.target.value)}
                  placeholder="e.g., 50000"
                  className="bg-slate-100/50 dark:bg-slate-700/50 border-0 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] focus:shadow-[inset_10px_10px_20px_#d1d9e6,inset_-10px_-10px_20px_#ffffff] dark:focus:shadow-[inset_10px_10px_20px_#0f172a,inset_-10px_-10px_20px_#334155] transition-all duration-300 py-3 px-4 text-slate-700 dark:text-slate-200 text-sm"
                />
              </div>
            </div>

          </div>
          
          {/* Action Buttons - Fixed at bottom */}
          <div className="flex-shrink-0 p-4 pt-0">
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowShareAchievement(false)}
                className="flex-1 py-3 sm:py-4 bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-bold text-base sm:text-lg rounded-2xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-500"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={shareAchievement}
                className="flex-1 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-base sm:text-lg rounded-2xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155] hover:shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:hover:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] transition-all duration-500"
              >
                Share Achievement
              </motion.button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
