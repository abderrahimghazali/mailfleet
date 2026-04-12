"use client";
import { Lamp } from "@/components/ui/lamp";
import { motion } from "motion/react";
import { Settings, Upload, Paintbrush, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: Settings,
    number: "01",
    title: "Configure AWS SES",
    description:
      "Connect your AWS credentials. MailFleet handles rate limiting and reputation management.",
  },
  {
    icon: Upload,
    number: "02",
    title: "Import Contacts",
    description:
      "Upload CSV files or add contacts manually. Built-in validation catches invalid emails.",
  },
  {
    icon: Paintbrush,
    number: "03",
    title: "Design Campaigns",
    description:
      "Use the drag-and-drop editor with merge tags. Preview across devices before sending.",
  },
  {
    icon: BarChart3,
    number: "04",
    title: "Track Results",
    description:
      "Monitor opens, clicks, bounces, and complaints in real-time via the analytics dashboard.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <Lamp>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="font-display text-4xl font-semibold tracking-tight text-fg md:text-5xl">
              Up and running in{" "}
              <span className="bg-gradient-to-r from-primary to-accent-violet bg-clip-text text-transparent">
                four steps
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-fg">
              From zero to first campaign in under 10 minutes.
            </p>
          </motion.div>
        </Lamp>

        <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group relative"
            >
              {i < steps.length - 1 && (
                <div className="absolute right-0 top-12 hidden h-px w-8 translate-x-full bg-gradient-to-r from-border to-transparent lg:block" />
              )}

              <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft">
                    <step.icon
                      className="h-6 w-6 text-primary"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="font-display text-3xl font-bold text-muted/80">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-fg">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-fg">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
