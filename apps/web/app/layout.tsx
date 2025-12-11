import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@myprotocolstack/ui";
import "@myprotocolstack/ui/globals.css";
import { StructuredData } from "@/components/seo/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://protocolstack.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MyProtocolStack - Build Science-Backed Health Protocols",
    template: "%s | MyProtocolStack",
  },
  description:
    "Build and track personalized health protocols. Browse 30+ curated protocols, create custom stacks, track adherence.",
  keywords: [
    "health protocols",
    "biohacking",
    "habit tracking",
    "sleep optimization",
    "productivity",
    "focus",
    "energy",
    "fitness",
  ],
  authors: [{ name: "MyProtocolStack" }],
  creator: "MyProtocolStack",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "MyProtocolStack",
    title: "MyProtocolStack - Build Science-Backed Health Protocols",
    description: "Build and track personalized health protocols based on science.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "MyProtocolStack",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyProtocolStack",
    description: "Build and track personalized health protocols.",
    creator: "@MyProtocolStack",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MyProtocolStack",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  sameAs: ["https://twitter.com/MyProtocolStack"],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Support",
    email: "support@protocolstack.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <StructuredData data={organizationSchema} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
