"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import type { LogEntry, Message, LiveStreamState } from "@/lib/core-engine/types";
import { ChatInput } from "./chat-input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatPanelProps {
  messages: Message[];
  logEntries: LogEntry[];
  liveState: LiveStreamState;
  onSend: (message: string) => void;
}

type TimelineItem =
  | { kind: "message"; data: Message }
  | { kind: "log"; data: LogEntry };

export function ChatPanel({
  messages,
  logEntries,
  liveState,
  onSend,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Merge messages and log entries into a single chronological timeline
  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...messages.map((m) => ({ kind: "message" as const, data: m })),
      ...logEntries.map((e) => ({ kind: "log" as const, data: e })),
    ];
    items.sort((a, b) => {
      const tA = a.kind === "message" ? a.data.timestamp : a.data.timestamp;
      const tB = b.kind === "message" ? b.data.timestamp : b.data.timestamp;
      return tA - tB;
    });
    return items;
  }, [messages, logEntries]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [timeline, liveState.currentText, liveState.currentThinking]);

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

  // ---- Renderers ----

  const renderUserMessage = (msg: Message) => (
    <div key={msg.id} className="flex justify-end mb-3">
      <div className="bg-primary/10 border border-primary/20 text-foreground px-4 py-2.5 rounded-2xl rounded-br-md max-w-[85%] text-sm">
        {msg.content}
      </div>
    </div>
  );

  const renderAssistantMessage = (msg: Message) => (
    <div key={msg.id} className="mb-3 prose prose-invert prose-sm max-w-none text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ className, children, ...props }: any) => {
            const isCodeBlock = className?.includes("language-");
            if (!isCodeBlock) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`${className} block bg-muted/50 p-3 rounded-lg overflow-x-auto text-xs`}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
        }}
      >
        {msg.content}
      </ReactMarkdown>
    </div>
  );

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

    if (entry.toolName === "Read") {
      return (
        <div className={`mb-1.5 border-l-2 ${borderColor} pl-2`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${entry.status === "pending" ? "animate-pulse" : ""}`} />
            <span className={`text-xs ${statusColor}`}>Read</span>
            <span className="text-[11px] text-muted-foreground truncate">
              {getShortPath(parsedInput.file_path || "")}
            </span>
          </div>
        </div>
      );
    }

    if (entry.toolName === "Edit" || entry.toolName === "Write") {
      return (
        <div className={`mb-1.5 border-l-2 ${borderColor} pl-2`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${entry.status === "pending" ? "animate-pulse" : ""}`} />
            <span className={`text-xs ${statusColor}`}>{entry.toolName}</span>
            <span className="text-[11px] text-muted-foreground truncate">
              {getShortPath(parsedInput.file_path || "")}
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
            <span className={`text-xs ${statusColor}`}>Bash</span>
          </div>
          <div className="text-[11px] font-mono text-muted-foreground ml-3 mt-0.5 truncate">
            $ {command.substring(0, 80)}{command.length > 80 ? "..." : ""}
          </div>
        </div>
      );
    }

    if (entry.toolName === "Glob" || entry.toolName === "Grep") {
      return (
        <div className={`mb-1.5 border-l-2 ${borderColor} pl-2`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${entry.status === "pending" ? "animate-pulse" : ""}`} />
            <span className={`text-xs ${statusColor}`}>{entry.toolName}</span>
            <span className="text-[11px] text-muted-foreground truncate">
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
          <span className={`text-xs ${statusColor}`}>{entry.toolName}</span>
          <button
            onClick={() => toggleExpand(entry.id)}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? "[-]" : "[+]"}
          </button>
        </div>
        {isExpanded && (
          <pre className="mt-1 ml-3 text-[11px] bg-muted/30 p-2 rounded max-h-40 overflow-auto text-muted-foreground">
            {JSON.stringify(parsedInput, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  const renderLogEntry = (entry: LogEntry) => {
    switch (entry.type) {
      case "thinking": {
        const isExpanded = expandedItems.has(entry.id);
        return (
          <div key={entry.id} className="mb-2 border-l-2 border-blue-500/30 pl-2">
            <button
              onClick={() => toggleExpand(entry.id)}
              className="text-xs text-blue-400/70 hover:text-blue-400 flex items-center gap-1"
            >
              <span>{isExpanded ? "v" : ">"}</span>
              <span className="italic">Thinking</span>
              <span className="text-[10px] text-muted-foreground/50">
                ({entry.content.length} chars)
              </span>
            </button>
            {isExpanded && (
              <div className="mt-1 ml-2 text-xs text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
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
            className="mb-3 prose prose-invert prose-sm max-w-none text-sm leading-relaxed"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ className, children, ...props }: any) => {
                  const isCodeBlock = className?.includes("language-");
                  if (!isCodeBlock) {
                    return (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code
                      className={`${className} block bg-muted/50 p-3 rounded-lg overflow-x-auto text-xs`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <>{children}</>,
                p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
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
          <div key={entry.id} className="mb-1.5 ml-3">
            <button
              onClick={() => toggleExpand(entry.id)}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <span className={resultColor}>-&gt;</span>
              <span>{isExpanded ? "collapse" : "result"}</span>
            </button>
            {isExpanded && (
              <pre className="mt-0.5 text-[11px] bg-muted/20 p-2 rounded max-h-40 overflow-auto text-muted-foreground whitespace-pre-wrap">
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
          <div key={entry.id} className={`text-xs ${color} py-0.5 mb-1.5`}>
            {entry.content}
          </div>
        );
      }

      case "error":
        return (
          <div key={entry.id} className="text-sm text-red-500 py-0.5 mb-2">
            Error: {entry.content}
          </div>
        );

      default:
        return null;
    }
  };

  const renderTimelineItem = (item: TimelineItem) => {
    if (item.kind === "message") {
      const msg = item.data;
      return msg.role === "user"
        ? renderUserMessage(msg)
        : renderAssistantMessage(msg);
    }
    return renderLogEntry(item.data);
  };

  return (
    <div className="h-full flex flex-col border-l border-border">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 shrink-0">
        <span className="text-sm font-medium">Chat</span>
        {liveState.isStreaming && (
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}
      </div>

      {/* Timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {timeline.length === 0 && !liveState.isStreaming && (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Start typing to begin...
          </div>
        )}

        {timeline.map(renderTimelineItem)}

        {/* Live streaming indicators */}
        {liveState.isStreaming && (
          <div className="space-y-2">
            {liveState.currentThinking && (
              <div className="border-l-2 border-blue-500/50 pl-2 animate-pulse">
                <div className="text-xs text-blue-400 italic">Thinking...</div>
                <div className="text-xs text-muted-foreground max-h-20 overflow-hidden">
                  {liveState.currentThinking.slice(-300)}
                </div>
              </div>
            )}

            {liveState.currentText && (
              <div className="text-sm text-foreground whitespace-pre-wrap">
                {liveState.currentText}
                <span className="animate-pulse text-primary">|</span>
              </div>
            )}

            {liveState.currentToolName && (
              <div className="border-l-2 border-yellow-500/50 pl-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-xs text-yellow-400">
                    {liveState.currentToolName}
                  </span>
                  <span className="text-xs text-muted-foreground">executing...</span>
                </div>
              </div>
            )}

            {!liveState.currentThinking &&
              !liveState.currentText &&
              !liveState.currentToolName && (
                <div className="text-xs text-muted-foreground animate-pulse">
                  Connecting...
                </div>
              )}
          </div>
        )}
      </div>

      {/* Chat input */}
      <div className="p-3 border-t border-border shrink-0">
        <ChatInput
          onSend={onSend}
          isLoading={liveState.isStreaming}
          placeholder="Describe your trade..."
        />
      </div>
    </div>
  );
}
