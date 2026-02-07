"use client";

import { cn } from "@/lib/utils";
import { Play, Loader2, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";

export type PhaseStatus =
  | "idle"
  | "quoting"
  | "executing"
  | "bridging"
  | "complete"
  | "error";

export type OverallStatus = "idle" | "in_progress" | "complete" | "error";

interface ExecuteButtonProps {
  totalPhases: number;
  currentPhase: number;
  phaseStatus: PhaseStatus;
  overallStatus: OverallStatus;
  error?: string;
  onExecute: () => void;
  disabled?: boolean;
}

export function ExecuteButton({
  totalPhases,
  currentPhase,
  phaseStatus,
  overallStatus,
  error,
  onExecute,
  disabled,
}: ExecuteButtonProps) {
  const isMultiPhase = totalPhases > 1;
  const isExecuting =
    phaseStatus === "quoting" ||
    phaseStatus === "executing" ||
    phaseStatus === "bridging";
  const isComplete = overallStatus === "complete";
  const isError = phaseStatus === "error";

  function getLabel(): string {
    if (isComplete) return "Completed";

    if (isError) {
      return isMultiPhase ? `Retry Phase ${currentPhase}` : "Retry";
    }

    if (phaseStatus === "quoting") return "Getting quote...";
    if (phaseStatus === "executing") {
      return isMultiPhase
        ? `Executing Phase ${currentPhase}...`
        : "Executing...";
    }
    if (phaseStatus === "bridging") {
      return isMultiPhase
        ? `Bridging (Phase ${currentPhase})...`
        : "Bridging...";
    }

    if (isMultiPhase) {
      return `Execute Phase ${currentPhase}`;
    }

    return "Execute Plan";
  }

  function getIcon() {
    if (isComplete) return <CheckCircle2 className="w-4 h-4" />;
    if (isError) return <RotateCcw className="w-4 h-4" />;
    if (isExecuting) return <Loader2 className="w-4 h-4 animate-spin" />;
    return <Play className="w-4 h-4" />;
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {/* Phase progress dots for multi-phase */}
      {isMultiPhase && (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalPhases }, (_, i) => {
            const phaseNum = i + 1;
            const isDone = phaseNum < currentPhase || overallStatus === "complete";
            const isCurrent = phaseNum === currentPhase && overallStatus !== "complete";
            return (
              <div
                key={phaseNum}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  isDone && "bg-accent",
                  isCurrent && isExecuting && "bg-primary animate-pulse",
                  isCurrent && !isExecuting && "bg-primary",
                  !isDone && !isCurrent && "bg-muted-foreground/30"
                )}
              />
            );
          })}
        </div>
      )}

      <button
        onClick={onExecute}
        disabled={disabled || isExecuting || isComplete}
        className={cn(
          "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium",
          "shadow-lg transition-all",
          isComplete &&
            "bg-accent text-accent-foreground cursor-default",
          isError &&
            "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          isExecuting &&
            "bg-primary/80 text-primary-foreground cursor-wait",
          !isComplete &&
            !isError &&
            !isExecuting &&
            "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-xl active:scale-95",
          (disabled || isExecuting || isComplete) && "opacity-80"
        )}
      >
        {getIcon()}
        {getLabel()}
      </button>

      {/* Error message */}
      {isError && error && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 max-w-xs">
          <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
          <p className="text-[10px] text-destructive truncate">{error}</p>
        </div>
      )}
    </div>
  );
}
