"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";

interface TokenInputNodeData {
  label: string;
  token: string;
  amount: string;
  chain: string;
  usdValue?: string;
  status?: "idle" | "executing" | "complete" | "error";
}

export const TokenInputNode = memo(function TokenInputNode({
  data,
  selected,
}: NodeProps & { data: TokenInputNodeData }) {
  return (
    <div
      className={cn(
        "bg-card border-2 rounded-lg p-4 min-w-[200px] shadow-sm transition-all",
        selected ? "border-primary shadow-lg" : "border-border",
        data.status === "executing" && "animate-pulse-glow border-primary",
        data.status === "complete" && "border-accent"
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Input</p>
          <p className="text-sm font-bold">{data.label}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="bg-secondary rounded-md p-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">{data.amount} {data.token}</span>
          </div>
          {data.usdValue && (
            <p className="text-xs text-muted-foreground">≈ ${data.usdValue}</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">on {data.chain}</p>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary border-2 border-card"
      />
    </div>
  );
});
