import React, { useEffect, useMemo, useState } from "react";
import { Bot } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import FluxCard from "./components/FluxCard";
import CompatibilityCard from "./components/CompatibilityCard";
import DelegationCard from "./components/DelegationCard";
import PerformanceCard from "./components/PerformanceCard";
import { listAgents, BackendAgent } from "../../services/api";
import type {
  CompatibilityEntry,
  Agent,
  ToolPerformance,
  PerformanceBarPoint,
} from "./types";

// Fallback statique (avant chargement / si le backend ne répond pas)
const fallbackAgents: Agent[] = [
  {
    id: "loading",
    name: "Chargement…",
    role: "—",
    description: "Récupération de la liste des agents…",
    status: "En Attente",
  },
];

const compatData: CompatibilityEntry[] = [
  {
    id: "1",
    incomentId: "dataset_001",
    status: "Compatible",
    actionLabel: "transmis au modèle",
    message: "Format CSV reconnu, colonnes alignées",
  },
  {
    id: "2",
    incomentId: "dataset_002",
    status: "Alert",
    actionLabel: "délégué",
    message: "Colonnes manquantes — imputation appliquée",
  },
  {
    id: "3",
    incomentId: "dataset_003",
    status: "Non Compatible",
    actionLabel: "rejeté",
    message: "Schéma incompatible avec le modèle sélectionné",
  },
];

const chartData: PerformanceBarPoint[] = [
  { label: 10, f1Score: 0.82, recall: 0.70 },
  { label: 20, f1Score: 0.91, recall: 0.88 },
  { label: 30, f1Score: 0.75, recall: 0.85 },
  { label: 40, f1Score: 0.89, recall: 0.80 },
];

function backendStatusToUi(status: BackendAgent["status"]): Agent["status"] {
  return status;
}

function backendAgentToUi(a: BackendAgent): Agent {
  return {
    id: a.id,
    name: a.name,
    role: a.role,
    description: a.description,
    status: backendStatusToUi(a.status),
  };
}

function toolsFromAgents(agents: BackendAgent[]): ToolPerformance[] {
  // Une ligne par outil agrégeant les jobs traités.
  const flat = agents.flatMap((a) =>
    a.tools.map((t) => ({
      name: t.name,
      execution: "—",
      temps: "—",
      success: a.status === "Disponible" ? "100%" : "—",
      f1Score: 0,
      recall: 0,
    }))
  );
  // Dédup par nom
  const seen = new Set<string>();
  return flat.filter((t) => {
    if (seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  });
}

const AgentsPage: React.FC = () => {
  const [backendAgents, setBackendAgents] = useState<BackendAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fluxOnline, setFluxOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await listAgents();
        if (!mounted) return;
        setBackendAgents(data.agents);
        setFluxOnline(data.summary.offline < data.summary.total);
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Impossible de joindre le registre des agents");
        setFluxOnline(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const id = window.setInterval(load, 15000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const uiAgents: Agent[] = useMemo(() => {
    if (loading && backendAgents.length === 0) return fallbackAgents;
    if (backendAgents.length === 0) {
      return [{
        id: "none",
        name: "Aucun agent enregistré",
        role: "—",
        description: error || "Le backend n'a renvoyé aucun agent.",
        status: "Hors Ligne",
      }];
    }
    return backendAgents.map(backendAgentToUi);
  }, [loading, backendAgents, error]);

  const tools: ToolPerformance[] = useMemo(() => toolsFromAgents(backendAgents), [backendAgents]);

  return (
    <AppLayout
      title="Agents"
      subtitle="Gérer les flux de données, les prédictions et la délégation d'agents"
      icon={Bot}
      notifCount={1}
    >
      <div className="flex flex-col gap-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        <FluxCard status={fluxOnline ? "En Ligne" : "Hors Ligne"} />
        <CompatibilityCard entries={compatData} />
        <DelegationCard agents={uiAgents} />
        <PerformanceCard tools={tools} chartData={chartData} />
      </div>
    </AppLayout>
  );
};

export default AgentsPage;
