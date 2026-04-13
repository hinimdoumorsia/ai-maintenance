export interface TrainingDataset {
  fileName: string;
  fileSize: string;
  rows: number;
  columns: number;
  data: SensorRow[];
}

export interface SensorRow {
  timestamp: string;
  machine_id: string;
  temperature: number;
  vibration: number;
  pressure: number;
  status: "OK" | "WARNING" | "ERROR";
}

export type ModelId = "random_forest" | "xgboost" | "lstm";
export type SelectionMode = "auto" | "manual";

export interface MLModel {
  id: ModelId;
  name: string;
  description: string;
  icon: string;
}

export interface TrainingStep {
  id: string;
  label: string;
  status: "completed" | "in_progress" | "pending";
}

export interface TrainingResults {
  modelUsed: string;
  modelBadge: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  historyLoss: number[];
  historyAccuracy: number[];
}

export interface AgentLogEntry {
  time: string;
  title: string;
  detail: string;
  type: "dataset" | "explain" | "preprocess" | "training" | "model";
}

export interface AgentOptions {
  autoTrain: boolean;
  explainDecisions: boolean;
}
