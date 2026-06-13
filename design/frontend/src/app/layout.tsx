import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Syncopate, Space_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const syncopate = Syncopate({
  variable: "--font-syncopate",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "AURA — Autonomous Product Agent | FAR AWAY 2026",
  description: "The first autonomous PM agent that works for every team.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${syncopate.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col font-mono">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
