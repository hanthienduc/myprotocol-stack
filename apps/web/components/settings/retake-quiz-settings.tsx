"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@myprotocolstack/ui";
import { toast } from "sonner";
import { resetOnboarding } from "@/actions/onboarding";
import { clearOnboardingStorage } from "@/app/(dashboard)/onboarding/_components/onboarding-wizard-context";

export function RetakeQuizSettings() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRetakeQuiz = () => {
    startTransition(async () => {
      const result = await resetOnboarding();
      if (result.success) {
        clearOnboardingStorage();
        toast.success("Quiz reset successfully. Redirecting...");
        router.push("/onboarding");
      } else {
        toast.error(result.error || "Failed to reset quiz");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protocol Preferences</CardTitle>
        <CardDescription>Update your health goals and preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Retake Onboarding Quiz</p>
            <p className="text-xs text-muted-foreground">
              Update your goals, experience level, and time commitment
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRetakeQuiz}
            disabled={isPending}
          >
            {isPending ? "Resetting..." : "Retake Quiz"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
