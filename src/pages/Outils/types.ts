// ─── Outils Types ─────────────────────────────────────────────────────────────

export type DiagnosticStatus = "idle" | "running" | "success" | "error";

export interface DiagnosticCheck {
  id: string;
  name: string;
  description: string;
  status: "pass" | "fail" | "warning" | "pending";
  detail?: string;
}

export type ExportFormat = "CSV" | "JSON" | "Excel" | "Parquet";

export interface ExportOption {
  id: string;
  label: string;
  format: ExportFormat;
  description: string;
  icon: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  source: string;
  message: string;
}

export interface DataQualityMetric {
  name: string;
  value: number;  // 0–100
  status: "good" | "warning" | "critical";
  detail: string;
}
