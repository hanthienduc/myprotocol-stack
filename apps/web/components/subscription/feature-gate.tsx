import { isPro } from "@/lib/subscription";
import { UpgradePrompt } from "./upgrade-prompt";

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Server Component that gates Pro-only content
 * Shows children if user is Pro, otherwise shows upgrade prompt
 */
export async function FeatureGate({
  feature,
  children,
  fallback,
}: FeatureGateProps) {
  const userIsPro = await isPro();

  if (userIsPro) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback || <UpgradePrompt feature={feature} variant="card" />}
    </>
  );
}
