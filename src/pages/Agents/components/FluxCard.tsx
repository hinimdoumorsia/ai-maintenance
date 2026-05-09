import React, { useState } from "react";
import {
  Bot, Monitor, BarChart2, Cpu, TrendingUp, Settings2,
  Scissors, ClipboardList, Search, Wifi, ChevronDown, ChevronUp
} from "lucide-react";
import type { FluxStatus } from "../types";

interface FluxCardProps {
  status: FluxStatus;
}

const FluxCard: React.FC<FluxCardProps> = ({ status }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isOnline = status === "En Ligne";

  const Arrow = () => (
    <div className="flex-1 relative h-[2px] bg-gray-200 mx-1 min-w-[20px]">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-orange-500 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-orange-500" />
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500">
            <Wifi size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Flux de Données & Modèles</div>
            <div className="text-xs text-gray-400">Gérer les flux des données et délégation d'agents</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${isOnline ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
            {status}
          </span>
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Content - Diagram */}
      {!collapsed && (
        <div className="p-5 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-[800px]">

            {/* Données Capteurs */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-14 h-14 rounded-xl border-2 border-gray-200 bg-white shadow-sm flex items-center justify-center text-2xl">
                <Monitor size={22} className="text-gray-400" />
              </div>
              <div className="text-[10px] font-semibold text-center text-gray-600">Données<br />Capteurs</div>
            </div>

            <Arrow />

            {/* Agent Central */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-16 h-16 rounded-xl bg-blue-600 shadow-md flex items-center justify-center text-white">
                <Bot size={28} />
              </div>
              <div className="text-[10px] font-semibold text-center text-gray-600">Agent<br />Central</div>
            </div>

            <Arrow />

            {/* Tool Box */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="mb-2 px-2 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Agent Central
              </div>
              <div className="bg-gray-50 rounded-xl p-3 min-w-[140px] border border-gray-100">
                <div className="text-[11px] font-bold text-center mb-2 text-gray-800">Trousse à Outils</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 py-1.5 border-b border-gray-200">
                    <Scissors size={11} className="text-orange-500" /> Nettoyage
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 py-1.5 border-b border-gray-200">
                    <ClipboardList size={11} className="text-orange-500" /> Validation de Schéma
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 py-1.5">
                    <Search size={11} className="text-orange-500" /> Analyse de Compatibilité
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <span className="w-1 h-1 rounded-full bg-green-500" /> En Ligne
                  </span>
                </div>
              </div>
            </div>

            <Arrow />

            {/* Models */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                    <BarChart2 size={18} />
                  </div>
                  <div className="text-[9px] font-semibold text-gray-600 whitespace-pre-line">Modèles<br />Machine Learning</div>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500">
                    <Cpu size={18} />
                  </div>
                  <div className="text-[9px] font-semibold text-gray-600 whitespace-pre-line">Modèles<br />Deep Learning</div>
                </div>
              </div>
            </div>

            <Arrow />

            {/* Prédiction + Error */}
            <div className="flex flex-col gap-4 flex-shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-blue-500">
                  <TrendingUp size={20} />
                </div>
                <div className="text-[10px] font-semibold text-gray-600">Prédiction</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-500 font-bold text-sm">!</div>
                <div className="text-[9px] font-semibold text-gray-500 text-center">Erreur /<br />Redirection</div>
              </div>
            </div>

            <Arrow />

            {/* Autres Agents */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-12 h-12 rounded-xl border-2 border-gray-200 bg-white flex items-center justify-center text-gray-400">
                <Settings2 size={20} />
              </div>
              <div className="text-[10px] font-semibold text-center text-gray-600">Autres<br />Agents</div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default FluxCard;