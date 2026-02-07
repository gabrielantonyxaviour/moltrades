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
  fromToken?: string;
  toToken?: string;
  fromAmount?: string;
  toAmount?: string;
  gasCost?: string;
  slippage?: string;
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
          <div className="flex flex-col items-center gap-1">
            <Image
              src={data.fromChainLogo}
              alt={data.fromChain}
              width={20}
              height={20}
              className="rounded-full"
            />
            <span className="text-[9px] text-muted-foreground">{data.fromChain}</span>
          </div>
        ) : (
          <span className="text-xs font-bold">{data.fromChain}</span>
        )}
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        {data.toChainLogo ? (
          <div className="flex flex-col items-center gap-1">
            <Image
              src={data.toChainLogo}
              alt={data.toChain}
              width={20}
              height={20}
              className="rounded-full"
            />
            <span className="text-[9px] text-muted-foreground">{data.toChain}</span>
          </div>
        ) : (
          <span className="text-xs font-bold">{data.toChain}</span>
        )}
      </div>

      {/* Token amounts */}
      {(data.fromAmount || data.toAmount) && (
        <div className="mt-2 text-xs">
          {data.fromAmount && (
            <p className="font-medium">
              {data.fromAmount} {data.fromToken || ""}
            </p>
          )}
          {data.toAmount && (
            <p className="text-muted-foreground">
              &rarr; {data.toAmount} {data.toToken || ""}
            </p>
          )}
        </div>
      )}

      {/* Details */}
      <div className="mt-2 space-y-0.5">
        <p className="text-[10px] text-muted-foreground">
          via <span className="font-medium text-foreground">{data.provider}</span>
          {data.estimatedTime && <span> &middot; {data.estimatedTime}</span>}
        </p>

        {(data.fee || data.gasCost) && (
          <div className="flex gap-2 text-[10px] text-muted-foreground">
            {data.fee && <span>Fee: {data.fee}</span>}
            {data.gasCost && <span>Gas: {data.gasCost}</span>}
          </div>
        )}

        {data.slippage && (
          <p className="text-[10px] text-muted-foreground">
            Slippage: {data.slippage}
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
