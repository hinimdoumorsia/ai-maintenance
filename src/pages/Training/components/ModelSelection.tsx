import React from "react";
import { Bot, SlidersHorizontal, GitBranch, Activity, Sparkles, Zap } from "lucide-react";
import { MLModel, ModelId, SelectionMode } from "../types";

const MODELS: MLModel[] = [
  { id: "random_forest", name: "Random Forest", description: "Parfait pour les données tabulaires, robuste", icon: "tree" },
  { id: "extra_trees", name: "Extra Trees", description: "Plus aléatoire, moins de surapprentissage", icon: "tree" },
  { id: "xgboost", name: "XGBoost", description: "Haute performance par gradient boosting", icon: "xg" },
  { id: "lightgbm", name: "LightGBM", description: "Rapide et efficace en mémoire", icon: "zap" },
  { id: "catboost", name: "CatBoost", description: "Gère automatiquement les catégories et dates", icon: "sparkles" },
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
  if (icon === "zap") return <Zap size={20} color="#2563EB" />;
  if (icon === "sparkles") return <Sparkles size={20} color="#2563EB" />;
  return <Activity size={20} color="#2563EB" />;
};

const ModelSelection: React.FC<ModelSelectionProps> = ({ selected, onSelect, mode, onModeChange }) => {
  return (
    <div className="card model-selection-card">
      <div className="card-section-label">
        <span className="step-badge">2</span>
        <div>
          <h3 className="section-title">Sélection du Modèle</h3>
          <p className="section-subtitle">Choisissez votre algorithme d'entraînement</p>
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
          <SlidersHorizontal size={15} /> Manuel
        </button>
      </div>

      {mode === "auto" && (
        <p className="auto-description">
          Laissez notre agent IA analyser vos données et choisir le meilleur modèle pour vous.
        </p>
      )}

      {/* Model cards */}
      <div className="model-cards-list">
        {MODELS.map((m) => (
          <button
            key={m.id}
            className={`model-card-row ${selected === m.id ? "selected" : ""}`}
            onClick={() => onSelect(m.id)}
            disabled={mode === "auto"}
            style={{ opacity: mode === "auto" ? 0.6 : 1, cursor: mode === "auto" ? "not-allowed" : "pointer" }}
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

      <style>{`
        .model-card-row:disabled {
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ModelSelection;