"use client";
import { useAnimate, useInView, stagger } from "motion/react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function TextGenerateEffect({
  words,
  className,
}: {
  words: string;
  className?: string;
}) {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: true });
  const wordArray = words.split(" ");

  useEffect(() => {
    if (isInView) {
      animate(
        "span",
        { opacity: 1, transform: "translateY(0)", filter: "blur(0px)" },
        { duration: 0.5, delay: stagger(0.06) }
      );
    }
  }, [isInView, animate]);

  return (
    <div ref={scope} className={cn(className)}>
      {wordArray.map((word, i) => (
        <span
          key={i}
          className="inline-block"
          style={{
            opacity: 0,
            transform: "translateY(20px)",
            filter: "blur(8px)",
            marginRight: "0.25em",
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}
