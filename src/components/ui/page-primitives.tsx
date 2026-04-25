import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.2em] text-gold mb-2 font-medium">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  trend,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  trend?: "up" | "down" | "flat";
  hint?: string;
  accent?: "navy" | "gold" | "success" | "warning" | "destructive" | "info";
}) {
  const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div className="relative rounded-xl border border-border bg-card p-5 overflow-hidden group hover:border-gold/40 transition-colors">
      {accent && (
        <span
          className={cn(
            "absolute top-0 left-0 right-0 h-0.5",
            accent === "navy" && "bg-navy",
            accent === "gold" && "bg-gold",
            accent === "success" && "bg-success",
            accent === "warning" && "bg-warning",
            accent === "destructive" && "bg-destructive",
            accent === "info" && "bg-info",
          )}
        />
      )}
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-display font-semibold tracking-tight text-foreground">
          {value}
        </span>
        {delta && trend && (
          <span className={cn("text-xs font-medium flex items-center gap-0.5", trendColor)}>
            <TrendIcon className="size-3" />
            {delta}
          </span>
        )}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card", className)}>
      {(title || actions) && (
        <header className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="font-display font-semibold text-base text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PriorityBadge({ level }: { level: "info" | "warning" | "critical" | "success" }) {
  const cls = {
    info: "bg-info/10 text-info border-info/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    critical: "bg-destructive/10 text-destructive border-destructive/30",
    success: "bg-success/10 text-success border-success/30",
  }[level];
  const label = { info: "Info", warning: "Attention", critical: "Critique", success: "OK" }[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium border",
        cls,
      )}
    >
      <span className="size-1 rounded-full bg-current" />
      {label}
    </span>
  );
}
