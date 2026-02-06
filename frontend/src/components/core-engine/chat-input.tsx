"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2, Plus } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, isLoading, placeholder }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full rounded-xl border border-border bg-background shadow-sm focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-all">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Ask anything"}
        className="w-full min-h-12 resize-none border-0 bg-transparent px-4 pt-3 pb-2 text-sm placeholder:text-muted-foreground outline-none"
        style={{ fieldSizing: "content" } as React.CSSProperties}
      />
      <div className="flex items-center px-2 pb-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          type="button"
        >
          <Plus className="size-4" />
        </Button>
        <span className="ml-auto text-xs text-muted-foreground font-mono mr-4">
          Claude Opus 4.6
        </span>
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          size="icon-sm"
          className="rounded-lg"
          type="button"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
