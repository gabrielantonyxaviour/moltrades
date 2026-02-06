"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Node, Edge } from "@xyflow/react";

import { ChatInput } from "@/components/core-engine/chat-input";
import { MessageList } from "@/components/core-engine/message-list";
import { AiLogsPanel } from "@/components/core-engine/ai-logs-panel";
import { FlowCanvas } from "@/components/trade/flow-canvas";

import { useConversations } from "@/hooks/use-conversations";
import { useClaudeStream } from "@/hooks/use-claude-stream";
import { parseIntent, isValidIntent } from "@/lib/lifi/intent-parser";
import { generateFlowFromIntent } from "@/lib/lifi/flow-generator";

import type { EngineState, LogEntry } from "@/lib/core-engine/types";

/**
 * Try to extract a valid trade intent from all user messages combined.
 * This allows multi-turn conversations where details accumulate.
 */
function tryExtractIntent(userMessages: string[]) {
  // Try each message individually (most recent first)
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const intent = parseIntent(userMessages[i]);
    if (isValidIntent(intent)) {
      return intent;
    }
  }

  // Try combining all user messages into one context string
  if (userMessages.length > 1) {
    const combined = userMessages.join(" ");
    const intent = parseIntent(combined);
    if (isValidIntent(intent)) {
      return intent;
    }
  }

  return null;
}

export default function CoreEnginePage() {
  const [engineState, setEngineState] = useState<EngineState>("idle");
  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  const [flowEdges, setFlowEdges] = useState<Edge[]>([]);

  const flowReady = flowNodes.length > 0;

  const {
    conversations,
    activeId,
    activeConversation,
    loaded,
    setActiveId,
    createConversation,
    deleteConversation,
    addMessage,
    addLogEntry,
    updateLogEntryStatus,
    setClaudeSessionId,
    setTitle,
  } = useConversations();

  // Restore engine state on load
  useEffect(() => {
    if (loaded && activeConversation && activeConversation.messages.length > 0) {
      setEngineState("active");
    }
  }, [loaded, activeConversation]);

  const handleLogEntry = useCallback(
    (entry: Omit<LogEntry, "id" | "timestamp">) => {
      if (!activeId) return;
      addLogEntry(activeId, entry);
    },
    [activeId, addLogEntry]
  );

  const handleSessionId = useCallback(
    (sessionId: string) => {
      if (!activeId) return;
      setClaudeSessionId(activeId, sessionId);
    },
    [activeId, setClaudeSessionId]
  );

  const handleToolResult = useCallback(
    (toolId: string, status: "success" | "error") => {
      if (!activeId) return;
      updateLogEntryStatus(activeId, toolId, status);
    },
    [activeId, updateLogEntryStatus]
  );

  const handleComplete = useCallback(
    (text: string, success: boolean) => {
      if (!activeId) return;

      // Add assistant message
      if (text) {
        addMessage(activeId, { role: "assistant", content: text });
      }

      // Try to build a flow from all user messages in the conversation
      if (activeConversation) {
        const userTexts = [
          ...activeConversation.messages
            .filter((m) => m.role === "user")
            .map((m) => m.content),
        ];

        const intent = tryExtractIntent(userTexts);
        if (intent) {
          const { nodes, edges } = generateFlowFromIntent(intent);
          setFlowNodes(nodes);
          setFlowEdges(edges);
        }
      }

      // Generate title from first user message
      if (activeConversation && activeConversation.messages.length <= 2) {
        const firstUserMsg = activeConversation.messages.find(
          (m) => m.role === "user"
        );
        if (firstUserMsg) {
          const shortTitle =
            firstUserMsg.content.length > 40
              ? firstUserMsg.content.substring(0, 40) + "..."
              : firstUserMsg.content;
          setTitle(activeId, shortTitle);
        }
      }
    },
    [activeId, activeConversation, addMessage, setTitle]
  );

  const { liveState, sendMessage, abort } = useClaudeStream({
    onLogEntry: handleLogEntry,
    onSessionId: handleSessionId,
    onToolResult: handleToolResult,
    onComplete: handleComplete,
  });

  const handleSend = useCallback(
    (message: string) => {
      let convId = activeId;

      // Create conversation if none active
      if (!convId) {
        convId = createConversation();
      }

      // Transition to active state on first message
      if (engineState === "idle") {
        setEngineState("active");
      }

      // Add user message
      addMessage(convId, { role: "user", content: message });

      // Get session ID for continuation
      const conv = conversations.find((c) => c.id === convId);
      sendMessage(message, conv?.claudeSessionId);
    },
    [
      activeId,
      engineState,
      conversations,
      createConversation,
      addMessage,
      sendMessage,
    ]
  );

  const handleNewChat = useCallback(() => {
    createConversation();
    setFlowNodes([]);
    setFlowEdges([]);
  }, [createConversation]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveId(id);
      setFlowNodes([]);
      setFlowEdges([]);
      const conv = conversations.find((c) => c.id === id);
      if (conv && conv.messages.length > 0) {
        setEngineState("active");
        // Re-extract flow from existing conversation
        const userTexts = conv.messages
          .filter((m) => m.role === "user")
          .map((m) => m.content);
        const intent = tryExtractIntent(userTexts);
        if (intent) {
          const { nodes, edges } = generateFlowFromIntent(intent);
          setFlowNodes(nodes);
          setFlowEdges(edges);
        }
      }
    },
    [setActiveId, conversations]
  );

  const executionState = {
    status: "idle" as const,
    currentStepId: null,
    logs: [],
  };

  // ---- IDLE STATE ----
  if (engineState === "idle") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-4 -mt-12 transition-all duration-500">
          <Image
            src="/moltrades-logo.png"
            alt="Moltrades"
            width={120}
            height={120}
          />
          <h1 className="font-heading text-2xl font-bold tracking-wider mb-1">
            Moltrades Core Engine
          </h1>
          <p className="text-muted-foreground text-sm mb-10 italic">
            Imagine DeFi
          </p>

          <ChatInput onSend={handleSend} isLoading={liveState.isStreaming} />

          <p className="text-xs text-muted-foreground mt-2">
            Powered by LI.FI Composer
          </p>

          {/* Previous conversations */}
          {conversations.length > 0 && (
            <div className="mt-8 w-full max-w-md">
              <p className="text-xs text-muted-foreground mb-2">Recent chats</p>
              <div className="space-y-1">
                {conversations.slice(0, 5).map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-border hover:bg-accent/50 transition-colors text-sm truncate"
                  >
                    {conv.title}
                    <span className="text-xs text-muted-foreground ml-2">
                      {conv.messages.length} msgs
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- ACTIVE STATE ----
  return (
    <div className="flex-1 flex transition-all duration-500">
      {/* Left 3/4: Chat or Flow */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Conversation tabs */}
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-card/30 overflow-x-auto shrink-0">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
                activeId === conv.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <span className="truncate max-w-[120px]">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="text-muted-foreground hover:text-red-400 ml-1"
              >
                x
              </button>
            </button>
          ))}
          <button
            onClick={handleNewChat}
            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50 whitespace-nowrap"
          >
            + New
          </button>
        </div>

        {/* Main content area - transitions between chat and flow */}
        <div className="flex-1 min-h-0 relative">
          {/* Chat view: visible when no flow chart yet */}
          <div
            className={`absolute inset-0 flex flex-col transition-all duration-500 ${
              flowReady
                ? "opacity-0 pointer-events-none scale-95"
                : "opacity-100 scale-100"
            }`}
          >
            <MessageList
              messages={activeConversation?.messages || []}
              liveState={liveState}
            />
          </div>

          {/* Flow view: visible once trade intent is resolved */}
          <div
            className={`absolute inset-0 transition-all duration-500 ${
              flowReady
                ? "opacity-100 scale-100"
                : "opacity-0 pointer-events-none scale-105"
            }`}
          >
            <FlowCanvas
              nodes={flowNodes}
              edges={flowEdges}
              onNodesChange={setFlowNodes}
              onEdgesChange={setFlowEdges}
              onNodeClick={() => {}}
              executionState={executionState}
            />
          </div>
        </div>

        {/* Chat input - always visible at bottom */}
        <div className="p-3 border-t border-border shrink-0">
          <ChatInput
            onSend={handleSend}
            isLoading={liveState.isStreaming}
            placeholder={
              flowReady
                ? "Refine your trade or start a new one..."
                : "Describe your trade..."
            }
          />
        </div>
      </div>

      {/* Right 1/4: AI Logs Panel */}
      <div className="w-1/4 min-w-[280px] max-w-[400px] transition-all duration-500">
        <AiLogsPanel
          logEntries={activeConversation?.logEntries || []}
          liveState={liveState}
        />
      </div>
    </div>
  );
}
