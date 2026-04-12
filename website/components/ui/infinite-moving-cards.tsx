"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export function InfiniteMovingCards({
  items,
  direction = "left",
  speed = "normal",
  className,
}: {
  items: { name: string; icon?: ReactNode }[];
  direction?: "left" | "right";
  speed?: "slow" | "normal" | "fast";
  className?: string;
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!scrollerRef.current) return;
    const items = Array.from(scrollerRef.current.children);
    items.forEach((item) => {
      scrollerRef.current?.appendChild(item.cloneNode(true));
    });
    setReady(true);
  }, []);

  const speedMap = { slow: "60s", normal: "40s", fast: "20s" };

  return (
    <div
      className={cn(
        "relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className="flex w-max gap-6 py-4"
        style={
          ready
            ? {
                animation: `scroll-left ${speedMap[speed]} linear infinite`,
                animationDirection:
                  direction === "right" ? "reverse" : "normal",
              }
            : undefined
        }
      >
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-fg-light shadow-sm"
          >
            {item.icon}
            <span>{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
