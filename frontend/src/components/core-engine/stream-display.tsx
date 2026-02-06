"use client";

import type { LiveStreamState } from "@/lib/core-engine/types";

interface StreamDisplayProps {
  liveState: LiveStreamState;
}

export function StreamDisplay({ liveState }: StreamDisplayProps) {
  const { currentThinking, currentText, currentToolName, isStreaming } =
    liveState;

  if (!isStreaming) return null;

  return (
    <div className="space-y-2">
      {currentThinking && (
        <div className="border-l-2 border-blue-500/50 pl-3 animate-pulse">
          <div className="text-xs text-blue-400 italic mb-1">Thinking...</div>
          <div className="text-xs text-muted-foreground whitespace-pre-wrap max-h-20 overflow-hidden">
            {currentThinking.slice(-300)}
          </div>
        </div>
      )}

      {currentText && (
        <div className="text-sm text-foreground whitespace-pre-wrap">
          {currentText}
          <span className="animate-pulse text-primary">|</span>
        </div>
      )}

      {currentToolName && (
        <div className="border-l-2 border-yellow-500/50 pl-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs text-yellow-400">{currentToolName}</span>
            <span className="text-xs text-muted-foreground">executing...</span>
          </div>
        </div>
      )}

      {isStreaming &&
        !currentThinking &&
        !currentText &&
        !currentToolName && (
          <div className="text-xs text-muted-foreground animate-pulse">
            Connecting...
          </div>
        )}
    </div>
  );
}
