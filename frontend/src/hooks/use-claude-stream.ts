"use client";

import { useState, useCallback, useRef } from "react";
import type { LogEntry, LiveStreamState, StreamEvent } from "@/lib/core-engine/types";

interface UseClaudeStreamOptions {
  onLogEntry?: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
  onSessionId?: (sessionId: string) => void;
  onToolResult?: (toolId: string, status: "success" | "error") => void;
  onComplete?: (text: string, success: boolean) => void;
}

export function useClaudeStream(options: UseClaudeStreamOptions = {}) {
  const [liveState, setLiveState] = useState<LiveStreamState>({
    currentThinking: "",
    currentText: "",
    currentToolName: "",
    currentToolInput: "",
    isStreaming: false,
  });

  const abortRef = useRef<AbortController | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const sendMessage = useCallback(
    async (prompt: string, claudeSessionId?: string) => {
      // Abort previous stream if any
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLiveState({
        currentThinking: "",
        currentText: "",
        currentToolName: "",
        currentToolInput: "",
        isStreaming: true,
      });

      let fullText = "";
      let thinkingBuffer = "";
      let textBuffer = "";
      let toolInputBuffer = "";
      let toolNameBuffer = "";
      let toolIdBuffer = "";
      let success = true;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            ...(claudeSessionId && { sessionId: claudeSessionId }),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            try {
              const event: StreamEvent = JSON.parse(line);

              // 1. Capture session_id from system.init
              if (
                event.type === "claude_event" &&
                event.data?.type === "system" &&
                event.data?.subtype === "init"
              ) {
                optionsRef.current.onSessionId?.(event.data.session_id);
              }

              // 2. Handle streaming content events
              if (
                event.type === "claude_event" &&
                event.data?.type === "stream_event"
              ) {
                const streamEvent = event.data.event;

                // content_block_start
                if (streamEvent?.type === "content_block_start") {
                  const block = streamEvent.content_block;
                  if (block?.type === "thinking") {
                    thinkingBuffer = "";
                  } else if (block?.type === "text") {
                    textBuffer = "";
                  } else if (block?.type === "tool_use") {
                    toolInputBuffer = "";
                    toolNameBuffer = block.name || "";
                    toolIdBuffer = block.id || "";
                    setLiveState((s) => ({
                      ...s,
                      currentToolName: block.name || "",
                      currentToolInput: "",
                    }));
                  }
                }

                // content_block_delta
                if (streamEvent?.type === "content_block_delta") {
                  const delta = streamEvent.delta;
                  if (delta?.type === "thinking_delta") {
                    thinkingBuffer += delta.thinking || "";
                    setLiveState((s) => ({
                      ...s,
                      currentThinking: thinkingBuffer,
                    }));
                  } else if (delta?.type === "text_delta") {
                    textBuffer += delta.text || "";
                    setLiveState((s) => ({
                      ...s,
                      currentText: textBuffer,
                    }));
                  } else if (delta?.type === "input_json_delta") {
                    toolInputBuffer += delta.partial_json || "";
                    setLiveState((s) => ({
                      ...s,
                      currentToolInput: toolInputBuffer,
                    }));
                  }
                }

                // content_block_stop
                if (streamEvent?.type === "content_block_stop") {
                  if (thinkingBuffer) {
                    optionsRef.current.onLogEntry?.({
                      type: "thinking",
                      content: thinkingBuffer,
                    });
                    thinkingBuffer = "";
                    setLiveState((s) => ({ ...s, currentThinking: "" }));
                  }
                  if (textBuffer) {
                    fullText += textBuffer;
                    optionsRef.current.onLogEntry?.({
                      type: "text",
                      content: textBuffer,
                    });
                    textBuffer = "";
                    setLiveState((s) => ({ ...s, currentText: "" }));
                  }
                  if (toolInputBuffer || toolNameBuffer) {
                    optionsRef.current.onLogEntry?.({
                      type: "tool_use",
                      content: toolInputBuffer,
                      toolName: toolNameBuffer,
                      toolId: toolIdBuffer,
                      status: "pending",
                    });
                    toolInputBuffer = "";
                    toolNameBuffer = "";
                    toolIdBuffer = "";
                    setLiveState((s) => ({
                      ...s,
                      currentToolName: "",
                      currentToolInput: "",
                    }));
                  }
                }
              }

              // 3. Handle tool results
              const userEvent =
                event.type === "claude_event" && event.data?.type === "user"
                  ? event.data
                  : event.type === "user"
                    ? event
                    : null;

              if (userEvent?.message?.content) {
                for (const item of userEvent.message.content) {
                  if (item.type === "tool_result") {
                    const isError =
                      item.is_error ||
                      item.content?.includes?.("error") ||
                      item.content?.includes?.("Error");
                    const status = isError ? "error" : "success";

                    optionsRef.current.onToolResult?.(
                      item.tool_use_id,
                      status as "success" | "error"
                    );

                    optionsRef.current.onLogEntry?.({
                      type: "tool_result",
                      content:
                        typeof item.content === "string"
                          ? item.content.substring(0, 1000) +
                            (item.content.length > 1000 ? "..." : "")
                          : JSON.stringify(item.content).substring(0, 1000),
                      toolId: item.tool_use_id,
                      status: status as "success" | "error",
                    });
                  }
                }
              }

              // 4. Handle result event (usage stats)
              if (
                event.type === "claude_event" &&
                event.data?.type === "result"
              ) {
                // We could emit usage stats here if needed
              }

              // 5. Handle completion
              if (event.type === "completion") {
                success = event.success ?? true;
                if (!event.success) {
                  optionsRef.current.onLogEntry?.({
                    type: "error",
                    content: event.error || "Stream failed",
                  });
                }
                optionsRef.current.onLogEntry?.({
                  type: "system",
                  content: event.success ? "Complete" : `Failed: ${event.error}`,
                  status: event.success ? "success" : "error",
                });
              }
            } catch {
              // Non-JSON line, skip
            }
          }
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          success = false;
          optionsRef.current.onLogEntry?.({
            type: "error",
            content: error.message || "Stream failed",
          });
        }
      } finally {
        setLiveState({
          currentThinking: "",
          currentText: "",
          currentToolName: "",
          currentToolInput: "",
          isStreaming: false,
        });
        optionsRef.current.onComplete?.(fullText, success);
      }
    },
    []
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    liveState,
    sendMessage,
    abort,
  };
}
