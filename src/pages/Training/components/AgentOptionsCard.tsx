import React from "react";
import { Settings, MessageSquare, ArrowRight, Settings2, Target } from "lucide-react";
import { AgentOptions as AgentOptionsType } from "../types";

interface AgentOptionsProps {
  options: AgentOptionsType;
  onChange: (opts: AgentOptionsType) => void;
  targetCol: string;
  onTargetColChange: (col: string) => void;
  availableColumns?: string[];
}

const AgentOptionsCard: React.FC<AgentOptionsProps> = ({
  options, onChange, targetCol, onTargetColChange, availableColumns = [],
}) => {
  return (
    /* Outer ring */
    <div className="rounded-2xl border-2 border-gray-800 p-1 shadow-lg shadow-gray-900/20
                    transition-all duration-300 hover:shadow-gray-800/40 hover:border-gray-700
                    animate-fadeIn">
      {/* Inner card */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 h-full">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex-shrink-0
                           ring-2 ring-orange-400 shadow-md">3</span>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 leading-tight">Options de l'Agent</h3>
            <p className="text-xs text-gray-400">Configurez l'entraînement</p>
          </div>
        </div>

        {/* Target column */}
        <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-purple-50 border border-purple-100 transition-all duration-200 hover:border-purple-200">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Target size={15} className="text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800">Colonne cible</p>
            <p className="text-xs text-gray-400">Quelle colonne prédire ?</p>
          </div>
          <input
            type="text"
            placeholder="ex: failure"
            value={targetCol}
            onChange={(e) => onTargetColChange(e.target.value)}
            list="target-options"
            className="w-28 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg
                       focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100
                       transition-all duration-200"
          />
          {availableColumns.length > 0 && (
            <datalist id="target-options">
              {availableColumns.map((col) => <option key={col} value={col} />)}
            </datalist>
          )}
        </div>

        {/* Toggles */}
        {[
          {
            key: "autoTrain" as keyof AgentOptionsType,
            icon: Settings,
            iconColor: "text-blue-600",
            bg: "bg-blue-50 border-blue-100 hover:border-blue-200",
            iconBg: "bg-blue-100",
            title: "Auto-entraînement",
            desc: "L'agent choisit la meilleure configuration",
          },
          {
            key: "explainDecisions" as keyof AgentOptionsType,
            icon: MessageSquare,
            iconColor: "text-blue-600",
            bg: "bg-blue-50 border-blue-100 hover:border-blue-200",
            iconBg: "bg-blue-100",
            title: "Expliquer les décisions",
            desc: "Afficher les journaux détaillés",
          },
        ].map(({ key, icon: Icon, iconColor, bg, iconBg, title, desc }) => (
          <div
            key={key}
            className={`flex items-center gap-3 mb-3 p-3 rounded-xl border transition-all duration-200 ${bg}`}
          >
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={15} className={iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">{title}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
            {/* Toggle switch */}
            <button
              onClick={() => onChange({ ...options, [key]: !options[key] })}
              className={`
                relative w-10 h-5.5 rounded-full flex-shrink-0 border-2 transition-all duration-300
                ${options[key]
                  ? "bg-gray-900 border-gray-700"
                  : "bg-gray-200 border-gray-300"}
              `}
              style={{ minWidth: "40px", height: "22px" }}
              aria-label={`Toggle ${key}`}
            >
              <span
                className={`
                  absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md
                  transition-all duration-300 ease-in-out
                  ${options[key] ? "translate-x-5" : "translate-x-0.5"}
                `}
              />
            </button>
          </div>
        ))}

        {/* Info box */}
        <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-2">L'agent va :</p>
          <div className="space-y-1.5">
            {[
              "Analyser la structure de vos données",
              "Détecter et traiter les outliers",
              "Entraîner et comparer les modèles",
              "Sauvegarder le meilleur dans MLflow",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2" style={{ animationDelay: `${i * 60}ms` }}>
                <ArrowRight size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-500">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-3">
          <Settings2 size={16} className="text-gray-300" />
        </div>
      </div>
    </div>
  );
};

export default AgentOptionsCard;