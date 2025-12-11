"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@myprotocolstack/ui";
import { Crown, Lock } from "lucide-react";
import Link from "next/link";
import { PricingModal } from "./pricing-modal";

interface StackLimitCardProps {
  current: number;
  limit: number;
}

export function StackLimitCard({ current, limit }: StackLimitCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Stack Limit Reached
          </CardTitle>
          <CardDescription>
            You&apos;ve created {current} of {limit} stacks on the Free plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upgrade to Pro for unlimited stacks, advanced analytics, and more.
          </p>
          <p className="text-lg font-bold">
            $12
            <span className="text-sm font-normal text-muted-foreground">
              /mo
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              or $99/yr
            </span>
          </p>
          <div className="flex gap-3">
            <Button onClick={() => setShowModal(true)}>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
            <Button variant="outline" asChild>
              <Link href="/stacks">View Your Stacks</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <PricingModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
