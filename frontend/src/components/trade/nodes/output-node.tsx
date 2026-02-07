"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface OutputNodeData {
  label: string;
  token: string;
  amount?: string;
  usdValue?: string;
  chain: string;
  chainLogo?: string;
  gasCost?: string;
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
        data.status === "complete" && "border-accent"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-primary border-2 border-card"
      />

      <div className="flex items-center gap-1.5 mb-3">
        {data.chainLogo && (
          <Image
            src={data.chainLogo}
            alt={data.chain}
            width={16}
            height={16}
            className="rounded-full"
          />
        )}
        <span className="text-xs text-muted-foreground">{data.chain}</span>
      </div>

      <div className="space-y-1">
        <p className="text-lg font-bold">
          {data.amount} {data.token}
        </p>
        {data.usdValue && (
          <p className="text-xs text-muted-foreground">{data.usdValue}</p>
        )}
      </div>

      {data.gasCost && (
        <p className="text-xs text-muted-foreground mt-3">
          Gas: {data.gasCost}
        </p>
      )}
    </div>
  );
});
