"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

interface OutputNodeData {
  label: string;
  token: string;
  amount?: string;
  usdValue?: string;
  chain: string;
  chainLogo?: string;
  gasCost?: string;
  totalFees?: string;
  minReceived?: string;
  estimatedTime?: string;
  slippage?: string;
  status?: "idle" | "pending" | "executing" | "complete" | "error";
}

export const OutputNode = memo(function OutputNode({
  data,
  selected,
}: NodeProps & { data: OutputNodeData }) {
  return (
    <div
      className={cn(
        "border-2 rounded-lg min-w-[200px] shadow-sm transition-all overflow-hidden",
        selected ? "border-primary shadow-lg" : "border-accent/50",
        data.status === "complete" && "border-accent"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-primary border-2 border-card"
      />

      {/* Header band */}
      <div className="bg-accent/10 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
          <span className="text-[10px] font-bold text-accent uppercase tracking-wide">
            Estimated Output
          </span>
        </div>
        {data.chainLogo && (
          <div className="flex items-center gap-1">
            <Image
              src={data.chainLogo}
              alt={data.chain}
              width={14}
              height={14}
              className="rounded-full"
            />
            <span className="text-[10px] text-muted-foreground">{data.chain}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="bg-card px-4 py-3">
        <p className="text-lg font-bold">
          {data.amount || "..."} {data.token}
        </p>
        {data.usdValue && (
          <p className="text-xs text-muted-foreground">{data.usdValue}</p>
        )}

        {/* Details grid */}
        {(data.minReceived || data.gasCost || data.totalFees || data.estimatedTime) && (
          <div className="mt-3 pt-2 border-t border-border space-y-1">
            {data.minReceived && (
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Min received</span>
                <span className="font-medium">{data.minReceived}</span>
              </div>
            )}
            {data.gasCost && (
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Gas cost</span>
                <span className="font-medium">{data.gasCost}</span>
              </div>
            )}
            {data.totalFees && (
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Fees</span>
                <span className="font-medium">{data.totalFees}</span>
              </div>
            )}
            {data.estimatedTime && (
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Est. time</span>
                <span className="font-medium">{data.estimatedTime}</span>
              </div>
            )}
            {data.slippage && (
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Slippage</span>
                <span className="font-medium">{data.slippage}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
