import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 할 일 관리 서비스",
  description: "AI가 도와주는 똑똑한 할 일 관리 서비스",
  keywords: [
    "AI",
    "할 일 관리",
    "투두리스트",
    "생산성",
    "일정관리",
    "todo",
    "task manager",
    "productivity",
  ],
  authors: [{ name: "AI Todo Team" }],
  creator: "AI Todo Team",
  publisher: "AI Todo",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://ai-todo-manager.vercel.app",
    title: "AI 할 일 관리 서비스",
    description: "AI가 도와주는 똑똑한 할 일 관리 서비스",
    siteName: "AI 할 일 관리 서비스",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI 할 일 관리 서비스",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 할 일 관리 서비스",
    description: "AI가 도와주는 똑똑한 할 일 관리 서비스",
    images: ["/og-image.png"],
    creator: "@aitodo",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://ai-todo-manager.vercel.app",
  },
  category: "productivity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
