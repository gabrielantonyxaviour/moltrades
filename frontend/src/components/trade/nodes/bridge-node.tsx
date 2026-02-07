"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import Image from "next/image";

interface BridgeNodeData {
  label: string;
  fromChain: string;
  toChain: string;
  fromChainLogo?: string;
  toChainLogo?: string;
  provider: string;
  estimatedTime?: string;
  fee?: string;
  status?: "idle" | "executing" | "complete" | "error";
}

export const BridgeNode = memo(function BridgeNode({
  data,
  selected,
}: NodeProps & { data: BridgeNodeData }) {
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
          Bridge
        </p>
        {data.status === "executing" && (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        )}
        {data.status === "complete" && (
          <CheckCircle2 className="w-4 h-4 text-accent" />
        )}
      </div>

      <div className="flex items-center justify-center gap-3 py-3 bg-secondary rounded-md">
        {data.fromChainLogo ? (
          <Image
            src={data.fromChainLogo}
            alt={data.fromChain}
            width={20}
            height={20}
            className="rounded-full"
          />
        ) : (
          <span className="text-xs font-bold">{data.fromChain}</span>
        )}
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        {data.toChainLogo ? (
          <Image
            src={data.toChainLogo}
            alt={data.toChain}
            width={20}
            height={20}
            className="rounded-full"
          />
        ) : (
          <span className="text-xs font-bold">{data.toChain}</span>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        via {data.provider}
        {data.estimatedTime && <span> · {data.estimatedTime}</span>}
      </p>

      {data.fee && (
        <p className="text-xs text-muted-foreground mt-1">Fee: {data.fee}</p>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary border-2 border-card"
      />
    </div>
  );
});
