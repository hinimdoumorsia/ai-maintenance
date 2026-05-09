import React, { useState } from "react";
<<<<<<< HEAD
=======
import { Bot, Users } from "lucide-react";
>>>>>>> djeriV2
import type { Agent } from "../types";

interface Props {
  agents: Agent[];
}

<<<<<<< HEAD
const AgentRow: React.FC<{ agent: Agent; depth?: number }> = ({ agent, depth = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  const paddingLeft = 20 + depth * 24;

  const statusStyle = (s: Agent["status"]): React.CSSProperties => {
    if (s === "Disponible") return { backgroundColor: '#f0fdf4', color: '#16a34a' };
    if (s === "Occupé") return { backgroundColor: '#fffbeb', color: '#d97706' };
    return { backgroundColor: '#fef2f2', color: '#dc2626' };
  };

  const dotColor = (s: Agent["status"]) => {
    if (s === "Disponible") return '#22c55e';
    if (s === "Occupé") return '#f59e0b';
    return '#ef4444';
  };

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 100px 110px 40px',
          alignItems: 'center',
          paddingLeft: `${paddingLeft}px`,
          paddingRight: '20px',
          paddingTop: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {depth > 0 && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: '#d1d5db' }}>
              <path d="M2 0 v8 h10" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '12px', padding: '0 2px' }}
          >
            {expanded && agent.children?.length ? '▼' : (agent.children?.length ? '▶' : '•')}
          </button>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
            🤖
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{agent.name}</div>
            <div style={{ fontSize: '10px', color: '#9ca3af' }}>{agent.description}</div>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#6b7280' }}>{agent.role}</div>

        <div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 600,
            ...statusStyle(agent.status)
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dotColor(agent.status) }} />
            {agent.status}
          </span>
        </div>

        <button style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', fontSize: '16px', letterSpacing: '1px' }}>
          ···
        </button>
      </div>

      {expanded && agent.children?.map((child) => (
=======
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
                color: depth === 0 ? "#f97316" : "#6366f1",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}
            >
              <Bot size={14} />
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
>>>>>>> djeriV2
        <AgentRow key={child.id} agent={child} depth={depth + 1} />
      ))}
    </>
  );
};

const DelegationCard: React.FC<Props> = ({ agents }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
<<<<<<< HEAD
    <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(249,115,22,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            👥
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>Délégation d'Agents</div>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ padding: '6px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px' }}
        >
          {collapsed ? '▼' : '▲'}
        </button>
      </div>

      {!collapsed && (
        <div>
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px 40px', padding: '12px 20px', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280' }}>Agent</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280' }}>Rôle</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280' }}>Status</span>
            <span />
          </div>

=======
    <div className="card delegation-card">
      {/* Header */}
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-icon" style={{ background: "rgba(99,102,241,.10)", display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}><Users size={15} /></div>
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
>>>>>>> djeriV2
          {agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DelegationCard;