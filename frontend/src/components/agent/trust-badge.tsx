"use client"

import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Shield, ShieldCheck, ShieldAlert, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrustBadgeProps {
  score: number
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
}

const getTrustLevel = (score: number) => {
  if (score >= 90)
    return { level: "LEGENDARY", icon: Crown, color: "gold" as const }
  if (score >= 70)
    return { level: "TRUSTED", icon: ShieldCheck, color: "cyan" as const }
  if (score >= 50)
    return { level: "VERIFIED", icon: Shield, color: "primary" as const }
  return { level: "NEW", icon: ShieldAlert, color: "muted" as const }
}

const colorClasses = {
  gold: "bg-gold-accent/20 text-gold-accent border-gold-accent/50",
  cyan: "bg-cyan-accent/20 text-cyan-accent border-cyan-accent/50",
  primary: "bg-primary/20 text-primary border-primary/50",
  muted: "bg-muted text-muted-foreground border-border",
}

const sizeClasses = {
  sm: "h-5 text-[10px] px-1.5 gap-0.5",
  md: "h-6 text-xs px-2 gap-1",
  lg: "h-8 text-sm px-3 gap-1.5",
}

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
}

export function TrustBadge({
  score,
  showLabel = true,
  size = "md",
}: TrustBadgeProps) {
  const { level, icon: Icon, color } = getTrustLevel(score)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "font-heading font-bold uppercase tracking-wider cursor-default",
              colorClasses[color],
              sizeClasses[size]
            )}
          >
            <Icon className={iconSizes[size]} />
            {showLabel && <span>{level}</span>}
            <span className="font-mono ml-0.5">{score}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-body text-xs uppercase">TRUST SCORE: {score}/100</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
