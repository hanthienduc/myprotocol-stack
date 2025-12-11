import { canCreateStack } from "@/lib/subscription";
import { UpgradePrompt } from "./upgrade-prompt";

/**
 * Server Component that shows a banner when user is at stack limit
 * Returns null if user can still create stacks
 */
export async function StackLimitBanner() {
  const { allowed, current, limit } = await canCreateStack();

  // Don't show if user can create more stacks or has unlimited (Pro)
  if (allowed || limit === Infinity) return null;

  return (
    <UpgradePrompt
      message={`You've reached your stack limit (${current}/${limit}). Upgrade to Pro for unlimited stacks.`}
      variant="inline"
    />
  );
}
