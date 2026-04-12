"use client";
import type { ReactNode, ElementType } from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export function HoverBorderGradient({
  children,
  className,
  containerClassName,
  as: Component = "button",
  ...props
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  as?: ElementType;
  [key: string]: unknown;
}) {
  return (
    <Component
      className={cn(
        "group relative overflow-hidden rounded-full p-px",
        containerClassName
      )}
      {...props}
    >
      <div className="absolute inset-0 rounded-full bg-border transition-opacity group-hover:opacity-0" />
      <motion.div
        className="absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, #0518A6, #4F46E5, #0518A6)",
          backgroundSize: "200% 200%",
        }}
        animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <div
        className={cn(
          "relative z-10 rounded-full bg-card transition-colors group-hover:bg-card/90",
          className
        )}
      >
        {children}
      </div>
    </Component>
  );
}
