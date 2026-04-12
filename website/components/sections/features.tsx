"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Cloud, Sparkles, Shield, HardDrive } from "lucide-react";

/* ── Interactive mockups ──────────────────────────────────────── */

function EditorMockup() {
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [preview, setPreview] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-[11px] font-medium text-muted-fg">Subject</div>
        <div className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-[12px] text-fg">
          Spring Sale — 30% off for you, {"{{first_name}}"}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-surface/60 px-2 py-1">
          {[
            { label: "B", aria: "Toggle bold", active: bold, toggle: () => setBold(!bold), style: "font-bold" },
            { label: "I", aria: "Toggle italic", active: italic, toggle: () => setItalic(!italic), style: "italic" },
            { label: "U", aria: "Toggle underline", active: false, toggle: () => {}, style: "underline" },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.toggle}
              aria-label={btn.aria}
              aria-pressed={btn.active}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded text-[11px] transition-all",
                btn.style,
                btn.active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-fg hover:bg-card"
              )}
            >
              {btn.label}
            </button>
          ))}
          <div className="mx-1 h-4 w-px bg-border" />
          <button className="flex h-6 items-center rounded px-1.5 text-[10px] text-muted-fg hover:bg-card">H1</button>
          <button className="flex h-6 items-center rounded px-1.5 text-[10px] text-muted-fg hover:bg-card">H2</button>
          <div className="mx-1 h-4 w-px bg-border" />
          <button className="flex h-6 items-center rounded px-1.5 text-[10px] text-muted-fg hover:bg-card">Link</button>
          <button className="flex h-6 items-center rounded px-1.5 text-[10px] text-muted-fg hover:bg-card">Image</button>
        </div>
        <div className="flex gap-0.5 rounded-lg border border-border p-0.5">
          <button
            onClick={() => setPreview(false)}
            className={cn("rounded-md px-2.5 py-1 text-[10px] font-medium transition-all", !preview ? "bg-primary/10 text-primary" : "text-muted-fg")}
          >
            Edit
          </button>
          <button
            onClick={() => setPreview(true)}
            className={cn("rounded-md px-2.5 py-1 text-[10px] font-medium transition-all", preview ? "bg-primary/10 text-primary" : "text-muted-fg")}
          >
            Preview
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 rounded-xl border border-border bg-card p-5"
          >
            <h3 className={cn("text-lg text-fg", bold && "font-bold", italic && "italic")}>
              Spring into savings
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-fg">
              Hey Sarah, we&apos;ve got something special just for you. Our biggest sale of the season is here — don&apos;t miss out.
            </p>
            <div className="h-32 rounded-xl bg-gradient-to-br from-primary-soft/30 via-secondary/50 to-primary-soft/20" />
            <p className="text-[13px] text-muted-fg">Use code <span className="font-mono font-medium text-fg">SPRING30</span> at checkout.</p>
            <div className="flex justify-center">
              <div className="cursor-pointer rounded-lg bg-primary px-8 py-2.5 text-xs font-medium text-white transition-all hover:brightness-110">
                Shop Now &rarr;
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 rounded-xl border border-dashed border-border bg-card p-5"
          >
            <div className="space-y-2">
              <div className={cn("h-3.5 w-2/3 rounded bg-fg/[0.08]", bold && "bg-fg/[0.14]")} />
              <div className="h-2 w-full rounded bg-muted/50" />
              <div className="h-2 w-5/6 rounded bg-muted/40" />
              <div className={cn("h-2 w-3/4 rounded bg-muted/35", italic && "skew-x-[-4deg]")} />
            </div>
            <div className="group relative h-32 cursor-pointer rounded-xl bg-gradient-to-br from-primary-soft/20 via-secondary/30 to-primary-soft/10 transition-colors hover:from-primary-soft/30">
              <div className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-fg opacity-0 transition-opacity group-hover:opacity-100">
                Click to add image
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full rounded bg-muted/45" />
              <div className="h-2 w-4/5 rounded bg-muted/35" />
            </div>
            <div className="flex justify-center">
              <div className="rounded-lg bg-primary/10 px-8 py-2.5 text-xs font-medium text-primary">
                Shop Now &rarr;
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContactsMockup() {
  const [rows, setRows] = useState([
    { name: "Sarah Chen", email: "sarah@company.co", status: "valid" as const, lists: 3 },
    { name: "Alex Rivera", email: "alex@startup.io", status: "valid" as const, lists: 2 },
    { name: "Jordan Lee", email: "j.lee@domain.com", status: "pending" as const, lists: 1 },
    { name: "Morgan Patel", email: "m.patel@corp.net", status: "valid" as const, lists: 4 },
    { name: "Sam Nakamura", email: "sam@agency.dev", status: "invalid" as const, lists: 0 },
  ]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const statusCycle = { valid: "pending" as const, pending: "invalid" as const, invalid: "valid" as const };
  const filtered = rows.filter(
    (r) => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase())
  );

  function toggleStatus(i: number) {
    const realIdx = rows.indexOf(filtered[i]);
    setRows((prev) => prev.map((r, j) => (j === realIdx ? { ...r, status: statusCycle[r.status] } : r)));
  }

  function toggleSelect(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <svg className="h-3.5 w-3.5 text-muted-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full bg-transparent text-[11px] text-fg outline-none placeholder:text-muted-fg/50"
          />
        </div>
        {selected.size > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary"
          >
            {selected.size} selected
          </motion.span>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="hidden grid-cols-[1.2fr_1.5fr_5rem_3rem] gap-4 border-b border-border bg-surface/50 px-4 py-2.5 text-[11px] font-medium text-muted-fg sm:grid">
          <div>Name</div><div>Email</div><div className="text-center">Status</div><div className="text-center">Lists</div>
        </div>
        {filtered.map((c, i) => (
          <button
            type="button"
            key={c.email}
            onClick={() => toggleSelect(i)}
            aria-label={`Select ${c.name}`}
            className={cn(
              "grid w-full cursor-pointer grid-cols-[1fr_auto] gap-2 border-b border-border/40 px-4 py-3 text-left text-[12px] transition-colors last:border-0 sm:grid-cols-[1.2fr_1.5fr_5rem_3rem] sm:gap-4",
              selected.has(i) ? "bg-primary/[0.04]" : "hover:bg-surface/50"
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold transition-colors",
                selected.has(i) ? "bg-primary text-white" : "bg-primary-soft text-primary"
              )}>
                {selected.has(i) ? "✓" : c.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <span className="font-medium text-fg">{c.name}</span>
            </div>
            <div className="hidden text-muted-fg sm:block">{c.email}</div>
            <div className="text-right sm:text-center">
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); toggleStatus(i); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); toggleStatus(i); } }}
                aria-label={`Toggle status for ${c.name}, currently ${c.status}`}
                className={cn(
                  "inline-block cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-medium transition-all hover:scale-105",
                  c.status === "valid" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
                  c.status === "pending" && "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
                  c.status === "invalid" && "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"
                )}
              >
                {c.status}
              </span>
            </div>
            <div className="hidden text-center text-muted-fg sm:block">{c.lists}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

const periodData = {
  "7d": {
    bars: [65, 72, 58, 80, 75, 88, 82],
    labels: ["Mar 23", "Mar 24", "Mar 25", "Mar 26", "Mar 27", "Mar 28", "Mar 29"],
    stats: { sent: "412", opens: "58.3%", clicks: "87", bounces: "0.2%" },
    multiplier: 4.12,
  },
  "30d": {
    bars: [28, 42, 38, 55, 50, 68, 62, 78, 72, 88, 82, 68, 75, 85, 80],
    labels: ["Mar 1", "Mar 3", "Mar 5", "Mar 7", "Mar 9", "Mar 11", "Mar 13", "Mar 15", "Mar 17", "Mar 19", "Mar 21", "Mar 23", "Mar 25", "Mar 27", "Mar 29"],
    stats: { sent: "2,847", opens: "51.2%", clicks: "328", bounces: "0.4%" },
    multiplier: 28.47,
  },
  "90d": {
    bars: [15, 22, 30, 28, 35, 42, 40, 48, 55, 52, 60, 58, 65, 62, 70, 68, 75, 72, 80, 85],
    labels: ["Jan", "Jan", "Jan", "Feb", "Feb", "Feb", "Feb", "Mar", "Mar", "Mar", "Mar", "Mar", "Mar", "Mar", "Mar", "Mar", "Mar", "Mar", "Mar", "Mar"],
    stats: { sent: "8,241", opens: "47.6%", clicks: "1,024", bounces: "0.6%" },
    multiplier: 82.41,
  },
};

function AnalyticsMockup() {
  const [period, setPeriod] = useState<keyof typeof periodData>("30d");
  const [hovered, setHovered] = useState<number | null>(null);
  const { bars, labels, stats, multiplier } = periodData[period];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Sent", value: stats.sent, color: "text-fg" },
          { label: "Opens", value: stats.opens, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Clicks", value: stats.clicks, color: "text-primary" },
          { label: "Bounces", value: stats.bounces, color: "text-fg" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-3 transition-all hover:shadow-sm">
            <div className="text-[10px] text-muted-fg">{s.label}</div>
            <motion.div
              key={s.value}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("mt-1 text-xl font-semibold", s.color)}
            >
              {s.value}
            </motion.div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[13px] font-medium text-fg">Opens over time</span>
          <div className="flex gap-0.5 rounded-lg border border-border p-0.5">
            {(["7d", "30d", "90d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => { setPeriod(p); setHovered(null); }}
                className={cn("rounded-md px-2.5 py-1 text-[10px] font-medium transition-all", p === period ? "bg-primary/10 text-primary" : "text-muted-fg hover:text-fg")}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="relative flex gap-[3px]" style={{ height: 128 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={period}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex w-full gap-[3px]"
              style={{ height: 128 }}
            >
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="relative flex flex-1 flex-col justify-end"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.4, delay: i * 0.02, ease: "easeOut" }}
                    className={cn(
                      "w-full rounded-t-sm transition-colors duration-150",
                      hovered === i
                        ? "bg-gradient-to-t from-primary/40 to-primary/20"
                        : "bg-gradient-to-t from-primary/25 to-primary/8"
                    )}
                  />
                  <AnimatePresence>
                    {hovered === i && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-fg px-2 py-1 text-[10px] font-medium text-surface shadow-lg"
                      >
                        {Math.round(h * multiplier / 100)} opens
                        <div className="mt-0.5 text-[8px] font-normal opacity-70">{labels[i]}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ── Feature data ─────────────────────────────────────────────── */

const primaryFeatures = [
  {
    tag: "Campaigns",
    title: "An editor that gets out of your way",
    description: "Drag-and-drop blocks, merge tags, and real-time preview. Toggle between edit and preview mode — try the buttons above.",
    mockup: <EditorMockup />,
  },
  {
    tag: "Contacts",
    title: "Clean lists, better deliverability",
    description: "Try searching, selecting rows, or clicking the status badges to cycle through validation states.",
    mockup: <ContactsMockup />,
    reversed: true,
  },
  {
    tag: "Analytics",
    title: "Know exactly what\u2019s working",
    description: "Hover the bars for details, switch time periods. Real-time tracking via AWS SNS and SQS.",
    mockup: <AnalyticsMockup />,
  },
];

const secondaryFeatures = [
  { icon: Cloud, title: "AWS SES", description: "Your credentials, your sending. Rate limiting and reputation management built in." },
  { icon: Sparkles, title: "AI Assistant", description: "Anthropic, OpenAI, or custom providers. Generate subject lines, copy, and more." },
  { icon: Shield, title: "CAN-SPAM & GDPR", description: "Compliant unsubscribe links injected automatically. Bounce suppression out of the box." },
  { icon: HardDrive, title: "No Database", description: "Portable JSON files. Back up by copying a folder. Zero configuration." },
];

/* ── Component ────────────────────────────────────────────────── */

export function Features() {
  return (
    <section id="features" className="relative">
      <div className="px-6 pb-6 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-xl text-center"
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-primary">
            Features
          </span>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-fg md:text-5xl">
            Everything you need.
            <br />
            <span className="text-muted-fg">Nothing you don&apos;t.</span>
          </h2>
        </motion.div>
      </div>

      {primaryFeatures.map((feature, i) => (
        <div key={i} className="px-6 py-14">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className={cn(
              "mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16",
              feature.reversed && "md:[&>*:first-child]:order-2"
            )}
          >
            <div>
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-primary">
                {feature.tag}
              </span>
              <h3 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-fg md:text-[2.5rem]">
                {feature.title}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-muted-fg md:text-[17px]">
                {feature.description}
              </p>
            </div>
            <div
              className="rounded-2xl border border-border/80 bg-card p-5 md:p-6"
              style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.03), 0 8px 16px rgba(0,0,0,0.04)" }}
            >
              {feature.mockup}
            </div>
          </motion.div>
        </div>
      ))}

      <div className="px-6 pb-16 pt-6">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {secondaryFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft/60">
                <f.icon className="h-[18px] w-[18px] text-primary" strokeWidth={1.5} />
              </div>
              <h4 className="text-[15px] font-semibold text-fg">{f.title}</h4>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-fg">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
