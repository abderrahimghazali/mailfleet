"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #CAC6C0 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Soft indigo radial glow */}
      <div
        className="absolute left-1/2 top-1/3 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.08] blur-[100px]"
        style={{ background: "#0518A6" }}
      />
      {/* Warm accent glow */}
      <motion.div
        className="absolute -right-40 top-0 h-[400px] w-[400px] rounded-full opacity-[0.04] blur-[80px]"
        style={{ background: "#4F46E5" }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Fade edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface via-transparent to-surface" />
    </div>
  );
}
