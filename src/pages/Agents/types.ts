// ─── Agent Status ───────────────────────────────────────────────────────────
export type AgentStatus = "Disponible" | "Occupé" | "Hors Ligne" | "En Attente";

export type FluxStatus = "En Ligne" | "Hors Ligne" | "En Attente";

// ─── Compatibility ───────────────────────────────────────────────────────────
export type CompatibilityStatus = "Compatible" | "Alert" | "Non Compatible";

export interface CompatibilityEntry {
  id: string;
  incomentId: string;
  status: CompatibilityStatus;
  actionLabel: string;
  message: string;
}

// ─── Agent Delegation ────────────────────────────────────────────────────────
export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: AgentStatus;
  children?: Agent[];
}

// ─── Tool Performance ────────────────────────────────────────────────────────
export interface ToolPerformance {
  name: string;
  execution: string;
  temps: string;
  success: string;
  f1Score: number;
  recall: number;
}

export interface PerformanceBarPoint {
  label: number;
  f1Score: number;
  recall: number;
}

// ─── Flux Node ───────────────────────────────────────────────────────────────
export type FluxNodeType =
  | "source"
  | "agent"
  | "tool"
  | "model"
  | "prediction"
  | "error"
  | "other";

export interface FluxNode {
  id: string;
  type: FluxNodeType;
  label: string;
  sublabel?: string;
}