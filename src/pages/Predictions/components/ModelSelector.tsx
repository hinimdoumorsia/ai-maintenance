import React, { useState } from "react";
import { Settings, ChevronDown } from "lucide-react";
import { ModelOption } from "../types";

const MODELS: ModelOption[] = [
  { id: "random_forest", name: "Random Forest", description: "Baseline robuste" },
  { id: "xgboost", name: "XGBoost", description: "Gradient Boosting" },
  { id: "lightgbm", name: "LightGBM", description: "Boosting rapide" },
  { id: "catboost", name: "CatBoost", description: "Catégories natives" },
  { id: "extra_trees", name: "Extra Trees", description: "Bagging aléatoire" },
];

interface ModelSelectorProps {
  onModelChange: (model: ModelOption) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelChange }) => {
  const [selected, setSelected] = useState<ModelOption>(MODELS[0]);
  const [open, setOpen] = useState(false);

  const handleSelect = (model: ModelOption) => {
    setSelected(model);
    onModelChange(model);
    setOpen(false);
  };

  return (
    <div className="card model-selector-card">
      <div className="card-section-label">
        <span className="step-badge">2</span>
        <h3 className="section-title">Sélectionner un Modèle</h3>
      </div>

      <div className="model-dropdown-wrap">
        <button className="model-dropdown-btn" onClick={() => setOpen(!open)}>
          <div className="model-icon-wrap">
            <Settings size={18} color="#2563EB" />
          </div>
          <div className="model-info">
            <span className="model-name">{selected.name}</span>
            <span className="model-desc">{selected.description}</span>
          </div>
          <ChevronDown size={18} className={`dropdown-arrow ${open ? "open" : ""}`} />
        </button>

        {open && (
          <div className="model-dropdown-list">
            {MODELS.map((m) => (
              <button
                key={m.id}
                className={`model-option ${selected.id === m.id ? "selected" : ""}`}
                onClick={() => handleSelect(m)}
              >
                <Settings size={15} />
                <div>
                  <p className="model-opt-name">{m.name}</p>
                  <p className="model-opt-desc">{m.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="btn-primary model-change-btn">Changer de modèle</button>
    </div>
  );
};

export default ModelSelector;
