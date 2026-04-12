"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useMemo } from "react";

export function FloatingDots({
  number = 30,
  className,
}: {
  number?: number;
  className?: string;
}) {
  const dots = useMemo(
    () =>
      Array.from({ length: number }, () => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 4,
        duration: 4 + Math.random() * 6,
      })),
    [number]
  );

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      {dots.map((dot, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-primary/10"
          style={{
            top: dot.top,
            left: dot.left,
            width: dot.size,
            height: dot.size,
          }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
          transition={{
            duration: dot.duration,
            delay: dot.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
