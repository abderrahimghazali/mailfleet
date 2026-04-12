"use client";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { motion } from "motion/react";

const row1 = [
  { name: "Tauri 2" },
  { name: "React 19" },
  { name: "TypeScript" },
  { name: "TailwindCSS" },
  { name: "Rust" },
  { name: "AWS SES" },
];

const row2 = [
  { name: "shadcn/ui" },
  { name: "TanStack Router" },
  { name: "TanStack Table" },
  { name: "Maily.to Editor" },
  { name: "Recharts" },
  { name: "Tiptap" },
];

export function TechStack() {
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-muted-fg"
        >
          Built with modern technologies
        </motion.p>
        <InfiniteMovingCards items={row1} speed="slow" />
        <InfiniteMovingCards
          items={row2}
          speed="slow"
          direction="right"
          className="mt-4"
        />
      </div>
    </section>
  );
}
