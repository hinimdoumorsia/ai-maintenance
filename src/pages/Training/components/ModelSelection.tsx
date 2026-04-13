import React, { useState } from "react";
import { Bot, SlidersHorizontal, GitBranch, Layers, Activity } from "lucide-react";
import { MLModel, ModelId, SelectionMode } from "../types";

const MODELS: MLModel[] = [
  { id: "random_forest", name: "Random Forest", description: "Parffit pour les données tabulines", icon: "tree" },
  { id: "xgboost", name: "XGBoost", description: "High performance de gradient", icon: "xg" },
  { id: "lstm", name: "LSTM", description: "Parffit pour les séries temporelles", icon: "wave" },
];

interface ModelSelectionProps {
  selected: ModelId;
  onSelect: (id: ModelId) => void;
  mode: SelectionMode;
  onModeChange: (m: SelectionMode) => void;
}

const ModelIcon: React.FC<{ icon: string }> = ({ icon }) => {
  if (icon === "tree") return <GitBranch size={20} color="#2563EB" />;
  if (icon === "xg") return <span style={{ fontWeight: 800, fontSize: 14, color: "#2563EB" }}>XG</span>;
  return <Activity size={20} color="#2563EB" />;
};

const ModelSelection: React.FC<ModelSelectionProps> = ({ selected, onSelect, mode, onModeChange }) => {
  return (
    <div className="card model-selection-card">
      <div className="card-section-label">
        <span className="step-badge">2</span>
        <div>
          <h3 className="section-title">Sélection du Modèle</h3>
          <p className="section-subtitle">Shiose drow to rain yon tunoniida</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === "auto" ? "active" : ""}`}
          onClick={() => onModeChange("auto")}
        >
          <Bot size={15} /> Auto (Agent)
        </button>
        <button
          className={`mode-btn ${mode === "manual" ? "active" : ""}`}
          onClick={() => onModeChange("manual")}
        >
          <SlidersHorizontal size={15} /> Menual
        </button>
      </div>

      {mode === "auto" && (
        <p className="auto-description">
          Laissez notre agent IA analyzer vos données et choisir le meilleur modèle.
        </p>
      )}

      {/* Model cards */}
      <div className="model-cards-list">
        {MODELS.map((m) => (
          <button
            key={m.id}
            className={`model-card-row ${selected === m.id ? "selected" : ""}`}
            onClick={() => onSelect(m.id)}
          >
            <div className="model-card-icon">
              <ModelIcon icon={m.icon} />
            </div>
            <div className="model-card-info">
              <span className="model-card-name">{m.name}</span>
              <span className="model-card-desc">{m.description}</span>
            </div>
            <div className={`model-radio ${selected === m.id ? "checked" : ""}`} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModelSelection;
