import React from "react";
<<<<<<< HEAD
=======
import { CheckCircle2, AlertTriangle, XCircle, Globe } from "lucide-react";
>>>>>>> djeriV2
import type { CompatibilityEntry } from "../types";

interface Props {
  entries: CompatibilityEntry[];
}

const CompatibilityCard: React.FC<Props> = ({ entries }) => {
<<<<<<< HEAD
  const [collapsed, setCollapsed] = React.useState(false);

  const badgeStyle = (status: CompatibilityEntry["status"]): React.CSSProperties => {
    if (status === "Compatible") return { backgroundColor: '#f0fdf4', color: '#16a34a' };
    if (status === "Alert") return { backgroundColor: '#fffbeb', color: '#d97706' };
    return { backgroundColor: '#fef2f2', color: '#dc2626' };
  };

  const badgeIcon = (status: CompatibilityEntry["status"]) => {
    if (status === "Compatible") return "✅";
    if (status === "Alert") return "⚠️";
    return "❌";
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(249,115,22,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            🌐
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>Statut de Compatibilité</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Compatibilités status en sous des données</div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', padding: '12px 20px', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280' }}>Incoment ID</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280' }}>Statut</span>
          </div>

          {/* Rows */}
          {entries.map((entry) => (
            <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', padding: '12px 20px', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{entry.incomentId}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 600,
                  ...badgeStyle(entry.status)
                }}>
                  {badgeIcon(entry.status)} {entry.status}
                </span>
                <span style={{ fontSize: '10px', color: '#F97316', fontWeight: 500 }}>{entry.actionLabel}</span>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>{entry.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
=======
  const badgeClass = (status: CompatibilityEntry["status"]) => {
    if (status === "Compatible") return "compat-badge compatible";
    if (status === "Alert") return "compat-badge alert";
    return "compat-badge incompatible";
  };

  const badgeIcon = (status: CompatibilityEntry["status"]) => {
    if (status === "Compatible") return <CheckCircle2 size={13} />;
    if (status === "Alert") return <AlertTriangle size={13} />;
    return <XCircle size={13} />;
  };

  return (
    <div className="card compat-card">
      {/* Header */}
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-icon" style={{ background: "rgba(99,102,241,.10)", color: "#6366f1" }}>
            <Globe size={16} />
          </div>
          <div>
            <div className="card-title">Statut de Compatibilité</div>
            <div className="card-subtitle">Compatibilités status en sous des données</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="compat-table">
        <div className="compat-table-header">
          <span>Incoment ID</span>
          <span>Statut</span>
        </div>
        {entries.map((entry) => (
          <div key={entry.id} className="compat-row">
            <span className="compat-id">{entry.incomentId}</span>
            <div className="compat-status-wrap">
              <span className={badgeClass(entry.status)}>
                {badgeIcon(entry.status)} {entry.status}
              </span>
              <span className="compat-action">{entry.actionLabel}</span>
              <span className="compat-msg">{entry.message}</span>
            </div>
          </div>
        ))}
      </div>
>>>>>>> djeriV2
    </div>
  );
};

export default CompatibilityCard;