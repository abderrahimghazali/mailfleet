"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export function Lamp({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("relative flex flex-col items-center", className)}
    >
      <div className="relative flex h-52 w-full items-start justify-center overflow-hidden">
        {/* Light source line */}
        <motion.div
          initial={{ width: "6rem", opacity: 0.5 }}
          whileInView={{ width: "20rem", opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
        />
        {/* Light cone */}
        <motion.div
          initial={{ opacity: 0, width: "8rem" }}
          whileInView={{ opacity: 1, width: "28rem" }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="absolute top-0 h-full bg-gradient-to-b from-primary/10 via-accent-violet/5 to-transparent"
          style={{
            clipPath: "polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)",
          }}
        />
        {/* Soft glow */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="absolute top-4 h-32 w-64 rounded-full bg-primary-soft/40 blur-3xl"
        />
      </div>
      <div className="relative z-10 -mt-8">{children}</div>
    </div>
  );
}
