"use client";

import { useRef, useEffect } from "react";
import type { Message } from "@/lib/core-engine/types";
import type { LiveStreamState } from "@/lib/core-engine/types";
import { StreamDisplay } from "./stream-display";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageListProps {
  messages: Message[];
  liveState: LiveStreamState;
}

export function MessageList({ messages, liveState }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, liveState.currentText, liveState.currentThinking]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
      {messages.map((msg) => (
        <div key={msg.id}>
          {msg.role === "user" ? (
            <div className="flex justify-end">
              <div className="bg-primary/10 border border-primary/20 text-foreground px-4 py-2 rounded-xl max-w-[80%] text-sm">
                {msg.content}
              </div>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: ({ className, children, ...props }: any) => {
                    const isCodeBlock = className?.includes("language-");
                    if (!isCodeBlock) {
                      return (
                        <code
                          className="bg-muted px-1.5 py-0.5 rounded text-xs"
                          {...props}
                        >
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
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      ))}

      <StreamDisplay liveState={liveState} />
    </div>
  );
}
