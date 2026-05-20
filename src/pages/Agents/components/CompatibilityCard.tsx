import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Globe } from "lucide-react";
import type { CompatibilityEntry } from "../types";

interface Props {
  entries: CompatibilityEntry[];
}

const CompatibilityCard: React.FC<Props> = ({ entries }) => {
  const badgeClass = (status: CompatibilityEntry["status"]) => {
    if (status === "Compatible") return "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600";
    if (status === "Alert") return "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600";
    return "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600";
  };

  const badgeIcon = (status: CompatibilityEntry["status"]) => {
    if (status === "Compatible") return <CheckCircle2 size={13} />;
    if (status === "Alert") return <AlertTriangle size={13} />;
    return <XCircle size={13} />;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
            <Globe size={16} />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Statut de Compatibilité</div>
            <div className="text-xs text-gray-400">Vérification des datasets entrants par l'agent</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div>
        <div className="grid grid-cols-[1fr_2fr] p-3 bg-gray-50 border-b border-gray-100">
          <span className="text-xs font-bold text-gray-500 uppercase">Dataset ID</span>
          <span className="text-xs font-bold text-gray-500 uppercase">Statut</span>
        </div>
        {entries.map((entry) => (
          <div key={entry.id} className="grid grid-cols-[1fr_2fr] p-3 border-b border-gray-100 items-center">
            <span className="text-sm font-medium text-gray-900">{entry.incomentId}</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className={badgeClass(entry.status)}>
                {badgeIcon(entry.status)} {entry.status}
              </span>
              <span className="text-xs text-orange-500 font-medium">{entry.actionLabel}</span>
              <span className="text-xs text-gray-400">{entry.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompatibilityCard;