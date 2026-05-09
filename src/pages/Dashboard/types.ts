// ─── Dashboard Types ─────────────────────────────────────────────────────────

export type MachineStatus = "OK" | "Alerte" | "Critique" | "Hors Ligne";

export interface Machine {
  id: string;
  name: string;
  status: MachineStatus;
  temperature: number;
  vibration: number;
  uptime: number; // %
  lastCheck: string;
}

export interface Alert {
  id: string;
  machineId: string;
  machineName: string;
  type: "Température" | "Vibration" | "Pression" | "Anomalie";
  severity: "Faible" | "Moyen" | "Élevé" | "Critique";
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface KpiStat {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number; // % positive = up
  trendLabel?: string;
  color: "blue" | "orange" | "green" | "red";
}

export interface ActivityPoint {
  hour: string;
  predictions: number;
  alerts: number;
}
