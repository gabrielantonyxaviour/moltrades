"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestionChips = [
  "Bridge 1 ETH from Ethereum to Base",
  "Swap 100 USDC to ETH on Arbitrum",
  "Bridge and deposit to Moonwell",
  "What chains do you support?",
];

export default function TradePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to Moltrades! I can help you build cross-chain DeFi transactions. Try asking me to:\n\n• Bridge tokens between chains\n• Swap tokens on any supported chain\n• Find the best routes for your trades\n• Deposit into DeFi protocols\n\nWhat would you like to do today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: generateResponse(userMessage.content),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  }, [input, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      {/* Chat Container - Centered with max width */}
      <div className="flex flex-col max-w-3xl w-full h-full mx-auto">
        {/* Messages Area */}
        <ScrollArea ref={scrollRef} className="flex-1 px-4 py-6">
          <div className="space-y-6">
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
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggestion Chips - Only show when no user messages yet */}
        {messages.length === 1 && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">
                SUGGESTIONS
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestionChips.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs px-3 py-2 rounded-full border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border">
          <div className="relative flex items-end gap-2 bg-muted rounded-2xl p-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your trade..."
              className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="flex-shrink-0 rounded-xl h-10 w-10"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Powered by LI.FI Composer for cross-chain DeFi
          </p>
        </div>
      </div>
    </div>
  );
}

function generateResponse(input: string): string {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes("bridge") && lowerInput.includes("eth")) {
    return "I can help you bridge ETH! Here's what I found:\n\n**Route: Ethereum → Base**\n• Amount: 1 ETH\n• Est. Output: ~0.998 ETH\n• Gas: ~$2.50\n• Time: ~3 minutes\n\nWould you like me to execute this bridge? Just connect your wallet to proceed.";
  }

  if (lowerInput.includes("swap") && lowerInput.includes("usdc")) {
    return "I found a great swap route for you:\n\n**Swap: USDC → ETH on Arbitrum**\n• Amount: 100 USDC\n• Est. Output: ~0.032 ETH\n• Gas: ~$0.15\n• Slippage: 0.5%\n\nConnect your wallet to execute this swap.";
  }

  if (lowerInput.includes("moonwell") || lowerInput.includes("deposit")) {
    return "I can help you deposit into Moonwell! Here's a multi-step route:\n\n**Step 1: Bridge**\n• ETH from Ethereum → Base\n\n**Step 2: Deposit**\n• Deposit ETH into Moonwell on Base\n• Current APY: ~3.2%\n\nWant me to set this up for you?";
  }

  if (lowerInput.includes("chain") || lowerInput.includes("support")) {
    return "I support 20+ chains through LI.FI, including:\n\n• Ethereum\n• Arbitrum\n• Optimism\n• Base\n• Polygon\n• Avalanche\n• BNB Chain\n• And many more!\n\nI can bridge, swap, and interact with DeFi protocols across all of these.";
  }

  return "I understand you want to make a trade. Could you be more specific? For example:\n\n• \"Bridge 1 ETH from Ethereum to Base\"\n• \"Swap 100 USDC to ETH on Arbitrum\"\n• \"What's the best route to get USDC on Optimism?\"\n\nTell me what you'd like to do!";
}
