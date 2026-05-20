import React from "react";
import { CheckSquare } from "lucide-react";
import { PredictionResult } from "../../../services/api";
import { ExplanationEntry } from "../types";

interface BackendExplanation {
  type?: string;
  title?: string;
  content?: string;
  time?: string;
}

const typeColor: Record<string, string> = {
  observation: "#2563EB",
  model: "#2563EB",
  analysis: "#2563EB",
  prediction: "#F97316",
};

function asExplanation(raw: BackendExplanation, index: number): ExplanationEntry {
  const allowed = ["observation", "model", "analysis", "prediction"] as const;
  const type = (allowed as readonly string[]).includes(raw.type ?? "")
    ? (raw.type as ExplanationEntry["type"])
    : "analysis";
  return {
    time: raw.time || "",
    title: raw.title || `Étape ${index + 1}`,
    content: raw.content || "",
    type,
  };
}

interface ExplanationsCardProps {
  results?: PredictionResult | null;
}

const ExplanationsCard: React.FC<ExplanationsCardProps> = ({ results }) => {
  const rawList = ((results as any)?.explanations as BackendExplanation[] | undefined) ?? [];
  const entries: ExplanationEntry[] = rawList.map(asExplanation);

  return (
    <div className="card explanations-card">
      <div className="card-section-label">
        <CheckSquare size={18} color="#2563EB" />
        <h3 className="section-title">Explications</h3>
      </div>

      <div className="explanation-list">
        {entries.length === 0 ? (
          <div className="explanation-entry" style={{ color: "#94a3b8", fontStyle: "italic" }}>
            Lancez une prédiction pour voir l'analyse détaillée de l'agent.
          </div>
        ) : (
          entries.map((e, i) => (
            <div key={i} className="explanation-entry">
              <span className="exp-time">{e.time}</span>
              <div className="exp-body">
                <p className="exp-title" style={{ color: typeColor[e.type] }}>{e.title}</p>
                <p className="exp-content">{e.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExplanationsCard;
