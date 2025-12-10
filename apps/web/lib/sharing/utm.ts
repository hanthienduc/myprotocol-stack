/**
 * UTM parameter utilities for share URL tracking
 */

export interface UTMParams {
  source: string;
  medium: string;
  campaign?: string;
  content?: string;
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://myprotocolstack.com";

/**
 * Build a share URL with UTM parameters and optional referral code
 */
export function buildShareUrl(
  baseUrl: string,
  utm: UTMParams,
  referralCode?: string
): string {
  const url = new URL(baseUrl, APP_URL);

  url.searchParams.set("utm_source", utm.source);
  url.searchParams.set("utm_medium", utm.medium);

  if (utm.campaign) {
    url.searchParams.set("utm_campaign", utm.campaign);
  }
  if (utm.content) {
    url.searchParams.set("utm_content", utm.content);
  }
  if (referralCode) {
    url.searchParams.set("ref", referralCode);
  }

  return url.toString();
}

/**
 * Get share URL for a protocol page
 */
export function getProtocolShareUrl(
  protocolId: string,
  source: string,
  referralCode?: string
): string {
  const baseUrl = `${APP_URL}/protocols/${protocolId}`;

  return buildShareUrl(
    baseUrl,
    {
      source,
      medium: "social",
      campaign: "protocol_share",
      content: protocolId,
    },
    referralCode
  );
}

/**
 * Get share URL for a stack page
 */
export function getStackShareUrl(
  stackId: string,
  source: string,
  referralCode?: string
): string {
  const baseUrl = `${APP_URL}/stacks/${stackId}`;

  return buildShareUrl(
    baseUrl,
    {
      source,
      medium: "social",
      campaign: "stack_share",
      content: stackId,
    },
    referralCode
  );
}
