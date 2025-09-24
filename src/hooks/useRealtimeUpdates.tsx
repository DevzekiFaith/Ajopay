import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface RealtimeEvent {
  type: 'goal_completed' | 'goal_created' | 'goal_progress' | 'badge_earned' | 'challenge_joined' | 'challenge_created' | 'challenge_completed' | 'circle_updated' | 'circle_created' | 'circle_joined' | 'circle_contribution' | 'level_up' | 'streak_updated';
  data: Record<string, unknown>;
  userId: string;
  timestamp: string;
}

export function useRealtimeUpdates(userId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to user-specific updates
    const userChannel = supabase
      .channel(`user_updates_${userId}`)
      .on("broadcast", { event: "goal_completed" }, (payload) => {
        const event = payload.payload as RealtimeEvent;
        toast.success(
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎯</div>
            <div>
              <div className="font-bold">Goal Completed!</div>
              <div className="text-sm">{event.data.goalTitle}</div>
            </div>
          </div>,
          { duration: 5000 }
        );
        setLastUpdate(new Date());
      })
      .on("broadcast", { event: "goal_created" }, (payload) => {
        const event = payload.payload as RealtimeEvent;
        toast.success(
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎯</div>
            <div>
              <div className="font-bold">New Goal Created!</div>
              <div className="text-sm">{event.data.goalTitle}</div>
            </div>
          </div>,
          { duration: 4000 }
        );
        setLastUpdate(new Date());
      })
      .on("broadcast", { event: "goal_progress" }, (payload) => {
        const event = payload.payload as RealtimeEvent;
        toast.success(
          <div className="flex items-center gap-3">
            <div className="text-2xl">📈</div>
            <div>
              <div className="font-bold">Goal Progress!</div>
              <div className="text-sm">{event.data.goalTitle} - ₦{event.data.newAmount?.toLocaleString()}</div>
            </div>
          </div>,
          { duration: 3000 }
        );
        setLastUpdate(new Date());
      })
      .on("broadcast", { event: "badge_earned" }, (payload) => {
        const event = payload.payload as RealtimeEvent;
        toast.success(
          <div className="flex items-center gap-3">
            <div className="text-2xl">🏆</div>
            <div>
              <div className="font-bold">Badge Earned!</div>
              <div className="text-sm">{event.data.badgeName}</div>
            </div>
          </div>,
          { duration: 6000 }
        );
        setLastUpdate(new Date());
      })
      .on("broadcast", { event: "level_up" }, (payload) => {
        const event = payload.payload as RealtimeEvent;
        toast.success(
          <div className="flex items-center gap-3">
            <div className="text-2xl">⭐</div>
            <div>
              <div className="font-bold">Level Up!</div>
              <div className="text-sm">You reached level {event.data.newLevel}</div>
            </div>
          </div>,
          { duration: 7000 }
        );
        setLastUpdate(new Date());
      })
      .on("broadcast", { event: "challenge_created" }, (payload) => {
        const event = payload.payload as RealtimeEvent;
        toast.success(
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎯</div>
            <div>
              <div className="font-bold">Challenge Created!</div>
              <div className="text-sm">{event.data.challengeTitle}</div>
            </div>
          </div>,
          { duration: 4000 }
        );
        setLastUpdate(new Date());
      })
      .on("broadcast", { event: "challenge_joined" }, (payload) => {
        const event = payload.payload as RealtimeEvent;
        toast.success(
          <div className="flex items-center gap-3">
            <div className="text-2xl">👥</div>
            <div>
              <div className="font-bold">Challenge Joined!</div>
              <div className="text-sm">{event.data.challengeTitle}</div>
            </div>
          </div>,
          { duration: 4000 }
        );
        setLastUpdate(new Date());
      })
      .on("broadcast", { event: "challenge_completed" }, (payload) => {
        const event = payload.payload as RealtimeEvent;
        toast.success(
          <div className="flex items-center gap-3">
            <div className="text-2xl">🏆</div>
            <div>
              <div className="font-bold">Challenge Completed!</div>
              <div className="text-sm">{event.data.challengeTitle}</div>
            </div>
          </div>,
          { duration: 5000 }
        );
        setLastUpdate(new Date());
      })
      .on("broadcast", { event: "circle_created" }, (payload) => {
        const event = payload.payload as RealtimeEvent;
        toast.success(
          <div className="flex items-center gap-3">
            <div className="text-2xl">⭕</div>
            <div>
              <div className="font-bold">Circle Created!</div>
              <div className="text-sm">{event.data.circleName} - Code: {event.data.joinCode}</div>
            </div>
          </div>,
          { duration: 6000 }
        );
        setLastUpdate(new Date());
      })
      .on("broadcast", { event: "circle_joined" }, (payload) => {
        const event = payload.payload as RealtimeEvent;
        toast.success(
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎉</div>
            <div>
              <div className="font-bold">Joined Circle!</div>
              <div className="text-sm">{event.data.circleName}</div>
            </div>
          </div>,
          { duration: 4000 }
        );
        setLastUpdate(new Date());
      })
      .on("broadcast", { event: "circle_contribution" }, (payload) => {
        const event = payload.payload as RealtimeEvent;
        toast.success(
          <div className="flex items-center gap-3">
            <div className="text-2xl">💰</div>
            <div>
              <div className="font-bold">Contribution Made!</div>
              <div className="text-sm">₦{event.data.amount?.toLocaleString()} to {event.data.circleName}</div>
            </div>
          </div>,
          { duration: 4000 }
        );
        setLastUpdate(new Date());
      })
      .on("broadcast", { event: "circle_updated" }, (payload) => {
        const event = payload.payload as RealtimeEvent;
        toast.success(
          <div className="flex items-center gap-3">
            <div className="text-2xl">⭕</div>
            <div>
              <div className="font-bold">Circle Update</div>
              <div className="text-sm">{event.data.message}</div>
            </div>
          </div>,
          { duration: 4000 }
        );
        setLastUpdate(new Date());
      })
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    // Subscribe to database changes for real-time data updates
    const goalsChannel = supabase
      .channel("savings_goals")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "savings_goals",
          filter: `user_id=eq.${userId}`,
        },
        () => setLastUpdate(new Date())
      )
      .subscribe();

    const challengesChannel = supabase
      .channel("peer_challenges")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "peer_challenges",
        },
        () => setLastUpdate(new Date())
      )
      .subscribe();

    const circlesChannel = supabase
      .channel("savings_circles")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "savings_circles",
        },
        () => setLastUpdate(new Date())
      )
      .subscribe();

    const gamificationChannel = supabase
      .channel("user_gamification")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_stats",
          filter: `user_id=eq.${userId}`,
        },
        () => setLastUpdate(new Date())
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
      supabase.removeChannel(goalsChannel);
      supabase.removeChannel(challengesChannel);
      supabase.removeChannel(circlesChannel);
      supabase.removeChannel(gamificationChannel);
      setIsConnected(false);
    };
  }, [userId, supabase]);

  const triggerUpdate = (type: RealtimeEvent['type'], data: Record<string, unknown>) => {
    if (!userId) return;
    
    supabase
      .channel(`user_updates_${userId}`)
      .send({
        type: "broadcast",
        event: type,
        payload: {
          type,
          data,
          userId,
          timestamp: new Date().toISOString(),
        },
      });
  };

  return {
    isConnected,
    lastUpdate,
    triggerUpdate,
  };
}
