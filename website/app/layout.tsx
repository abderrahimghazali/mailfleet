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

export const metadata: Metadata = {
  title: "MailFleet — Your emails. Your data. Your rules.",
  description:
    "Open-source desktop email campaign manager. Self-hosted, no monthly fees, no vendor lock-in. Built with Tauri, React, and Rust.",
  keywords: [
    "email marketing",
    "open source",
    "desktop app",
    "AWS SES",
    "email campaigns",
    "self-hosted",
  ],
  icons: {
    icon: "/favicon.png",
    apple: "/icon.png",
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
