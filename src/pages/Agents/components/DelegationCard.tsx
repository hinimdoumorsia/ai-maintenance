import React, { useState } from "react";
import { Bot, Users, ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import type { Agent } from "../types";

interface Props {
  agents: Agent[];
}

const statusConfig = {
  Disponible: { bg: "bg-green-50", text: "text-green-600", dot: "bg-green-500" },
  Occupé: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
  "Hors Ligne": { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

const AgentRow: React.FC<{ agent: Agent; depth?: number }> = ({ agent, depth = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  const cfg = statusConfig[agent.status] || statusConfig["Hors Ligne"];

  return (
    <>
      <div className={`grid grid-cols-[1fr,100px,110px,40px] items-center px-5 py-3 border-b border-gray-100 ${depth > 0 ? "bg-gray-50/30" : ""}`}>
        <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
          {depth > 0 && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 text-gray-300">
              <path d="M2 0 v8 h10" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600 flex items-center justify-center w-5"
          >
            {agent.children?.length ? (
              expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : (
              <span className="w-5" />
            )}
          </button>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${depth === 0 ? "bg-orange-50 text-orange-500" : "bg-indigo-50 text-indigo-500"}`}>
            <Bot size={14} />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{agent.name}</div>
            <div className="text-xs text-gray-400">{agent.description}</div>
          </div>
        </div>

        <div className="text-xs text-gray-500">{agent.role}</div>

        <div>
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {agent.status}
          </span>
        </div>

        <button className="text-gray-400 hover:text-gray-600 flex items-center justify-center p-1">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {expanded && agent.children?.map((child) => (
        <AgentRow key={child.id} agent={child} depth={depth + 1} />
      ))}
    </>
  );
};

const DelegationCard: React.FC<Props> = ({ agents }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500">
            <Users size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Délégation d'Agents</div>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUpIcon size={16} />}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Table Header */}
          <div className="grid grid-cols-[1fr,100px,110px,40px] bg-gray-50 px-5 py-2 border-b border-gray-100 text-[11px] font-bold text-gray-400">
            <span>Agent</span>
            <span>Rôle</span>
            <span>Status</span>
            <span></span>
          </div>

          {/* Agents */}
          {agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} depth={0} />
          ))}
        </>
      )}
    </div>
  );
};

// Composant ChevronUp manquant
const ChevronUpIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export default DelegationCard;