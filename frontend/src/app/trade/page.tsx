"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useWalletClient } from "wagmi";
import { Node, Edge } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Wallet,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Timer,
  Fuel,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FlowCanvas } from "@/components/trade/flow-canvas";
import { parseIntent, getIntentSummary, getSuggestions, isValidIntent } from "@/lib/lifi/intent-parser";
import { getQuoteFromIntent } from "@/lib/lifi/quotes";
import { generateFlowFromQuote, generateFlowFromIntent, updateNodeStatus } from "@/lib/lifi/flow-generator";
import { initializeLifiSDK, getChainName } from "@/lib/lifi/sdk";
import { useExecution } from "@/hooks/useExecution";
import type { ComposerQuote, ParsedIntent, RouteInfo, ExecutionState } from "@/lib/lifi/types";

// =============================================================================
// TYPES
// =============================================================================

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  flowGenerated?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function TradePage() {
  // Wallet state
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, chains } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to Moltrades! I can help you build cross-chain DeFi transactions using LI.FI Composer. Try:\n\n• Bridge tokens between chains\n• Swap tokens on any chain\n• Deposit into DeFi protocols (Aave, Morpho, Moonwell)\n• Bridge + deposit in one transaction\n\nConnect your wallet and describe your trade!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Flow state
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [currentQuote, setCurrentQuote] = useState<ComposerQuote | null>(null);
  const [currentIntent, setCurrentIntent] = useState<ParsedIntent | null>(null);

  // Execution state
  const { executionState, execute, reset: resetExecution } = useExecution();

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize LI.FI SDK when wallet connects
  useEffect(() => {
    if (walletClient) {
      initializeLifiSDK(async () => walletClient);
    }
  }, [walletClient]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Update nodes during execution
  useEffect(() => {
    if (executionState.currentStepId && nodes.length > 0) {
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            status:
              node.id === executionState.currentStepId
                ? "executing"
                : executionState.logs.some((log) => log.message.includes(node.id) && log.type === "success")
                ? "complete"
                : node.data?.status,
          },
        }))
      );
    }
  }, [executionState.currentStepId, executionState.logs]);

  // Handle sending message
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Parse the intent
      const intent = parseIntent(userMessage.content);
      setCurrentIntent(intent);

      // Generate initial flow from intent (shows loading state)
      const initialFlow = generateFlowFromIntent(intent);
      setNodes(initialFlow.nodes);
      setEdges(initialFlow.edges);
      setRouteInfo(initialFlow.route);

      // Add assistant message
      const intentSummary = getIntentSummary(intent);
      let assistantMessage: ChatMessage;

      // Check if wallet is connected
      if (!isConnected || !address) {
        assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `I understand you want to: **${intentSummary}**\n\nPlease connect your wallet to get a quote and execute this trade.`,
          timestamp: new Date(),
          flowGenerated: true,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Validate intent
      if (!isValidIntent(intent)) {
        assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `I couldn't fully understand your request. Please try again with a specific format like:\n\n• "Bridge 0.1 ETH from Ethereum to Base"\n• "Swap 100 USDC to ETH on Arbitrum"\n• "Deposit 0.1 ETH into Aave on Base"`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Get quote from LI.FI
      assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `Looking for the best route: **${intentSummary}**\n\nFetching quote from LI.FI...`,
        timestamp: new Date(),
        flowGenerated: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const quote = await getQuoteFromIntent(intent, address as `0x${string}`);

        if (quote) {
          setCurrentQuote(quote);

          // Generate actual flow from quote
          const flow = generateFlowFromQuote(quote);
          setNodes(flow.nodes);
          setEdges(flow.edges);
          setRouteInfo(flow.route);

          // Update assistant message with quote details
          const updatedMessage: ChatMessage = {
            id: `assistant-${Date.now()}-updated`,
            role: "assistant",
            content: `Great! I found a route for you:\n\n**${intentSummary}**\n\n• Estimated Output: ${flow.route.estimatedOutput}\n• Gas Cost: ${flow.route.estimatedGas}\n• Time: ${flow.route.estimatedTime}\n\nClick "Execute Trade" when you're ready!`,
            timestamp: new Date(),
            flowGenerated: true,
          };
          setMessages((prev) => [...prev, updatedMessage]);
        } else {
          const errorMessage: ChatMessage = {
            id: `assistant-${Date.now()}-error`,
            role: "assistant",
            content: `Sorry, I couldn't find a route for this trade. This might be due to:\n\n• Insufficient liquidity\n• Token not supported on the target chain\n• Protocol not available\n\nTry a different amount or route.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } catch (quoteError) {
        const err = quoteError as Error;
        const errorMessage: ChatMessage = {
          id: `assistant-${Date.now()}-error`,
          role: "assistant",
          content: `Error getting quote: ${err.message}\n\nPlease try again or adjust your trade parameters.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const err = error as Error;
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error: ${err.message}\n\nPlease try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }

    setIsLoading(false);
  }, [input, isLoading, isConnected, address]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    textareaRef.current?.focus();
  };

  // Handle node click
  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle execute
  const handleExecute = useCallback(async () => {
    if (!currentQuote || !isConnected) return;

    resetExecution();

    // Update all nodes to pending
    setNodes((prevNodes) =>
      prevNodes.map((node) => ({
        ...node,
        data: { ...node.data, status: node.type === "tokenInput" ? "complete" : "pending" },
      }))
    );

    const result = await execute(currentQuote, nodes);

    if (result) {
      // Update nodes to complete
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          data: { ...node.data, status: result.status === "DONE" ? "complete" : "error" },
        }))
      );

      // Add completion message
      const completionMessage: ChatMessage = {
        id: `assistant-${Date.now()}-complete`,
        role: "assistant",
        content:
          result.status === "DONE"
            ? `Transaction completed successfully!\n\n[View on Explorer](${result.explorerLinks.source})`
            : `Transaction failed. Please check the details and try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, completionMessage]);
    }
  }, [currentQuote, isConnected, execute, nodes, resetExecution]);

  // Render wallet button
  const renderWalletButton = () => {
    if (isConnected && address) {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {getChainName(chainId)}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => disconnect()}>
            <Wallet className="w-4 h-4 mr-2" />
            {address.slice(0, 6)}...{address.slice(-4)}
          </Button>
        </div>
      );
    }

    return (
      <Button
        onClick={() => connect({ connector: connectors[0] })}
        className="bg-primary hover:bg-primary/90"
        size="sm"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold font-display">MOLTRADES</h1>
          <Badge variant="secondary" className="text-xs">
            LI.FI Composer
          </Badge>
        </div>
        {renderWalletButton()}
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-96 border-r border-border flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-sm">TRADE BUILDER</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Describe your trade in natural language
            </p>
          </div>

          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                      message.flowGenerated && "border-l-2 border-accent"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Processing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Try these:</p>
              <div className="flex flex-wrap gap-1.5">
                {getSuggestions().slice(0, 4).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isLoading}
                    className="text-xs px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="relative flex items-end gap-2 bg-muted rounded-lg p-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your trade..."
                className="min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 text-sm"
                rows={1}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="flex-shrink-0 rounded-lg h-9 w-9"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Center Panel - Flow Canvas */}
        <div className="flex-1 relative">
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={setNodes}
            onEdgesChange={setEdges}
            onNodeClick={handleNodeClick}
            executionState={executionState}
          />
        </div>

        {/* Right Panel - Details */}
        <div className="w-80 border-l border-border flex flex-col">
          {/* Route Summary */}
          {routeInfo && (
            <div className="p-4 border-b border-border">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3">
                ROUTE SUMMARY
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Timer className="w-4 h-4" />
                    <span>Est. Time</span>
                  </div>
                  <span className="font-medium">{routeInfo.estimatedTime}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Fuel className="w-4 h-4" />
                    <span>Gas Cost</span>
                  </div>
                  <span className="font-medium">{routeInfo.estimatedGas}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Output</span>
                  </div>
                  <span className="font-medium">{routeInfo.estimatedOutput}</span>
                </div>
              </div>
            </div>
          )}

          {/* Selected Node */}
          {selectedNode && (
            <div className="p-4 border-b border-border">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3">
                SELECTED STEP
              </h3>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{selectedNode.data?.label as string}</span>
                  <Badge
                    variant={
                      selectedNode.data?.status === "complete"
                        ? "default"
                        : selectedNode.data?.status === "executing"
                        ? "outline"
                        : "secondary"
                    }
                    className={cn(
                      selectedNode.data?.status === "complete" && "bg-accent"
                    )}
                  >
                    {(selectedNode.data?.status as string) || "pending"}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Execution Log */}
          {executionState.logs.length > 0 && (
            <ScrollArea className="flex-1 p-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3">
                EXECUTION LOG
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
            </ScrollArea>
          )}

          {/* Execute Button */}
          <div className="p-4 border-t border-border mt-auto">
            <Button
              onClick={handleExecute}
              disabled={
                !currentQuote ||
                !isConnected ||
                executionState.status === "executing"
              }
              className="w-full bg-primary hover:bg-primary/90 font-bold"
              size="lg"
            >
              {executionState.status === "executing" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  EXECUTING...
                </>
              ) : executionState.status === "complete" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  COMPLETED
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  EXECUTE TRADE
                </>
              )}
            </Button>
            {!isConnected && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Connect wallet to execute
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
