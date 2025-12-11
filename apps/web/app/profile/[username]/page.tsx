import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProfile, incrementStackViewCount } from "@/actions/profile";
import { PublicProfile } from "@/components/profile/public-profile";
import { StructuredData } from "@/components/seo/structured-data";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const data = await getPublicProfile(username);

  if (!data) return { title: "Profile Not Found" };

  const { profile } = data;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://protocolstack.app";

  return {
    title: `${profile.full_name || profile.username}'s Health Stacks`,
    description:
      profile.bio ||
      `Check out ${profile.username}'s health protocol stacks on MyProtocolStack`,
    openGraph: {
      title: `${profile.full_name || profile.username} | MyProtocolStack`,
      description: profile.bio || "Health protocol stacks",
      url: `${baseUrl}/profile/${username}`,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${profile.full_name || profile.username}'s Stacks`,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const data = await getPublicProfile(username);

  if (!data) notFound();

  // Increment view count for all displayed stacks (fire and forget)
  data.stacks.forEach((stack) => {
    incrementStackViewCount(stack.id).catch(() => {
      // Silently fail - view count is not critical
    });
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://protocolstack.app";
  const profileSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: data.profile.full_name || data.profile.username,
    url: `${baseUrl}/profile/${username}`,
    image: data.profile.avatar_url,
    description: data.profile.bio,
  };

  return (
    <>
      <StructuredData data={profileSchema} />
      <PublicProfile profile={data.profile} stacks={data.stacks} />
    </>
  );
}
