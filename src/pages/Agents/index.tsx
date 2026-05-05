import React from "react";
import { Bot } from 'lucide-react';
import "./agents.css";
import AppLayout from "../../components/AppLayout";

import FluxCard from "./components/FluxCard";
import CompatibilityCard from "./components/CompatibilityCard";
import DelegationCard from "./components/DelegationCard";
import PerformanceCard from "./components/PerformanceCard";

import type {
  CompatibilityEntry,
  Agent,
  ToolPerformance,
  PerformanceBarPoint,
} from "./types";

// ─── Static Data ─────────────────────────────────────────────────────────────
const compatData: CompatibilityEntry[] = [
  {
    id: "1",
    incomentId: "source_01",
    status: "Compatible",
    actionLabel: "sent à modèle",
    message: "Modèle LSTM nécessite format X",
  },
  {
    id: "2",
    incomentId: "source_02",
    status: "Alert",
    actionLabel: "délégué",
    message: "Modèle LSTM nécessite format X",
  },
  {
    id: "3",
    incomentId: "source_03",
    status: "Non Compatible",
    actionLabel: "rejeté",
    message: "Modèle LSTM nécessite format X",
  },
  {
    id: "4",
    incomentId: "source_04",
    status: "Non Compatible",
    actionLabel: "rejeté",
    message: "Modèle LSTM nécessite format X",
  },
];

const agentData: Agent[] = [
  {
    id: "adc",
    name: "Agent_Data_Cleaner",
    role: "Nettoyage",
    description: "Rôle - Nettoyage - Actuall data re analyser",
    status: "Occupé",
    children: [
      {
        id: "afe",
        name: "Agent_Feature_Engineer",
        role: "Engineer",
        description: "Role - Engineer » - actuall - feature engineer",
        status: "Disponible",
      },
      {
        id: "apf1",
        name: "Agent_Prediction_Finalizer",
        role: "Prediction",
        description: "Role - Prediction - nowectable rand feature engineer",
        status: "Disponible",
      },
      {
        id: "apf2",
        name: "Agent_Prediction_Finalizer",
        role: "Prediction",
        description: "Role - Prediction - actuall predicton finalizer",
        status: "Disponible",
      },
    ],
  },
];

const toolData: ToolPerformance[] = [
  { name: "Data Validation",  execution: "9.3 ms",  temps: "0.0%", success: "99.2%", f1Score: 0.92, recall: 0.78 },
  { name: "Anomaly Detection", execution: "13.5m", temps: "0.0%", success: "99.2%", f1Score: 0.88, recall: 0.90 },
];

const chartData: PerformanceBarPoint[] = [
  { label: 10, f1Score: 0.82, recall: 0.70 },
  { label: 20, f1Score: 0.91, recall: 0.88 },
  { label: 30, f1Score: 0.75, recall: 0.85 },
  { label: 40, f1Score: 0.89, recall: 0.80 },
];

// Navigation centralisée dans AppLayout — voir src/components/AppLayout/index.tsx

// ─── Page ─────────────────────────────────────────────────────────────────────
const AgentsPage: React.FC = () => {
  return (
    <AppLayout
      title="Agents"
      subtitle="Gérer les flux de données, les prédictions et la délégation d'agents"
      icon={Bot}
      notifCount={1}
    >
      <div className="agents-page">
        <div className="page-content">
          <FluxCard status="En Ligne" />
          <CompatibilityCard entries={compatData} />
          <DelegationCard agents={agentData} />
          <PerformanceCard tools={toolData} chartData={chartData} />
        </div>
      </div>
    </AppLayout>
  );
};

export default AgentsPage;