import React from "react";
import { CheckSquare } from "lucide-react";
import { ExplanationEntry } from "../types";

const entries: ExplanationEntry[] = [
  {
    time: "10.11.23",
    title: "Observation analysée",
    content: "Vinces tendentms ≥ 1 5g, lurmaux ca prétimtes",
    type: "observation",
  },
  {
    time: "10.11.31",
    title: "Modèle utilisé:",
    content: "LSTM sélectionné on prédile Tusure",
    type: "model",
  },
  {
    time: "10.11.32",
    title: "Analyzz des tendances",
    content: "Augmnnment des etations aussent & dssuec:mainedances ≥ 1.3g, S",
    type: "analysis",
  },
  {
    time: "10.11.34",
    title: "Prédiction :",
    content: "Maîmenance précue le 24 février 2024 avec une confiance de 92%",
    type: "prediction",
  },
];

const typeColor: Record<ExplanationEntry["type"], string> = {
  observation: "#2563EB",
  model: "#2563EB",
  analysis: "#2563EB",
  prediction: "#2563EB",
};

const ExplanationsCard: React.FC = () => {
  return (
    <div className="card explanations-card">
      <div className="card-section-label">
        <CheckSquare size={18} color="#2563EB" />
        <h3 className="section-title">Explications</h3>
      </div>

      <div className="explanation-list">
        {entries.map((e, i) => (
          <div key={i} className="explanation-entry">
            <span className="exp-time">{e.time}</span>
            <div className="exp-body">
              <p className="exp-title" style={{ color: typeColor[e.type] }}>{e.title}</p>
              <p className="exp-content">{e.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExplanationsCard;
