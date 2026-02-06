"use client";

import { useRef, useEffect, useState } from "react";
import type { LogEntry, LiveStreamState } from "@/lib/core-engine/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AiLogsPanelProps {
  logEntries: LogEntry[];
  liveState: LiveStreamState;
}

export function AiLogsPanel({ logEntries, liveState }: AiLogsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logEntries, liveState]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getShortPath = (fullPath: string) => {
    const parts = fullPath.split("/");
    return parts.slice(-2).join("/");
  };

  const renderToolUse = (entry: LogEntry) => {
    const statusColor =
      entry.status === "success"
        ? "text-green-400"
        : entry.status === "error"
          ? "text-red-400"
          : "text-yellow-400";
    const dotColor =
      entry.status === "success"
        ? "bg-green-400"
        : entry.status === "error"
          ? "bg-red-400"
          : "bg-yellow-400";
    const borderColor =
      entry.status === "success"
        ? "border-green-600"
        : entry.status === "error"
          ? "border-red-600"
          : "border-yellow-600";

    let parsedInput: any = {};
    try {
      parsedInput = JSON.parse(entry.content || "{}");
    } catch {}

    // Compact rendering for known tools
    if (entry.toolName === "Read") {
      return (
        <div className={`mb-1.5 border-l-2 ${borderColor} pl-2`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${entry.status === "pending" ? "animate-pulse" : ""}`} />
            <span className={`text-[11px] ${statusColor}`}>Read</span>
            <span className="text-[10px] text-muted-foreground truncate">
              {getShortPath(parsedInput.file_path || "")}
            </span>
          </div>
        </div>
      );
    }

    if (entry.toolName === "Edit" || entry.toolName === "Write") {
      const filePath = parsedInput.file_path || "";
      return (
        <div className={`mb-1.5 border-l-2 ${borderColor} pl-2`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${entry.status === "pending" ? "animate-pulse" : ""}`} />
            <span className={`text-[11px] ${statusColor}`}>{entry.toolName}</span>
            <span className="text-[10px] text-muted-foreground truncate">
              {getShortPath(filePath)}
            </span>
          </div>
        </div>
      );
    }

    if (entry.toolName === "Bash") {
      const command = parsedInput.command || "";
      return (
        <div className={`mb-1.5 border-l-2 ${borderColor} pl-2`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${entry.status === "pending" ? "animate-pulse" : ""}`} />
            <span className={`text-[11px] ${statusColor}`}>Bash</span>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground ml-3 mt-0.5 truncate">
            $ {command.substring(0, 60)}{command.length > 60 ? "..." : ""}
          </div>
        </div>
      );
    }

    if (entry.toolName === "Glob" || entry.toolName === "Grep") {
      return (
        <div className={`mb-1.5 border-l-2 ${borderColor} pl-2`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${entry.status === "pending" ? "animate-pulse" : ""}`} />
            <span className={`text-[11px] ${statusColor}`}>{entry.toolName}</span>
            <span className="text-[10px] text-muted-foreground truncate">
              &quot;{parsedInput.pattern || ""}&quot;
            </span>
          </div>
        </div>
      );
    }

    // Default tool rendering
    const isExpanded = expandedItems.has(entry.id);
    return (
      <div className={`mb-1.5 border-l-2 ${borderColor} pl-2`}>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${entry.status === "pending" ? "animate-pulse" : ""}`} />
          <span className={`text-[11px] ${statusColor}`}>{entry.toolName}</span>
          <button
            onClick={() => toggleExpand(entry.id)}
            className="text-[10px] text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? "[-]" : "[+]"}
          </button>
        </div>
        {isExpanded && (
          <pre className="mt-1 ml-3 text-[10px] bg-muted/30 p-1.5 rounded max-h-32 overflow-auto text-muted-foreground">
            {JSON.stringify(parsedInput, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  const renderEntry = (entry: LogEntry) => {
    switch (entry.type) {
      case "thinking": {
        const isExpanded = expandedItems.has(entry.id);
        return (
          <div key={entry.id} className="mb-1.5 border-l-2 border-muted pl-2">
            <button
              onClick={() => toggleExpand(entry.id)}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <span>{isExpanded ? "v" : ">"}</span>
              <span className="italic">Thinking</span>
              <span className="text-[10px] text-muted-foreground/60">
                ({entry.content.length} chars)
              </span>
            </button>
            {isExpanded && (
              <div className="mt-1 ml-3 text-[10px] text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
                {entry.content}
              </div>
            )}
          </div>
        );
      }

      case "text":
        return (
          <div
            key={entry.id}
            className="mb-2 prose prose-invert prose-xs max-w-none text-[11px] leading-relaxed"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ className, children, ...props }: any) => {
                  const isCodeBlock = className?.includes("language-");
                  if (!isCodeBlock) {
                    return (
                      <code className="bg-muted px-1 py-0.5 rounded text-[10px]" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code
                      className={`${className} block bg-muted/50 p-2 rounded overflow-x-auto text-[10px]`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <>{children}</>,
                p: ({ children }) => <p className="mb-1">{children}</p>,
              }}
            >
              {entry.content}
            </ReactMarkdown>
          </div>
        );

      case "tool_use":
        return <div key={entry.id}>{renderToolUse(entry)}</div>;

      case "tool_result": {
        const isExpanded = expandedItems.has(entry.id);
        const resultColor =
          entry.status === "success" ? "text-green-500" : "text-red-500";
        return (
          <div key={entry.id} className="mb-1 ml-3">
            <button
              onClick={() => toggleExpand(entry.id)}
              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <span className={resultColor}>-&gt;</span>
              <span>{isExpanded ? "collapse" : "result"}</span>
            </button>
            {isExpanded && (
              <pre className="mt-0.5 text-[10px] bg-muted/20 p-1.5 rounded max-h-32 overflow-auto text-muted-foreground whitespace-pre-wrap">
                {entry.content}
              </pre>
            )}
          </div>
        );
      }

      case "system": {
        const color =
          entry.status === "success"
            ? "text-green-500"
            : entry.status === "error"
              ? "text-red-500"
              : "text-muted-foreground";
        return (
          <div key={entry.id} className={`text-[10px] ${color} py-0.5 mb-1`}>
            {entry.content}
          </div>
        );
      }

      case "error":
        return (
          <div key={entry.id} className="text-[11px] text-red-500 py-0.5 mb-1">
            Error: {entry.content}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-card/50 border-l border-border">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-medium">AI Logs</span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {logEntries.length} entries
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2">
        {logEntries.map(renderEntry)}

        {/* Live streaming indicators */}
        {liveState.isStreaming && (
          <div className="space-y-1">
            {liveState.currentThinking && (
              <div className="border-l-2 border-blue-500/50 pl-2 animate-pulse">
                <div className="text-[10px] text-blue-400 italic">Thinking...</div>
                <div className="text-[10px] text-muted-foreground max-h-16 overflow-hidden">
                  {liveState.currentThinking.slice(-200)}
                </div>
              </div>
            )}

            {liveState.currentText && (
              <div className="text-[11px] text-foreground">
                {liveState.currentText.slice(-200)}
                <span className="animate-pulse text-primary">|</span>
              </div>
            )}

            {liveState.currentToolName && (
              <div className="border-l-2 border-yellow-500/50 pl-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-[11px] text-yellow-400">
                    {liveState.currentToolName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    executing...
                  </span>
                </div>
              </div>
            )}

            {!liveState.currentThinking &&
              !liveState.currentText &&
              !liveState.currentToolName && (
                <div className="text-[10px] text-muted-foreground animate-pulse">
                  Connecting...
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
