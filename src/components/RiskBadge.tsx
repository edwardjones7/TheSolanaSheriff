import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level: "low" | "medium" | "high";
  size?: "sm" | "md" | "lg";
}

const config = {
  low: {
    label: "Low Risk",
    icon: ShieldCheck,
    classes:
      "bg-green-500/15 text-green-400 border-green-500/30",
    iconClass: "text-green-400",
  },
  medium: {
    label: "Medium Risk",
    icon: ShieldAlert,
    classes:
      "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    iconClass: "text-yellow-400",
  },
  high: {
    label: "High Risk",
    icon: ShieldX,
    classes:
      "bg-red-500/15 text-red-400 border-red-500/30",
    iconClass: "text-red-400",
  },
};

const sizeClasses = {
  sm: "px-2.5 py-1 text-xs gap-1.5",
  md: "px-3.5 py-1.5 text-sm gap-2",
  lg: "px-4 py-2 text-base gap-2.5",
};

const iconSizes = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export default function RiskBadge({
  level,
  size = "md",
}: RiskBadgeProps) {
  const { label, icon: Icon, classes, iconClass } = config[level];

  return (
    <span
      className={cn(
        "inline-flex items-center border rounded-full font-semibold",
        classes,
        sizeClasses[size]
      )}
    >
      <Icon className={cn(iconSizes[size], iconClass)} strokeWidth={2} />
      {label}
    </span>
  );
}
