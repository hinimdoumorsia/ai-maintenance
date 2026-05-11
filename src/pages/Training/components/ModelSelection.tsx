import React from "react";
import { Bot, SlidersHorizontal, GitBranch, Activity, Sparkles, Zap } from "lucide-react";
import { MLModel, ModelId, SelectionMode } from "../types";

const MODELS: MLModel[] = [
  { id: "random_forest", name: "Random Forest",  description: "Parfait pour les données tabulaires, robuste",     icon: "tree" },
  { id: "extra_trees",   name: "Extra Trees",    description: "Plus aléatoire, moins de surapprentissage",        icon: "tree" },
  { id: "xgboost",       name: "XGBoost",        description: "Haute performance par gradient boosting",          icon: "xg" },
  { id: "lightgbm",      name: "LightGBM",       description: "Rapide et efficace en mémoire",                   icon: "zap" },
  { id: "catboost",      name: "CatBoost",       description: "Gère automatiquement les catégories et dates",    icon: "sparkles" },
];

interface ModelSelectionProps {
  selected: ModelId;
  onSelect: (id: ModelId) => void;
  mode: SelectionMode;
  onModeChange: (m: SelectionMode) => void;
}

const ModelIcon: React.FC<{ icon: string }> = ({ icon }) => {
  if (icon === "tree")     return <GitBranch size={18} className="text-blue-600" />;
  if (icon === "xg")       return <span className="text-xs font-black text-blue-600">XG</span>;
  if (icon === "zap")      return <Zap size={18} className="text-blue-600" />;
  if (icon === "sparkles") return <Sparkles size={18} className="text-blue-600" />;
  return <Activity size={18} className="text-blue-600" />;
};

const ModelSelection: React.FC<ModelSelectionProps> = ({ selected, onSelect, mode, onModeChange }) => {
  return (
    /* Outer ring */
    <div className="rounded-2xl border-2 border-gray-800 p-1 shadow-lg shadow-gray-900/20
                    transition-all duration-300 hover:shadow-gray-800/40 hover:border-gray-700
                    animate-fadeIn">
      {/* Inner card */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 h-full">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold flex-shrink-0
                           ring-2 ring-gray-700 shadow-md">2</span>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 leading-tight">Sélection du Modèle</h3>
            <p className="text-xs text-gray-400">Choisissez votre algorithme</p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl mb-4 border border-gray-200">
          {[
            { value: "auto",   icon: Bot,              label: "Auto (Agent)" },
            { value: "manual", icon: SlidersHorizontal, label: "Manuel" },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => onModeChange(value as SelectionMode)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold
                transition-all duration-200
                ${mode === value
                  ? "bg-gray-900 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-700"}
              `}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {mode === "auto" && (
          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-3 animate-fadeIn">
            L'agent IA analyse vos données et choisit le meilleur modèle automatiquement.
          </p>
        )}

        {/* Model list */}
        <div className="space-y-1.5">
          {MODELS.map((m, idx) => {
            const isSelected = selected === m.id;
            const isDisabled = mode === "auto";
            return (
              <button
                key={m.id}
                onClick={() => !isDisabled && onSelect(m.id)}
                disabled={isDisabled}
                style={{ animationDelay: `${idx * 50}ms` }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left
                  transition-all duration-200 group
                  ${isSelected && !isDisabled
                    ? "bg-gray-900 border-gray-700 shadow-md"
                    : "bg-gray-50 border-gray-200 hover:border-gray-400 hover:bg-gray-100"}
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                {/* Icon */}
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200
                  ${isSelected && !isDisabled ? "bg-white/10" : "bg-blue-50 group-hover:bg-blue-100"}
                `}>
                  {isSelected && !isDisabled
                    ? <div className="text-white"><ModelIcon icon={m.icon} /></div>
                    : <ModelIcon icon={m.icon} />
                  }
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate transition-colors duration-200
                    ${isSelected && !isDisabled ? "text-white" : "text-gray-800"}`}>
                    {m.name}
                  </p>
                  <p className={`text-xs truncate transition-colors duration-200
                    ${isSelected && !isDisabled ? "text-gray-300" : "text-gray-400"}`}>
                    {m.description}
                  </p>
                </div>

                {/* Radio dot */}
                <div className={`
                  w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all duration-200
                  ${isSelected && !isDisabled
                    ? "border-orange-400 bg-orange-400"
                    : "border-gray-300 group-hover:border-gray-500"}
                `}>
                  {isSelected && !isDisabled && (
                    <div className="w-full h-full rounded-full bg-white scale-50 block" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ModelSelection;