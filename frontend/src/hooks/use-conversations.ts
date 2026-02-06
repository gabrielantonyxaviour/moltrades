"use client";

import { useState, useEffect, useCallback } from "react";
import type { Conversation, Message, LogEntry } from "@/lib/core-engine/types";
import { loadConversations, saveConversations } from "@/lib/core-engine/storage";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadConversations();
    setConversations(saved);
    setLoaded(true);
  }, []);

  // Persist to localStorage on change (after initial load)
  useEffect(() => {
    if (loaded && conversations.length > 0) {
      saveConversations(conversations);
    }
  }, [conversations, loaded]);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  const createConversation = useCallback((): string => {
    const id = `conv-${Date.now()}`;
    const conv: Conversation = {
      id,
      title: "New Chat",
      messages: [],
      logEntries: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(id);
    return id;
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
      }
    },
    [activeId]
  );

  const addMessage = useCallback(
    (conversationId: string, message: Omit<Message, "id" | "timestamp">) => {
      const msg: Message = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, messages: [...c.messages, msg], updatedAt: Date.now() }
            : c
        )
      );
      return msg;
    },
    []
  );

  const addLogEntry = useCallback(
    (conversationId: string, entry: Omit<LogEntry, "id" | "timestamp">) => {
      const logEntry: LogEntry = {
        ...entry,
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, logEntries: [...c.logEntries, logEntry], updatedAt: Date.now() }
            : c
        )
      );
      return logEntry;
    },
    []
  );

  const updateLogEntryStatus = useCallback(
    (conversationId: string, toolId: string, status: "success" | "error" | "pending") => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                logEntries: c.logEntries.map((e) =>
                  e.toolId === toolId ? { ...e, status } : e
                ),
              }
            : c
        )
      );
    },
    []
  );

  const setClaudeSessionId = useCallback(
    (conversationId: string, sessionId: string) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, claudeSessionId: sessionId } : c
        )
      );
    },
    []
  );

  const setTitle = useCallback(
    (conversationId: string, title: string) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, title } : c
        )
      );
    },
    []
  );

  return {
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
  };
}
