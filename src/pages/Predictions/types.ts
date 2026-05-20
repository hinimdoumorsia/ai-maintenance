export interface DataPreview {
  fileName: string;
  fileSize: string;
  rows: number;
  columns: number;
  data: Record<string, any>[];
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

export interface ExplanationEntry {
  time: string;
  title: string;
  content: string;
  type: "observation" | "model" | "analysis" | "prediction";
}

export type PredictionWindow = "7 jours" | "14 jours" | "30 jours";
