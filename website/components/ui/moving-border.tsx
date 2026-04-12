"use client";
import type { ReactNode, ElementType } from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export function MovingBorder({
  children,
  className,
  containerClassName,
  duration = 3000,
  as: Component = "button",
  ...props
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  duration?: number;
  as?: ElementType;
  [key: string]: unknown;
}) {
  return (
    <Component
      className={cn(
        "relative overflow-hidden rounded-full p-[2px]",
        containerClassName
      )}
      {...props}
    >
      <motion.div
        className="absolute"
        style={{
          inset: "-50%",
          background:
            "conic-gradient(from 0deg, transparent 0%, transparent 25%, #0518A6 35%, #4F46E5 50%, #0518A6 65%, transparent 75%, transparent 100%)",
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: duration / 1000,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <div
        className={cn(
          "relative z-10 rounded-full bg-card",
          className
        )}
      >
        {children}
      </div>
    </Component>
  );
}
