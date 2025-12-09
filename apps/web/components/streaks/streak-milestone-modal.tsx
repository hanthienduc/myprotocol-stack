"use client";

import { useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@myprotocolstack/ui";
import { Button } from "@myprotocolstack/ui";
import type { BadgeType } from "@myprotocolstack/database";
import { getBadgeInfo } from "@/lib/streak-calculator";

interface StreakMilestoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badgeType: BadgeType;
  streak: number;
  stackName?: string;
}

const BADGE_EMOJIS: Record<BadgeType, string> = {
  streak_7: "🥉",
  streak_30: "🥈",
  streak_100: "🥇",
};

const CELEBRATION_MESSAGES: Record<BadgeType, string> = {
  streak_7: "You're building momentum! One week of consistency.",
  streak_30: "A whole month! Your dedication is inspiring.",
  streak_100: "100 days! You're unstoppable!",
};

export function StreakMilestoneModal({
  open,
  onOpenChange,
  badgeType,
  streak,
  stackName,
}: StreakMilestoneModalProps) {
  const info = getBadgeInfo(badgeType);
  const emoji = BADGE_EMOJIS[badgeType];
  const message = CELEBRATION_MESSAGES[badgeType];

  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fire from both sides
      confetti({
        particleCount: Math.floor(particleCount / 2),
        startVelocity: 30,
        spread: 60,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#f59e0b", "#fbbf24", "#fcd34d", "#fef3c7", "#ff6b6b"],
      });
      confetti({
        particleCount: Math.floor(particleCount / 2),
        startVelocity: 30,
        spread: 60,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#f59e0b", "#fbbf24", "#fcd34d", "#fef3c7", "#ff6b6b"],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      // Respect user's reduced motion preference (a11y)
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const cleanup = prefersReducedMotion ? undefined : fireConfetti();

      // Auto-dismiss after 5 seconds
      const timeout = setTimeout(() => {
        onOpenChange(false);
      }, 5000);

      return () => {
        cleanup?.();
        clearTimeout(timeout);
      };
    }
  }, [open, fireConfetti, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center sm:max-w-md">
        <DialogHeader className="items-center">
          <div className="text-6xl mb-4 animate-bounce">{emoji}</div>
          <DialogTitle className="text-2xl">
            {info.label} Unlocked!
          </DialogTitle>
          <DialogDescription className="text-base">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="inline-flex items-center justify-center gap-2 text-3xl font-bold text-amber-500">
            <span>🔥</span>
            <span>{streak}</span>
            <span className="text-lg font-normal text-muted-foreground">
              day streak
            </span>
          </div>
          {stackName && (
            <p className="text-sm text-muted-foreground mt-2">
              in &quot;{stackName}&quot;
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <Button onClick={() => onOpenChange(false)} size="lg">
            Keep it up!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
