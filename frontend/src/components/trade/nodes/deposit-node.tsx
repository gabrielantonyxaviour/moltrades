"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Landmark, Loader2, CheckCircle2 } from "lucide-react";

interface DepositNodeData {
  label: string;
  protocol: string;
  token: string;
  amount?: string;
  apy?: string;
  receiveToken?: string;
  status?: "idle" | "executing" | "complete" | "error";
}

export const DepositNode = memo(function DepositNode({
  data,
  selected,
}: NodeProps & { data: DepositNodeData }) {
  return (
    <div
      className={cn(
        "bg-card border-2 rounded-lg p-4 min-w-[200px] shadow-sm transition-all",
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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
            <Landmark className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Deposit</p>
            <p className="text-sm font-bold">{data.label}</p>
          </div>
        </div>
        {data.status === "executing" && (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        )}
        {data.status === "complete" && (
          <CheckCircle2 className="w-4 h-4 text-accent" />
        )}
      </div>

      <div className="bg-secondary rounded-md p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">{data.amount} {data.token}</span>
        </div>
        {data.apy && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">APY</span>
            <span className="text-sm font-bold text-accent">{data.apy}</span>
          </div>
        )}
      </div>

      {data.receiveToken && (
        <p className="text-xs text-muted-foreground mt-2">
          Receive: {data.receiveToken}
        </p>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary border-2 border-card"
      />
    </div>
  );
});
