"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@myprotocolstack/ui";
import { Checkbox } from "@myprotocolstack/ui";
import { Progress } from "@myprotocolstack/ui";
import { Badge } from "@myprotocolstack/ui";
import { createClient } from "@myprotocolstack/database/client";
import type { Protocol, Stack, Tracking, UserStreak, BadgeType } from "@myprotocolstack/database";
import { FavoriteButton } from "@/components/protocols/favorite-button";
import { StreakCounter } from "@/components/streaks/streak-counter";
import { StreakMilestoneModal } from "@/components/streaks/streak-milestone-modal";
import { updateStreak } from "@/actions/streaks";
import { isStreakAtRisk } from "@/lib/streak-calculator";

// Get client timezone (runs on client only)
const getClientTimezone = () => {
  if (typeof window === "undefined") return "UTC";
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
};

interface TodayViewProps {
  stacks: Stack[];
  protocols: Protocol[];
  trackingRecords: Tracking[];
  streakRecords: UserStreak[];
  favoriteIds?: string[];
  userId: string;
  date: string;
}

const categoryIcons: Record<string, string> = {
  sleep: "🌙",
  focus: "🎯",
  energy: "⚡",
  fitness: "💪",
};

export function TodayView({
  stacks,
  protocols,
  trackingRecords,
  streakRecords,
  favoriteIds = [],
  userId,
  date,
}: TodayViewProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localTracking, setLocalTracking] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    trackingRecords.forEach((t) => {
      initial[`${t.stack_id}-${t.protocol_id}`] = t.completed;
    });
    return initial;
  });

  // Streak state per stack
  const [localStreaks, setLocalStreaks] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    streakRecords.forEach((s) => {
      initial[s.stack_id] = s.current_streak;
    });
    return initial;
  });

  // Track which stacks we've already updated today to avoid duplicates
  // Key includes date to reset on new day navigation
  const streakUpdatedRef = useRef<Set<string>>(new Set());

  // Get client timezone once on mount
  const clientTimezone = useMemo(() => getClientTimezone(), []);

  // Milestone modal state
  const [milestoneModal, setMilestoneModal] = useState<{
    open: boolean;
    badgeType: BadgeType;
    streak: number;
    stackName: string;
  }>({
    open: false,
    badgeType: "streak_7",
    streak: 0,
    stackName: "",
  });

  const supabase = createClient();
  const protocolMap = new Map(protocols.map((p) => [p.id, p]));

  // Helper to check if a stack is fully completed
  const isStackFullyCompleted = (stack: Stack, tracking: Record<string, boolean>) => {
    return stack.protocol_ids.every((pId) => tracking[`${stack.id}-${pId}`]);
  };

  // Update streak when stack becomes fully completed
  const checkAndUpdateStreak = async (stackId: string, tracking: Record<string, boolean>) => {
    const stack = stacks.find((s) => s.id === stackId);
    if (!stack) return;

    const wasFullyCompleted = isStackFullyCompleted(stack, tracking);
    // Include date in key to allow re-update on different days
    const updateKey = `${stackId}-${date}`;
    const alreadyUpdated = streakUpdatedRef.current.has(updateKey);

    if (wasFullyCompleted && !alreadyUpdated) {
      streakUpdatedRef.current.add(updateKey);

      // Pass client timezone for correct date calculation
      const result = await updateStreak(stackId, clientTimezone);

      if (result.success) {
        setLocalStreaks((prev) => ({ ...prev, [stackId]: result.streak }));

        // Show milestone modal if badge unlocked
        if (result.badgeUnlocked) {
          setMilestoneModal({
            open: true,
            badgeType: result.badgeUnlocked,
            streak: result.streak,
            stackName: stack.name,
          });
        }
      }
    }
  };

  const toggleProtocol = async (
    stackId: string,
    protocolId: string,
    completed: boolean
  ) => {
    const key = `${stackId}-${protocolId}`;
    const newTracking = { ...localTracking, [key]: completed };
    setLocalTracking(newTracking);
    setIsUpdating(true);

    try {
      // Upsert tracking record
      const { error } = await supabase.from("tracking").upsert(
        {
          user_id: userId,
          stack_id: stackId,
          protocol_id: protocolId,
          date,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        },
        {
          onConflict: "user_id,stack_id,protocol_id,date",
        }
      );

      if (error) {
        console.error("Error updating tracking:", error);
        // Revert on error
        setLocalTracking((prev) => ({ ...prev, [key]: !completed }));
        return;
      }

      // Check if stack is now fully completed - streak update handles revalidation
      if (completed) {
        await checkAndUpdateStreak(stackId, newTracking);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Check streaks on mount for already-completed stacks
  useEffect(() => {
    stacks.forEach((stack) => {
      if (isStackFullyCompleted(stack, localTracking)) {
        checkAndUpdateStreak(stack.id, localTracking);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Calculate overall progress
  const totalProtocols = stacks.reduce((acc, s) => acc + s.protocol_ids.length, 0);
  const completedProtocols = Object.values(localTracking).filter(Boolean).length;
  const progressPercent = totalProtocols > 0 ? (completedProtocols / totalProtocols) * 100 : 0;

  // Get streak data for a stack
  const getStackStreakData = (stackId: string) => {
    const streakRecord = streakRecords.find((s) => s.stack_id === stackId);
    const currentStreak = localStreaks[stackId] || 0;
    const atRisk = streakRecord
      ? isStreakAtRisk(
          streakRecord.last_activity_date,
          streakRecord.grace_period_used,
          streakRecord.timezone || "UTC"
        )
      : false;
    return { currentStreak, atRisk };
  };

  return (
    <div className="space-y-6">
      {/* Milestone Modal */}
      <StreakMilestoneModal
        open={milestoneModal.open}
        onOpenChange={(open) => setMilestoneModal((prev) => ({ ...prev, open }))}
        badgeType={milestoneModal.badgeType}
        streak={milestoneModal.streak}
        stackName={milestoneModal.stackName}
      />

      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today&apos;s Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {completedProtocols} of {totalProtocols} protocols completed
              </span>
              <span className="font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Stack cards */}
      {stacks.map((stack) => {
        const stackProtocols = stack.protocol_ids
          .map((id) => protocolMap.get(id))
          .filter((p): p is Protocol => !!p);

        const stackCompleted = stackProtocols.filter(
          (p) => localTracking[`${stack.id}-${p.id}`]
        ).length;

        const { currentStreak, atRisk } = getStackStreakData(stack.id);
        const isFullyComplete = stackCompleted === stackProtocols.length;

        return (
          <Card key={stack.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{stack.name}</CardTitle>
                  <StreakCounter streak={currentStreak} isAtRisk={atRisk} size="sm" />
                </div>
                <Badge variant={isFullyComplete ? "default" : "secondary"}>
                  {stackCompleted}/{stackProtocols.length}
                </Badge>
              </div>
              {stack.description && (
                <p className="text-sm text-muted-foreground">
                  {stack.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stackProtocols.map((protocol) => {
                  const key = `${stack.id}-${protocol.id}`;
                  const isCompleted = localTracking[key] || false;

                  return (
                    <div
                      key={protocol.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        isCompleted
                          ? "bg-muted/50 border-muted"
                          : "hover:border-primary"
                      }`}
                    >
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={(checked) =>
                          toggleProtocol(stack.id, protocol.id, !!checked)
                        }
                        disabled={isUpdating}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {categoryIcons[protocol.category]}
                          </span>
                          <span
                            className={`font-medium ${
                              isCompleted
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {protocol.name}
                          </span>
                          <FavoriteButton
                            protocolId={protocol.id}
                            isFavorite={favoriteIds.includes(protocol.id)}
                            className="h-6 w-6"
                          />
                        </div>
                        <p
                          className={`text-sm mt-0.5 ${
                            isCompleted
                              ? "text-muted-foreground/50"
                              : "text-muted-foreground"
                          }`}
                        >
                          {protocol.description}
                        </p>
                        {protocol.duration_minutes && (
                          <span className="text-xs text-muted-foreground">
                            {protocol.duration_minutes} min
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
