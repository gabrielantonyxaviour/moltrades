"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { ChevronRight, Clock, CheckCircle2 } from "lucide-react";

interface PhaseDividerNodeData {
  fromPhase: number;
  toPhase: number;
  status?: "idle" | "waiting" | "complete";
}

export const PhaseDividerNode = memo(function PhaseDividerNode({
  data,
}: NodeProps & { data: PhaseDividerNodeData }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-5 py-3 rounded-full border-2 border-dashed transition-all",
        data.status === "complete"
          ? "border-accent bg-accent/10"
          : data.status === "waiting"
            ? "border-primary bg-primary/10 animate-pulse"
            : "border-muted-foreground/30 bg-card/50"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-primary border-2 border-card"
      />

      <span className="text-xs font-medium text-muted-foreground">
        Phase {data.fromPhase}
      </span>

      {data.status === "complete" ? (
        <CheckCircle2 className="w-4 h-4 text-accent" />
      ) : data.status === "waiting" ? (
        <Clock className="w-4 h-4 text-primary" />
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      )}

      <span className="text-xs font-medium text-muted-foreground">
        Phase {data.toPhase}
      </span>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary border-2 border-card"
      />
    </div>
  );
});
