import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const siteUrl = "https://mailfleet.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MailFleet — Self-hosted email campaigns on your terms",
    template: "%s | MailFleet",
  },
  description:
    "Open-source desktop email campaign manager built with Tauri and React. Send campaigns via AWS SES with no monthly fees, no vendor lock-in, and full data ownership.",
  keywords: [
    "email marketing",
    "email campaign manager",
    "open source email tool",
    "self-hosted email marketing",
    "desktop email app",
    "AWS SES email",
    "email campaigns macOS",
    "Tauri email app",
    "free email marketing",
    "no subscription email tool",
    "email template editor",
    "bulk email sender",
  ],
  authors: [{ name: "Abderrahim Ghazali", url: "https://github.com/abderrahimghazali" }],
  creator: "Abderrahim Ghazali",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "MailFleet",
    title: "MailFleet — Self-hosted email campaigns on your terms",
    description:
      "Open-source desktop app for managing email campaigns with AWS SES. No subscriptions. No vendor lock-in. Your data stays on your machine.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "MailFleet — Self-hosted email campaign manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MailFleet — Self-hosted email campaigns on your terms",
    description:
      "Open-source desktop app for email campaigns with AWS SES. No monthly fees. No vendor lock-in.",
    images: ["/og.png"],
  },
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
  icons: {
    icon: "/favicon.png",
    apple: "/icon.png",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.theme==='dark'||(!('theme' in localStorage)&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
