import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "emerald" | "blue" | "amber" | "purple";
  className?: string;
}

const variantStyles = {
  default: {
    iconBg: "bg-secondary",
    iconColor: "text-foreground",
  },
  emerald: {
    iconBg: "bg-credora-emerald-light",
    iconColor: "text-credora-emerald",
  },
  blue: {
    iconBg: "bg-credora-blue-light",
    iconColor: "text-credora-blue",
  },
  amber: {
    iconBg: "bg-credora-amber-light",
    iconColor: "text-credora-amber",
  },
  purple: {
    iconBg: "bg-credora-purple-light",
    iconColor: "text-credora-purple",
  },
};

export function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "stat-card group",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
            styles.iconBg
          )}
        >
          <Icon className={cn("w-6 h-6", styles.iconColor)} />
        </div>
        {trend && (
          <div
            className={cn(
              "text-sm font-medium px-2 py-1 rounded-lg",
              trend.isPositive
                ? "bg-credora-emerald-light text-credora-emerald"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {subValue && (
          <p className="text-muted-foreground text-sm">{subValue}</p>
        )}
      </div>
    </motion.div>
  );
}
