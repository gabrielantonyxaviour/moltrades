"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2 } from "lucide-react";
import Image from "next/image";

interface DepositNodeData {
  label: string;
  protocol: string;
  protocolLogo?: string;
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
          {data.protocolLogo && (
            <Image
              src={data.protocolLogo}
              alt={data.protocol}
              width={20}
              height={20}
              className="rounded-full"
            />
          )}
          <span className="text-sm font-bold">{data.protocol}</span>
        </div>
        {data.status === "executing" && (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        )}
        {data.status === "complete" && (
          <CheckCircle2 className="w-4 h-4 text-accent" />
        )}
      </div>

      <p className="text-sm">
        Supply {data.amount} {data.token}
      </p>

      {data.receiveToken && (
        <p className="text-xs text-muted-foreground mt-1">
          → Receive {data.receiveToken}
        </p>
      )}

      {data.apy && (
        <p className="text-xs text-accent font-bold mt-1">APY {data.apy}</p>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary border-2 border-card"
      />
    </div>
  );
});
