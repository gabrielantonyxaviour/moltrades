"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TokenInputNode } from "./nodes/token-input-node";
import { BridgeNode } from "./nodes/bridge-node";
import { SwapNode } from "./nodes/swap-node";
import { DepositNode } from "./nodes/deposit-node";
import { OutputNode } from "./nodes/output-node";
import { Workflow } from "lucide-react";

interface ExecutionState {
  status: "idle" | "executing" | "complete" | "error";
  currentStepId: string | null;
  logs: { timestamp: Date; message: string; type: "info" | "success" | "error" }[];
}

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onNodeClick: (node: Node) => void;
  executionState: ExecutionState;
}

const nodeTypes = {
  tokenInput: TokenInputNode,
  bridge: BridgeNode,
  swap: SwapNode,
  deposit: DepositNode,
  output: OutputNode,
};

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  executionState,
}: FlowCanvasProps) {
  const [flowNodes, setNodes, onNodesChangeInternal] = useNodesState(nodes);
  const [flowEdges, setEdges, onEdgesChangeInternal] = useEdgesState(edges);

  // Sync external nodes/edges with internal state
  useMemo(() => {
    if (JSON.stringify(nodes) !== JSON.stringify(flowNodes)) {
      setNodes(nodes);
    }
  }, [nodes]);

  useMemo(() => {
    if (JSON.stringify(edges) !== JSON.stringify(flowEdges)) {
      setEdges(edges);
    }
  }, [edges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick(node);
    },
    [onNodeClick]
  );

  if (nodes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <Workflow className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">No flow yet</p>
        <p className="text-sm">Describe your trade in the chat to get started</p>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      onNodesChange={onNodesChangeInternal}
      onEdgesChange={onEdgesChangeInternal}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      attributionPosition="bottom-left"
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
      <Controls className="bg-card border border-border rounded-lg" />
      <MiniMap
        className="bg-card border border-border rounded-lg"
        nodeColor={(node) => {
          if (node.data?.status === "complete") return "hsl(var(--accent))";
          if (node.data?.status === "executing") return "hsl(var(--primary))";
          return "hsl(var(--muted))";
        }}
      />
    </ReactFlow>
  );
}
