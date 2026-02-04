"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { ArrowDownUp, Loader2, CheckCircle2 } from "lucide-react";

interface SwapNodeData {
  label: string;
  fromToken: string;
  toToken: string;
  fromAmount?: string;
  toAmount?: string;
  dex: string;
  rate?: string;
  priceImpact?: string;
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
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Swap</p>
          <p className="text-sm font-bold">{data.label}</p>
        </div>
        {data.status === "executing" && (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        )}
        {data.status === "complete" && (
          <CheckCircle2 className="w-4 h-4 text-accent" />
        )}
      </div>

      <div className="bg-secondary rounded-md p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">{data.fromAmount || ""} {data.fromToken}</span>
        </div>
        <div className="flex justify-center">
          <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">{data.toAmount || ""} {data.toToken}</span>
        </div>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>via {data.dex}</span>
        </div>
        {data.rate && (
          <p className="mt-1">Rate: {data.rate}</p>
        )}
        {data.priceImpact && (
          <p>Impact: {data.priceImpact}</p>
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
