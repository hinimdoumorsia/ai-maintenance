import React, { useState } from "react";
import type { Agent } from "../types";

interface Props {
  agents: Agent[];
}

const statusClass = (s: Agent["status"]) => {
  if (s === "Disponible") return "status-pill online";
  if (s === "Occupé") return "status-pill busy";
  return "status-pill offline";
};
const statusDot = (s: Agent["status"]) => {
  if (s === "Disponible") return "status-dot online";
  if (s === "Occupé") return "status-dot busy";
  return "status-dot offline";
};

const AgentRow: React.FC<{ agent: Agent; depth?: number }> = ({ agent, depth = 0 }) => {
  const paddingLeft = 20 + depth * 18;
  return (
    <>
      <div
        className="delegation-row"
        style={{ paddingLeft }}
      >
        <div className="agent-info">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {depth > 0 && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2 0 v8 h10" stroke="#d1d5db" strokeWidth="1.5" fill="none" />
              </svg>
            )}
            <div
              style={{
                width: 28, height: 28,
                borderRadius: 8,
                background: depth === 0 ? "rgba(255,107,0,.12)" : "rgba(99,102,241,.10)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, flexShrink: 0
              }}
            >
              🤖
            </div>
            <div>
              <div className="agent-name">{agent.name}</div>
              <div className="agent-desc">{agent.description}</div>
            </div>
          </div>
        </div>
        <div className="agent-role" style={{ fontSize: 11, color: "#9ca3af" }}>
          {agent.role}
        </div>
        <div>
          <span className={statusClass(agent.status)}>
            <span className={statusDot(agent.status)} />
            {agent.status}
          </span>
        </div>
        <button className="dots-btn">···</button>
      </div>
      {agent.children?.map((child) => (
        <AgentRow key={child.id} agent={child} depth={depth + 1} />
      ))}
    </>
  );
};

const DelegationCard: React.FC<Props> = ({ agents }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="card delegation-card">
      {/* Header */}
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-icon" style={{ background: "rgba(99,102,241,.10)", fontSize: 16 }}>👥</div>
          <div>
            <div className="card-title">Délégation d'Agents</div>
          </div>
        </div>
        <div className="card-header-right">
          <button className="collapse-btn" onClick={() => setCollapsed((p) => !p)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            {collapsed ? "Développer" : "Compresse"}
          </button>
          <button className="chevron-btn" onClick={() => setCollapsed((p) => !p)}>
            {collapsed
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
            }
          </button>
        </div>
      </div>

      {/* Table */}
      {!collapsed && (
        <div className="fade-in">
          <div className="delegation-table-header">
            <span>Agent</span>
            <span>Rôle</span>
            <span>Status</span>
            <span />
          </div>
          {agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DelegationCard;