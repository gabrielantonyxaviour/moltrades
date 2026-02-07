"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2 } from "lucide-react";

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

      <p className="text-sm font-bold mb-2">
        {data.fromAmount || ""} {data.fromToken} → {data.toAmount || ""}{" "}
        {data.toToken}
      </p>

      <p className="text-xs text-muted-foreground">via {data.dex}</p>

      {data.rate && (
        <p className="text-xs text-muted-foreground mt-1">{data.rate}</p>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary border-2 border-card"
      />
    </div>
  );
});
