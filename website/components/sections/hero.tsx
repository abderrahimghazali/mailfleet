"use client";
import { motion } from "motion/react";
import Image from "next/image";

const builtWith = [
  { name: "Tauri", src: "/tauri.svg" },
  { name: "React", src: "/react.svg" },
  { name: "TypeScript", src: "/typescript.svg" },
  { name: "Rust", src: "/rust.svg" },
  { name: "Tailwind CSS", src: "/tailwindcss.svg" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-32">
      {/* Gradient mesh */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 40%, rgba(5,24,166,0.06) 0%, transparent 100%),
            radial-gradient(ellipse 60% 80% at 80% 20%, rgba(79,70,229,0.04) 0%, transparent 100%),
            radial-gradient(ellipse 70% 50% at 50% 90%, rgba(199,213,242,0.1) 0%, transparent 100%)
          `,
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-[13px] text-muted-fg shadow-sm backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Open Source &middot; Free Forever
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-10 font-display text-[3.5rem] font-semibold leading-[1.05] tracking-tight text-fg sm:text-7xl lg:text-[5.5rem]"
        >
          Send campaigns
          <br />
          on <em className="italic">your</em> terms
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mx-auto mt-7 max-w-md text-[17px] leading-relaxed text-muted-fg"
        >
          Self-hosted email marketing with AWS SES.
          <br className="hidden sm:block" />
          No subscriptions. No vendor lock-in.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-9"
        >
          <a
            href="https://github.com/abderrahimghazali/mailfleet/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3 text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_12px_rgba(5,24,166,0.25)] transition-all hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_rgba(5,24,166,0.3)] hover:brightness-110"
          >
            <Image src="/applescript.svg" alt="" width={16} height={16} className="h-4 w-4 brightness-0 invert" />
            Download for macOS
          </a>
        </motion.div>

        {/* Built with */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.95 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-fg/70">
            Built with
          </span>
          <div className="flex items-center gap-6">
            {builtWith.map((tech) => (
              <Image
                key={tech.name}
                src={tech.src}
                alt={tech.name}
                width={22}
                height={22}
                className="h-[22px] w-[22px] opacity-40 transition-opacity duration-300 hover:opacity-90"
                title={tech.name}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Screenshot */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative mx-auto mt-16 max-w-[1100px]"
      >
        {/* Glow */}
        <div className="absolute -inset-x-16 -top-16 bottom-0 rounded-[40px] bg-gradient-to-b from-primary/[0.04] via-primary/[0.06] to-transparent blur-3xl" />

        {/* Frame */}
        <div
          className="relative overflow-hidden rounded-2xl bg-card"
          style={{
            boxShadow: `
              0 0 0 1px rgba(0,0,0,0.04),
              0 1px 2px rgba(0,0,0,0.04),
              0 4px 8px rgba(0,0,0,0.04),
              0 12px 24px rgba(0,0,0,0.06),
              0 40px 64px rgba(0,0,0,0.06)
            `,
          }}
        >
          <Image
            src="/screenshot.png"
            alt="MailFleet — Dashboard"
            width={2200}
            height={1400}
            className="w-full"
            priority
          />
        </div>
      </motion.div>
    </section>
  );
}
