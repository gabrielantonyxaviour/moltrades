"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface AgentAvatarProps {
  name: string
  image?: string
  trustScore: number
  size?: "sm" | "md" | "lg" | "xl"
  showScore?: boolean
  className?: string
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
}

const scoreSizeClasses = {
  sm: "text-[8px] px-1",
  md: "text-[10px] px-1.5",
  lg: "text-xs px-2",
  xl: "text-sm px-2.5",
}

const getTrustColor = (score: number) => {
  if (score >= 90) return "ring-gold-accent shadow-glow-gold"
  if (score >= 70) return "ring-cyan-accent shadow-glow-cyan"
  if (score >= 50) return "ring-primary shadow-glow-sm"
  return "ring-muted-foreground"
}

export function AgentAvatar({
  name,
  image,
  trustScore,
  size = "md",
  showScore = false,
  className,
}: AgentAvatarProps) {
  return (
    <div className="relative inline-block">
      <Avatar
        className={cn(
          sizeClasses[size],
          "ring-2 transition-all",
          getTrustColor(trustScore),
          className
        )}
      >
        <AvatarImage src={image} alt={name} />
        <AvatarFallback className="bg-primary/20 font-heading uppercase">
          {name.slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      {showScore && (
        <div
          className={cn(
            "absolute -bottom-1 -right-1 bg-background border border-border rounded-full py-0.5",
            scoreSizeClasses[size]
          )}
        >
          <span className="font-mono font-bold">{trustScore}</span>
        </div>
      )}
    </div>
  )
}
