import type { Conversation } from "./types";

const STORAGE_KEY = "moltrades_conversations";
const MAX_CONVERSATIONS = 50;

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = conversations
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_CONVERSATIONS)
      .map((conv) => ({
        ...conv,
        logEntries: conv.logEntries.map((entry) => ({
          ...entry,
          content:
            entry.type === "tool_result" && entry.content.length > 1000
              ? entry.content.substring(0, 1000) + "..."
              : entry.content,
        })),
      }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full - remove oldest conversations
    try {
      const reduced = conversations
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
    } catch {
      // Give up
    }
  }
}
