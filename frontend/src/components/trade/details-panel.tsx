"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Settings,
  Fuel,
  Timer,
  Loader2,
} from "lucide-react";
import { Node } from "@xyflow/react";
import { cn } from "@/lib/utils";

interface NodeData {
  label?: string;
  status?: "idle" | "executing" | "complete" | "error";
  details?: Record<string, string | number | boolean>;
  [key: string]: unknown;
}

interface ExecutionState {
  status: "idle" | "executing" | "complete" | "error";
  currentStepId: string | null;
  logs: { timestamp: Date; message: string; type: "info" | "success" | "error" }[];
}

interface DetailsPanelProps {
  selectedNode: Node<NodeData> | null;
  executionState: ExecutionState;
  onExecute: () => void;
  hasFlow: boolean;
}

export function DetailsPanel({
  selectedNode,
  executionState,
  onExecute,
  hasFlow,
}: DetailsPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-bold text-sm">Details</h2>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Route Summary */}
        {hasFlow && (
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-semibold text-muted-foreground mb-3">
              Route Summary
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Timer className="w-4 h-4" />
                  <span>Est. Time</span>
                </div>
                <span className="font-medium">~3 min</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Fuel className="w-4 h-4" />
                  <span>Gas Cost</span>
                </div>
                <span className="font-medium">~$2.50</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-semibold text-muted-foreground mb-3">
              Selected Step
            </h3>
            <div className="bg-secondary rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{selectedNode.data?.label}</span>
                <Badge
                  variant={
                    selectedNode.data?.status === "complete"
                      ? "default"
                      : selectedNode.data?.status === "executing"
                      ? "outline"
                      : "secondary"
                  }
                  className={cn(
                    selectedNode.data?.status === "complete" && "bg-accent text-accent-foreground"
                  )}
                >
                  {selectedNode.data?.status || "pending"}
                </Badge>
              </div>
              {selectedNode.data?.details && (
                <div className="text-xs text-muted-foreground space-y-1">
                  {Object.entries(selectedNode.data.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key}:</span>
                      <span className="font-mono">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Execution Log */}
        {executionState.logs.length > 0 && (
          <div className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground mb-3">
              Execution Log
            </h3>
            <div className="space-y-2">
              {executionState.logs.map((log, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-2 text-xs",
                    log.type === "success" && "text-accent",
                    log.type === "error" && "text-destructive"
                  )}
                >
                  {log.type === "success" ? (
                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  ) : log.type === "error" ? (
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Clock className="w-3 h-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <span className="text-muted-foreground">
                      {log.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <span className="ml-2">{log.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Execute Button */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={onExecute}
          disabled={!hasFlow || executionState.status === "executing"}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
          size="lg"
        >
          {executionState.status === "executing" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Executing...
            </>
          ) : executionState.status === "complete" ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Completed
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Execute Trade
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
