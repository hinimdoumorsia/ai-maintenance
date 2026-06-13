/**
 * AgentTrainingLogs.tsx
 * Affiche les journaux de l'agent en temps réel.
 * - Jamais de troncature côté frontend
 * - Gestion correcte des messages longs (word-break)
 * - Auto-scroll vers le bas à chaque nouveau log
 */
import React, { useEffect, useRef, memo } from "react";
import { Trash2, Bot, Loader2 } from "lucide-react";
import { AgentLogEntry } from "../types";

interface AgentTrainingLogsProps {
  logs:      AgentLogEntry[];
  onClear:   () => void;
  isRunning: boolean;
}

/* ── Badge couleur selon le type de log ─────────────────────────────────── */
const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  dataset:   { bg: "bg-blue-100 dark:bg-blue-900/40",   text: "text-blue-700 dark:text-blue-300",   label: "DATASET"  },
  training:  { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300", label: "TRAIN"  },
  model:     { bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-700 dark:text-purple-300", label: "MODEL"  },
  preprocess:{ bg: "bg-yellow-100 dark:bg-yellow-900/40", text: "text-yellow-700 dark:text-yellow-300", label: "PREP"  },
  explain:   { bg: "bg-green-100 dark:bg-green-900/40",  text: "text-green-700 dark:text-green-300",   label: "AGENT" },
  error:     { bg: "bg-red-100 dark:bg-red-900/40",      text: "text-red-700 dark:text-red-300",       label: "ERROR" },
  done:      { bg: "bg-green-100 dark:bg-green-900/40",  text: "text-green-700 dark:text-green-300",   label: "DONE"  },
};

const DEFAULT_STYLE = { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-300", label: "INFO" };

/* ── Composant log individuel ────────────────────────────────────────────── */
const LogRow: React.FC<{ entry: AgentLogEntry; index: number }> = memo(({ entry, index }) => {
  const style = TYPE_STYLES[entry.type] ?? DEFAULT_STYLE;

  return (
    <div className={`
      flex gap-2 p-2.5 rounded-lg border transition-colors duration-150
      ${index % 2 === 0
        ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
        : "bg-gray-50 dark:bg-gray-800/60 border-gray-100 dark:border-gray-700"}
    `}>
      {/* Heure */}
      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono flex-shrink-0 pt-0.5 w-16">
        {entry.time ?? "--:--:--"}
      </span>

      {/* Badge type */}
      <span className={`
        text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 h-fit
        ${style.bg} ${style.text}
      `}>
        {style.label}
      </span>

      {/* Contenu — JAMAIS tronqué */}
      <div className="flex-1 min-w-0">
        {entry.title && (
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 break-words">
            {entry.title}
          </p>
        )}
        {entry.detail && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 break-all whitespace-pre-wrap">
            {entry.detail}
          </p>
        )}
      </div>
    </div>
  );
});

LogRow.displayName = "LogRow";

/* ── Composant principal ─────────────────────────────────────────────────── */
const AgentTrainingLogs: React.FC<AgentTrainingLogsProps> = ({ logs, onClear, isRunning }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll à chaque nouveau log
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <div className="rounded-2xl border-2 border-gray-800 dark:border-gray-700 p-1 shadow-lg shadow-gray-900/20">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-orange-500 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Journaux
              {logs.length > 0 && (
                <span className="ml-1.5 text-xs font-normal text-gray-400">
                  ({logs.length})
                </span>
              )}
            </h3>
            {isRunning && (
              <Loader2 size={13} className="text-orange-500 animate-spin" />
            )}
          </div>

          {logs.length > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              title="Effacer les journaux"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Effacer</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-80 p-2 space-y-1">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-600">
              <Bot size={28} className="mb-2 opacity-40" />
              <p className="text-xs">En attente de l'agent…</p>
            </div>
          ) : (
            logs.map((entry, i) => (
              <LogRow key={i} entry={entry} index={i} />
            ))
          )}
          {/* Sentinel pour auto-scroll */}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};

export default AgentTrainingLogs;