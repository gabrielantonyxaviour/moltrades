export interface LogEntry {
  id: string;
  type: "thinking" | "text" | "tool_use" | "tool_result" | "system" | "error";
  content: string;
  toolName?: string;
  toolId?: string;
  status?: "success" | "error" | "pending";
  timestamp: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  logEntries: LogEntry[];
  claudeSessionId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface StreamEvent {
  type: string;
  subtype?: string;
  data?: any;
  sessionId?: string;
  timestamp?: string;
  success?: boolean;
  error?: string;
  message?: {
    content: Array<{
      type: string;
      tool_use_id?: string;
      content?: string;
      is_error?: boolean;
    }>;
  };
  [key: string]: any;
}

export interface StreamResult {
  sessionId?: string;
  text: string;
  logEntries: LogEntry[];
  success: boolean;
  error?: string;
}

export type EngineState = "idle" | "active";

export interface LiveStreamState {
  currentThinking: string;
  currentText: string;
  currentToolName: string;
  currentToolInput: string;
  isStreaming: boolean;
}
