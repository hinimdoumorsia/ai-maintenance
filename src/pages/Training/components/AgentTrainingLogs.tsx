import React, { useRef, useEffect } from "react";
import { Database, Lightbulb, Cpu, Play, Save, Trash2 } from "lucide-react";
import { AgentLogEntry } from "../types";

interface AgentTrainingLogsProps {
  logs?: AgentLogEntry[];
  onClear?: () => void;
  isRunning?: boolean;
}

const IconMap: Record<AgentLogEntry["type"], React.ReactNode> = {
  dataset:    <Database size={13} color="#F97316" />,
  explain:    <Lightbulb size={13} color="#F97316" />,
  preprocess: <Cpu size={13} color="#F97316" />,
  training:   <Play size={13} color="#F97316" />,
  model:      <Save size={13} color="#F97316" />,
};

const AgentTrainingLogs: React.FC<AgentTrainingLogsProps> = ({
  logs = [],
  onClear,
  isRunning = false,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const canClear = !isRunning && logs.length > 0;

  return (
    /* Outer ring — same dark border as header/footer */
    <div className="rounded-2xl border-2 border-gray-800 p-1 shadow-lg shadow-gray-900/20
                    transition-all duration-300 hover:shadow-gray-800/40 hover:border-gray-700
                    animate-fadeIn">
      {/* Inner card */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-orange-500 text-lg leading-none flex-shrink-0">⊞</span>
          <h3 className="flex-1 text-sm font-semibold text-gray-900">Journaux de l'Agent</h3>

          {/* ── Bouton Effacer – noir comme header/footer ── */}
          <button
            onClick={canClear ? onClear : undefined}
            disabled={!canClear}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              background: canClear ? "#030712" : "#e5e7eb",
              color: canClear ? "#ffffff" : "#9ca3af",
              border: `2px solid ${canClear ? "#1f2937" : "#e5e7eb"}`,
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: canClear ? "pointer" : "not-allowed",
              opacity: canClear ? 1 : 0.6,
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (canClear) {
                (e.currentTarget as HTMLButtonElement).style.background = "#1f2937";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#374151";
              }
            }}
            onMouseLeave={(e) => {
              if (canClear) {
                (e.currentTarget as HTMLButtonElement).style.background = "#030712";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#1f2937";
              }
            }}
          >
            <Trash2 size={12} />
            Effacer
          </button>
        </div>

        {/* Logs list */}
        <div className="max-h-96 overflow-y-auto space-y-1">

          {logs.length === 0 && !isRunning && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400 text-xs text-center">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200
                              flex items-center justify-center">
                <Cpu size={18} className="opacity-40" />
              </div>
              <span>En attente du démarrage de l'entraînement…</span>
            </div>
          )}

          {logs.length === 0 && isRunning && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-orange-500 text-xs text-center">
              <Cpu size={18} className="animate-spin" />
              <span>Démarrage de l'entraînement…</span>
            </div>
          )}

          {logs.map((log, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-100
                         hover:border-gray-200 hover:bg-gray-100/60 transition-colors duration-150"
            >
              <span className="flex-shrink-0 mt-0.5">
                {IconMap[log.type] ?? <Cpu size={13} color="#F97316" />}
              </span>
              <span className="flex-shrink-0 text-xs text-gray-400 font-mono mt-0.5 whitespace-nowrap">
                {log.time}
              </span>
              <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                <span className="text-xs font-semibold text-orange-500">{log.title}</span>
                {log.detail && (
                  <span className="text-xs text-gray-500 break-words leading-relaxed">{log.detail}</span>
                )}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {logs.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400 text-right">
            {logs.length} entrée{logs.length > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentTrainingLogs;