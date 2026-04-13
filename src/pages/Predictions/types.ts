export interface SensorRow {
  timestamp: string;
  machine_id: string;
  temperature: string;
  vibration: number;
  pressure: number;
  status: "OK" | "WARNING" | "ERROR";
}

export interface DataPreview {
  fileName: string;
  fileSize: string;
  rows: number;
  columns: number;
  data: SensorRow[];
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

export interface PredictionSettings {
  predictionWindow: string;
  activeForecast: boolean;
  batchPrediction: boolean;
}

export interface KPIItem {
  icon: string;
  value: string;
  label: string;
  badge?: string;
  badgeValue?: string;
  trend?: string;
  trendPercent?: string;
}

export interface ChartDataPoint {
  date: string;
  temperature: number;
  vibration: number;
  normal: number;
  isPrediction?: boolean;
}

export interface ExplanationEntry {
  time: string;
  title: string;
  content: string;
  type: "observation" | "model" | "analysis" | "prediction";
}

export interface AgentLog {
  time: string;
  message: string;
  icon: "observation" | "model" | "analysis" | "prediction";
}

export type PredictionWindow = "7 jours" | "14 jours" | "30 jours";
