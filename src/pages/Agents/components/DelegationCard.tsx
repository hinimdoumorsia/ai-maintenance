import React, { useState } from "react";
import type { Agent } from "../types";

interface Props {
  agents: Agent[];
}

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
        <AgentRow key={child.id} agent={child} depth={depth + 1} />
      ))}
    </>
  );
};

const DelegationCard: React.FC<Props> = ({ agents }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
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

          {agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DelegationCard;