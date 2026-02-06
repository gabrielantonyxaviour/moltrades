"use client"

import Link from "next/link"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ExternalLink,
} from "lucide-react"
import { AgentAvatar } from "./agent-avatar"
import { TrustBadge } from "./trust-badge"
import { cn } from "@/lib/utils"

interface Trade {
  type: "BUY" | "SELL"
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  chain: string
  txHash?: string
}

interface PostCardProps {
  agent: {
    name: string
    handle: string
    avatar?: string
    trustScore: number
  }
  content: string
  trade?: Trade
  timestamp: string
  metrics: {
    likes: number
    comments: number
    copies: number
  }
  isLiked?: boolean
}

export function PostCard({
  agent,
  content,
  trade,
  timestamp,
  metrics,
  isLiked = false,
}: PostCardProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-200 group">
      <CardHeader className="flex flex-row items-start gap-4 pb-3">
        {/* Agent Avatar with Trust Ring */}
        <Link href={`/agent/${agent.handle.slice(1)}`}>
          <AgentAvatar
            name={agent.name}
            image={agent.avatar}
            trustScore={agent.trustScore}
            showScore
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/agent/${agent.handle.slice(1)}`}
              className="font-heading text-sm font-bold uppercase tracking-wide hover:text-primary transition-colors"
            >
              {agent.name}
            </Link>
            <span className="text-muted-foreground text-xs uppercase">
              {agent.handle}
            </span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-muted-foreground text-xs uppercase">
              {timestamp}
            </span>
          </div>
          <p className="text-sm text-foreground/90 mt-2 uppercase tracking-wide leading-relaxed">
            {content}
          </p>
        </div>
      </CardHeader>

      {/* Trade Execution Card */}
      {trade && (
        <CardContent className="pt-0 pb-3">
          <div
            className={cn(
              "rounded-lg p-4 border",
              trade.type === "BUY"
                ? "bg-cyan-accent/10 border-cyan-accent/30"
                : "bg-crimson-warning/10 border-crimson-warning/30"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {trade.type === "BUY" ? (
                  <TrendingUp className="h-5 w-5 text-cyan-accent" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-crimson-warning" />
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    "font-heading text-xs uppercase",
                    trade.type === "BUY"
                      ? "border-cyan-accent text-cyan-accent"
                      : "border-crimson-warning text-crimson-warning"
                  )}
                >
                  {trade.type}
                </Badge>
              </div>
              <Badge
                variant="secondary"
                className="font-mono text-xs uppercase"
              >
                {trade.chain}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  FROM
                </p>
                <p className="font-mono text-lg font-bold">{trade.amountIn}</p>
                <p className="text-sm text-muted-foreground uppercase">
                  {trade.tokenIn}
                </p>
              </div>

              <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />

              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  TO
                </p>
                <p className="font-mono text-lg font-bold">{trade.amountOut}</p>
                <p className="text-sm text-muted-foreground uppercase">
                  {trade.tokenOut}
                </p>
              </div>
            </div>

            {trade.txHash && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <a
                  href={`https://etherscan.io/tx/${trade.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors uppercase"
                >
                  <span className="font-mono">
                    TX: {trade.txHash.slice(0, 8)}...{trade.txHash.slice(-6)}
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </CardContent>
      )}

      {/* Action Buttons */}
      <CardFooter className="pt-0 border-t border-border/50">
        <div className="flex items-center gap-2 sm:gap-6 w-full pt-3">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1.5 text-muted-foreground hover:text-primary",
              isLiked && "text-crimson-warning"
            )}
          >
            <Heart
              className={cn("h-4 w-4", isLiked && "fill-crimson-warning")}
            />
            <span className="font-mono text-xs">{metrics.likes}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-primary"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="font-mono text-xs">{metrics.comments}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-cyan-accent"
          >
            <Repeat2 className="h-4 w-4" />
            <span className="font-heading text-xs uppercase hidden sm:inline">
              COPY TRADE
            </span>
            <span className="font-mono text-xs sm:hidden">{metrics.copies}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-primary ml-auto"
          >
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

