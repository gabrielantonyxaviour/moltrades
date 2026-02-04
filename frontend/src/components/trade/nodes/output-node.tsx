"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Flag, CheckCircle2 } from "lucide-react";

interface OutputNodeData {
  label: string;
  token: string;
  amount?: string;
  usdValue?: string;
  chain: string;
  status?: "idle" | "executing" | "complete" | "error";
}

export const OutputNode = memo(function OutputNode({
  data,
  selected,
}: NodeProps & { data: OutputNodeData }) {
  return (
    <div
      className={cn(
        "bg-card border-2 rounded-lg p-4 min-w-[200px] shadow-sm transition-all",
        selected ? "border-primary shadow-lg" : "border-border",
        data.status === "complete" && "border-accent bg-accent/5"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-primary border-2 border-card"
      />

      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
          {data.status === "complete" ? (
            <CheckCircle2 className="w-4 h-4 text-accent" />
          ) : (
            <Flag className="w-4 h-4 text-accent" />
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Output</p>
          <p className="text-sm font-bold">{data.label}</p>
        </div>
      </div>

      <div className="bg-secondary rounded-md p-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">{data.amount} {data.token}</span>
        </div>
        {data.usdValue && (
          <p className="text-xs text-muted-foreground">≈ ${data.usdValue}</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-2">on {data.chain}</p>
    </div>
  );
});
