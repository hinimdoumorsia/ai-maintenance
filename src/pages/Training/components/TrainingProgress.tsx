/**
 * TrainingProgress.tsx — Progression synchronisée avec les logs réels de l'agent.
 *
 * MAPPING logs → steps :
 *   "Pipeline demarre"         → analyse  : in_progress
 *   "Execution : train_model"  → analyse  : completed  | training : in_progress
 *   "Resultat : train_model"   → training : completed  | evaluation : in_progress
 *   "Execution : save_model"   → evaluation : completed | saving : in_progress
 *   "Resultat : save_model"    → saving : completed
 *
 * Note : les titres sont sans accents depuis la correction training_agent.py
 */
import React, { memo } from "react";
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import { TrainingStep } from "../types";

interface TrainingProgressProps {
  steps:   TrainingStep[];
  percent: number;
  running: boolean;
  hasError?: boolean;
}

const TrainingProgress: React.FC<TrainingProgressProps> = memo(
  ({ steps, percent, running, hasError = false }) => {

    const getStepIcon = (status: TrainingStep["status"]) => {
      switch (status) {
        case "completed":
          return <CheckCircle size={16} className="text-green-500 flex-shrink-0" />;
        case "in_progress":
          return <Loader2   size={16} className="text-orange-500 animate-spin flex-shrink-0" />;
        case "error" as any:
          return <XCircle   size={16} className="text-red-500 flex-shrink-0" />;
        default:
          return <Clock     size={16} className="text-gray-400 flex-shrink-0" />;
      }
    };

    const getStepBg = (status: TrainingStep["status"]) => {
      switch (status) {
        case "completed":   return "bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30";
        case "in_progress": return "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/40";
        case "error" as any:return "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40";
        default:            return "bg-gray-50 dark:bg-gray-700/30 border border-transparent";
      }
    };

    const getStepText = (status: TrainingStep["status"]) => {
      switch (status) {
        case "completed":   return "text-gray-800 dark:text-gray-200";
        case "in_progress": return "text-orange-700 dark:text-orange-300 font-semibold";
        default:            return "text-gray-500 dark:text-gray-400";
      }
    };

    const completedCount = steps.filter(s => s.status === "completed").length;
    const activeStep     = steps.find(s => s.status === "in_progress");

    return (
      <div className="rounded-2xl border-2 border-gray-800 dark:border-gray-700 p-1 shadow-lg shadow-gray-900/20 transition-all duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">

          {/* ── Header ── */}
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-900 dark:bg-gray-700 text-white text-xs font-bold flex-shrink-0 ring-2 ring-gray-700 shadow-md">
              2
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                Progression
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {completedCount}/{steps.length} étapes · {percent}% complété
              </p>
            </div>
          </div>

          {/* ── Barre de progression ── */}
          <div className="mb-4">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  hasError
                    ? "bg-gradient-to-r from-red-400 to-red-500"
                    : percent === 100
                    ? "bg-gradient-to-r from-green-400 to-green-500"
                    : "bg-gradient-to-r from-orange-500 to-orange-600"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* ── Liste des étapes ── */}
          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${getStepBg(step.status)}`}
              >
                <div className="flex-shrink-0">{getStepIcon(step.status)}</div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate transition-colors duration-200 ${getStepText(step.status)}`}>
                    {step.label}
                  </p>
                  {step.status === "in_progress" && (
                    <p className="text-xs text-orange-400 dark:text-orange-500 animate-pulse mt-0.5">
                      En cours…
                    </p>
                  )}
                  {step.status === "completed" && (
                    <p className="text-xs text-green-500 dark:text-green-400 mt-0.5">
                      Terminé
                    </p>
                  )}
                </div>

                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono flex-shrink-0">
                  {idx + 1}/{steps.length}
                </span>
              </div>
            ))}
          </div>

          {/* ── Message de statut ── */}
          {running && activeStep && (
            <div className="mt-4 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-center gap-2">
              <Loader2 size={14} className="text-orange-500 animate-spin flex-shrink-0" />
              <span className="text-xs text-orange-700 dark:text-orange-400 font-medium truncate">
                {activeStep.label}…
              </span>
            </div>
          )}

          {percent === 100 && !running && (
            <div className="mt-4 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
              <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                Pipeline terminé avec succès
              </span>
            </div>
          )}

          {hasError && (
            <div className="mt-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <XCircle size={14} className="text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-700 dark:text-red-400 font-medium">
                Une erreur est survenue
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

TrainingProgress.displayName = "TrainingProgress";
export default TrainingProgress;