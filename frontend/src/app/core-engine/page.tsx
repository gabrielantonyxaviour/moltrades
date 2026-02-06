"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUp, Loader2 } from "lucide-react";

export default function CoreEnginePage() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-4">
      <p className="text-muted-foreground text-lg mb-6 italic">imagine defi</p>

      <div className="w-full rounded-xl border border-border bg-background shadow-sm focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          className="w-full min-h-16 resize-none border-0 bg-transparent px-4 pt-3 pb-2 text-sm placeholder:text-muted-foreground outline-none"
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
    </div>
  );
}
