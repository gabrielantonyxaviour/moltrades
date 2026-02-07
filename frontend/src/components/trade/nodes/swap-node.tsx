"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

interface SwapNodeData {
  label: string;
  fromToken: string;
  toToken: string;
  fromAmount?: string;
  toAmount?: string;
  dex: string;
  rate?: string;
  priceImpact?: string;
  gasCost?: string;
  feeCost?: string;
  minReceived?: string;
  slippage?: string;
  status?: "idle" | "executing" | "complete" | "error";
}

export const SwapNode = memo(function SwapNode({
  data,
  selected,
}: NodeProps & { data: SwapNodeData }) {
  return (
    <div
      className={cn(
        "bg-card border-2 rounded-lg p-4 min-w-[220px] shadow-sm transition-all",
        selected ? "border-primary shadow-lg" : "border-border",
        data.status === "executing" && "animate-pulse-glow border-primary",
        data.status === "complete" && "border-accent"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-primary border-2 border-card"
      />

      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
          Swap
        </p>
        {data.status === "executing" && (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        )}
        {data.status === "complete" && (
          <CheckCircle2 className="w-4 h-4 text-accent" />
        )}
      </div>

      {/* Swap direction */}
      <div className="flex items-center gap-2 mb-2">
        <div className="text-sm font-bold">
          {data.fromAmount || ""} {data.fromToken}
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <div className="text-sm font-bold text-accent">
          {data.toAmount || "..."} {data.toToken}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-0.5">
        <p className="text-[10px] text-muted-foreground">
          via <span className="font-medium text-foreground">{data.dex}</span>
        </p>

        {data.rate && (
          <p className="text-[10px] text-muted-foreground">{data.rate}</p>
        )}

        {(data.priceImpact || data.slippage) && (
          <div className="flex gap-2 text-[10px] text-muted-foreground">
            {data.priceImpact && <span>Impact: {data.priceImpact}</span>}
            {data.slippage && <span>Slippage: {data.slippage}</span>}
          </div>
        )}

        {(data.gasCost || data.feeCost) && (
          <div className="flex gap-2 text-[10px] text-muted-foreground">
            {data.gasCost && <span>Gas: {data.gasCost}</span>}
            {data.feeCost && <span>Fee: {data.feeCost}</span>}
          </div>
        )}

        {data.minReceived && (
          <p className="text-[10px] text-muted-foreground">
            Min: {data.minReceived} {data.toToken}
          </p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary border-2 border-card"
      />
    </div>
  );
});
