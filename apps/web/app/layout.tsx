import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@myprotocolstack/ui";
import "@myprotocolstack/ui/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyProtocolStack - Build Your Health Protocol",
  description:
    "Build and track personalized health protocols based on science. Combine sleep, focus, energy, and fitness protocols into daily routines.",
  keywords: [
    "health protocols",
    "biohacking",
    "sleep optimization",
    "focus",
    "productivity",
    "habit tracking",
  ],
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
