"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Node, Edge } from "@xyflow/react";
import { useWalletClient, usePublicClient, useAccount } from "wagmi";

import { ChatInput } from "@/components/core-engine/chat-input";
import { ChatPanel } from "@/components/core-engine/chat-panel";
import { ResizeHandle } from "@/components/core-engine/resize-handle";
import { FlowCanvas } from "@/components/trade/flow-canvas";
import { ExecuteButton } from "@/components/core-engine/execute-button";

import { useConversations } from "@/hooks/use-conversations";
import { useClaudeStream } from "@/hooks/use-claude-stream";
import { usePhaseExecution } from "@/hooks/use-phase-execution";
import {
  generateFlowFromIntent,
  generateFlowFromPhases,
  updateNodeStatus,
} from "@/lib/lifi/flow-generator";
import { initializeLifiSDK } from "@/lib/lifi/sdk";
import { SYSTEM_PROMPT } from "@/lib/core-engine/system-prompt";
import {
  parseRouteFromResponse,
  parseRouteFromLogEntries,
  isMultiPhase,
} from "@/lib/core-engine/route-parser";

import type { EngineState, LogEntry } from "@/lib/core-engine/types";
import type { PhaseIntent, ParsedIntent, Address } from "@/lib/lifi/types";

export default function CoreEnginePage() {
  const [engineState, setEngineState] = useState<EngineState>("idle");
  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  const [flowEdges, setFlowEdges] = useState<Edge[]>([]);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [phases, setPhases] = useState<PhaseIntent[]>([]);

  // Wagmi wallet integration
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { address } = useAccount();

  // Initialize LI.FI SDK with wagmi wallet client
  useEffect(() => {
    if (walletClient) {
      initializeLifiSDK(async () => walletClient);
    }
  }, [walletClient]);

  // Phase execution hook
  const handleNodeStatusUpdate = useCallback(
    (phaseNum: number, status: string) => {
      setFlowNodes((prevNodes) => {
        // Update all nodes belonging to this phase
        return prevNodes.map((node) => {
          if (node.data?.phase === phaseNum && node.type !== "tokenInput" && node.type !== "output") {
            return { ...node, data: { ...node.data, status } };
          }
          // Update divider nodes
          if (node.type === "phaseDivider" && node.data?.fromPhase === phaseNum) {
            return {
              ...node,
              data: {
                ...node.data,
                status: status === "complete" ? "complete" : status === "executing" ? "waiting" : node.data.status,
              },
            };
          }
          return node;
        });
      });
    },
    []
  );

  const phaseExecution = usePhaseExecution(
    phases,
    walletClient ?? null,
    publicClient ?? null,
    (address as Address) ?? null,
    handleNodeStatusUpdate
  );

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

  /**
   * Process a parsed route (single or multi-phase) into flow nodes and phases.
   */
  const applyRoute = useCallback(
    (route: ParsedIntent | ReturnType<typeof parseRouteFromResponse>) => {
      if (!route) return;

      if (isMultiPhase(route)) {
        // Multi-phase route
        setPhases(route.phases);
        const { nodes, edges } = generateFlowFromPhases(route.phases);
        setFlowNodes(nodes);
        setFlowEdges(edges);
      } else {
        // Single-phase route — wrap as single phase for execution
        const singlePhase: PhaseIntent = { ...route, phase: 1 };
        setPhases([singlePhase]);
        const { nodes, edges } = generateFlowFromIntent(route);
        setFlowNodes(nodes);
        setFlowEdges(edges);
      }

      // Reset execution state when route changes
      phaseExecution.reset();
    },
    [phaseExecution]
  );

  const handleComplete = useCallback(
    (text: string, _success: boolean) => {
      if (!activeId) return;

      if (text) {
        addMessage(activeId, { role: "assistant", content: text });
      }

      // 1. Try to extract route from the AI's latest response text
      if (text) {
        const route = parseRouteFromResponse(text);
        if (route) {
          applyRoute(route);
        }
      }

      // 2. If no route in latest text, scan all AI text log entries
      if (!text && activeConversation) {
        const route = parseRouteFromLogEntries(activeConversation.logEntries);
        if (route) {
          applyRoute(route);
        }
      }

      // Title from first user message
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
    [activeId, activeConversation, addMessage, setTitle, applyRoute]
  );

  const { liveState, sendMessage } = useClaudeStream({
    onLogEntry: handleLogEntry,
    onSessionId: handleSessionId,
    onToolResult: handleToolResult,
    onComplete: handleComplete,
  });

  const handleSend = useCallback(
    (message: string) => {
      let convId = activeId;

      if (!convId) {
        convId = createConversation();
      }

      if (engineState === "idle") {
        setEngineState("active");
      }

      addMessage(convId, { role: "user", content: message });

      // Determine if this is the first message (no claudeSessionId yet)
      const conv = conversations.find((c) => c.id === convId);
      const isFirstMessage = !conv?.claudeSessionId;

      sendMessage(
        message,
        conv?.claudeSessionId,
        isFirstMessage ? SYSTEM_PROMPT : undefined
      );
    },
    [activeId, engineState, conversations, createConversation, addMessage, sendMessage]
  );

  const handleNewChat = useCallback(() => {
    createConversation();
    setFlowNodes([]);
    setFlowEdges([]);
    setPhases([]);
    phaseExecution.reset();
  }, [createConversation, phaseExecution]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveId(id);
      setFlowNodes([]);
      setFlowEdges([]);
      setPhases([]);
      phaseExecution.reset();

      const conv = conversations.find((c) => c.id === id);
      if (conv && conv.messages.length > 0) {
        setEngineState("active");
        // Re-extract route from AI responses in this conversation
        const route = parseRouteFromLogEntries(conv.logEntries);
        if (route) {
          if (isMultiPhase(route)) {
            setPhases(route.phases);
            const { nodes, edges } = generateFlowFromPhases(route.phases);
            setFlowNodes(nodes);
            setFlowEdges(edges);
          } else {
            const singlePhase: PhaseIntent = { ...route, phase: 1 };
            setPhases([singlePhase]);
            const { nodes, edges } = generateFlowFromIntent(route);
            setFlowNodes(nodes);
            setFlowEdges(edges);
          }
        }
      }
    },
    [setActiveId, conversations, phaseExecution]
  );

  const executionState = {
    status: "idle" as const,
    currentStepId: null,
    logs: [],
  };

  const showExecuteButton = phases.length > 0 && flowNodes.length > 0;

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

  // ---- ACTIVE STATE: Resizable split ----
  return (
    <div className="flex-1 flex flex-col">
      {/* Conversation tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-card/30 overflow-x-auto shrink-0">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            role="button"
            tabIndex={0}
            onClick={() => handleSelectConversation(conv.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSelectConversation(conv.id);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors cursor-pointer ${
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
          </div>
        ))}
        <button
          onClick={handleNewChat}
          className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50 whitespace-nowrap"
        >
          + New
        </button>
      </div>

      {/* Main area: FlowCanvas | ResizeHandle | Chat */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left: Flow Canvas */}
        <div style={{ width: `${splitRatio * 100}%` }} className="min-w-0 shrink-0">
          <FlowCanvas
            nodes={flowNodes}
            edges={flowEdges}
            onNodesChange={setFlowNodes}
            onEdgesChange={setFlowEdges}
            onNodeClick={() => {}}
            executionState={executionState}
          >
            {showExecuteButton && (
              <ExecuteButton
                totalPhases={phaseExecution.totalPhases}
                currentPhase={phaseExecution.currentPhase}
                phaseStatus={phaseExecution.phaseStatus}
                overallStatus={phaseExecution.overallStatus}
                error={phaseExecution.error}
                onExecute={phaseExecution.executeCurrentPhase}
                disabled={!walletClient || !address}
              />
            )}
          </FlowCanvas>
        </div>

        {/* Draggable divider */}
        <ResizeHandle ratio={splitRatio} onRatioChange={setSplitRatio} />

        {/* Right: Chat */}
        <div style={{ width: `${(1 - splitRatio) * 100}%` }} className="min-w-0 shrink-0">
          <ChatPanel
            messages={activeConversation?.messages || []}
            logEntries={activeConversation?.logEntries || []}
            liveState={liveState}
            onSend={handleSend}
          />
        </div>
      </div>
    </div>
  );
}
