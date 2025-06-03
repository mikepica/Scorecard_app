import { Beaker, Users, Microscope, Rocket } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface PillarIconProps {
  type: "magenta" | "light-blue" | "lime" | "gold";
  className?: string;
}

const pillarIcons = {
  magenta: Rocket,
  "light-blue": Beaker,
  lime: Users,
  gold: Microscope,
};

const pillarColors = {
  magenta: "text-pillar-magenta",
  "light-blue": "text-pillar-light-blue",
  lime: "text-pillar-lime",
  gold: "text-pillar-gold",
};

export function PillarIcon({ type, className }: PillarIconProps) {
  const Icon = pillarIcons[type] || Beaker;
  
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Icon className={cn("w-full h-full", pillarColors[type])} />
    </div>
  );
} 