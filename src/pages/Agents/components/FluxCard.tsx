import React, { useState } from "react";
<<<<<<< HEAD
=======
import {
  Bot, Monitor, BarChart2, Cpu, TrendingUp, Settings2,
  Scissors, ClipboardList, Search,
} from "lucide-react";
>>>>>>> djeriV2
import type { FluxStatus } from "../types";

interface FluxCardProps {
  status: FluxStatus;
}

const FluxCard: React.FC<FluxCardProps> = ({ status }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
<<<<<<< HEAD
    <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(249,115,22,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            🤖
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>Flux de Données &amp; Modèles</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Gérer les flux des données et délégation d'agents</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
            backgroundColor: status === 'En Ligne' ? '#f0fdf4' : '#fef2f2',
            color: status === 'En Ligne' ? '#16a34a' : '#dc2626'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: status === 'En Ligne' ? '#16a34a' : '#dc2626' }} />
            {status}
          </span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{ padding: '6px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px' }}
          >
            {collapsed ? '▼' : '▲'}
=======
    <div className="card flux-card">
      {/* Header */}
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-icon" style={{ color: "#f97316" }}><Bot size={17} /></div>
          <div>
            <div className="card-title">Flux de Données &amp; Modèles</div>
            <div className="card-subtitle">Gérer les flux des données et délégation d'agents</div>
          </div>
        </div>
        <div className="card-header-right">
          <span className={`status-pill ${status === "En Ligne" ? "online" : "offline"}`}>
            <span className={`status-dot ${status === "En Ligne" ? "online" : "offline"}`} />
            {status}
          </span>
          <button
            className="chevron-btn"
            onClick={() => setCollapsed((p) => !p)}
            aria-label="Réduire"
          >
            {collapsed ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
            )}
>>>>>>> djeriV2
          </button>
        </div>
      </div>

<<<<<<< HEAD
      {/* Content */}
      {!collapsed && (
        <div style={{ padding: '20px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '800px' }}>

            {/* Données Capteurs */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', border: '2px solid #e5e7eb', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                🖥️
              </div>
              <div style={{ fontSize: '10px', fontWeight: 600, textAlign: 'center', color: '#374151' }}>Données<br />Capteurs</div>
            </div>

            {/* Arrow */}
            <Arrow />

            {/* Agent Central */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '12px', backgroundColor: '#1E40AF', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                🤖
              </div>
              <div style={{ fontSize: '10px', fontWeight: 600, textAlign: 'center', color: '#374151' }}>Agent<br />Central</div>
            </div>

            {/* Arrow */}
            <Arrow />

            {/* Tool Box */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ marginBottom: '8px', padding: '4px 12px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '999px', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                Agent Central
              </div>
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '12px', minWidth: '140px', border: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textAlign: 'center', marginBottom: '8px', color: '#111827' }}>Trousse à Outils</div>
                <div>
                  {['✂️ Nettoyage', '📋 Validation de Schéma', '🔍 Analyse de Compatibilité'].map((item, i, arr) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: '#4b5563', padding: '4px 0', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      {item}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 600, color: '#16a34a', backgroundColor: '#f0fdf4', padding: '2px 8px', borderRadius: '999px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                    En Ligne
=======
      {/* Diagram */}
      {!collapsed && (
        <div className="flux-diagram fade-in">
          <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%" }}>
            {/* Données Capteurs */}
            <div className="flux-node">
              <div className="flux-node-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><Monitor size={20} /></div>
              <div className="flux-node-label">Données<br />Capteurs</div>
            </div>

            {/* Arrow */}
            <div className="flux-arrow" style={{ minWidth: 28 }} />

            {/* Agent Central */}
            <div className="flux-node">
              <div
                className="flux-node-icon primary"
                style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Bot size={24} />
              </div>
              <div className="flux-node-label">Agent<br />Central</div>
            </div>

            {/* Arrow */}
            <div className="flux-arrow" style={{ minWidth: 22 }} />

            {/* Tool Box */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {/* Agent Central badge above */}
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "rgba(16,185,129,.12)", color: "#059669",
                borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700, marginBottom: 4
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                Agent Central
              </div>
              <div className="tool-box">
                <div className="tool-box-title">Trousse à Outils</div>
                <div className="tool-box-chevron">∨</div>
                <div className="tool-item">
                  <span className="tool-item-icon"><Scissors size={12} /></span> Nettoyage
                </div>
                <div className="tool-item">
                  <span className="tool-item-icon"><ClipboardList size={12} /></span> Validation de Schéma
                </div>
                <div className="tool-item">
                  <span className="tool-item-icon"><Search size={12} /></span> Analyse de Compatibilité
                </div>
                <div className="tool-box-footer">
                  <span className="status-pill online" style={{ display: "inline-flex", fontSize: 10 }}>
                    <span className="status-dot online" />En Ligne
>>>>>>> djeriV2
                  </span>
                </div>
              </div>
            </div>

            {/* Arrow */}
<<<<<<< HEAD
            <Arrow />

            {/* Models */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[{ icon: '📊', label: 'Modèles\nMachine Learning' }, { icon: '🧠', label: 'Modèles\nDeep Learning' }].map(({ icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', borderRadius: '10px', padding: '8px', border: '1px solid #f3f4f6' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{icon}</div>
                  <div style={{ fontSize: '9px', fontWeight: 600, color: '#374151', whiteSpace: 'pre-line' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Arrow */}
            <Arrow />

            {/* Prédiction & Error */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', border: '2px solid #e5e7eb', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📈</div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}>Prédiction</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontWeight: 700, fontSize: '14px' }}>!</div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: '#6b7280' }}>Erreur /<br />Redirection</div>
=======
            <div className="flux-arrow" style={{ minWidth: 22 }} />

            {/* Fork + Models */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
              {/* Diamond fork */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
                <div className="fork-diamond" />
              </div>

              {/* ML Model */}
              <div className="flux-node" style={{ flexDirection: "row", gap: 8 }}>
                <div className="flux-node-icon" style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}><BarChart2 size={18} /></div>
                <div className="flux-node-label" style={{ textAlign: "left" }}>
                  Modèles<br />Machine Learning
                </div>
              </div>

              {/* DL Model */}
              <div className="flux-node" style={{ flexDirection: "row", gap: 8 }}>
                <div className="flux-node-icon" style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}><Cpu size={18} /></div>
                <div className="flux-node-label" style={{ textAlign: "left" }}>
                  Modèles<br />Deep Learning
                </div>
>>>>>>> djeriV2
              </div>
            </div>

            {/* Arrow */}
<<<<<<< HEAD
            <Arrow />

            {/* Other Agents */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', border: '2px solid #e5e7eb', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚙️</div>
              <div style={{ fontSize: '9px', fontWeight: 600, textAlign: 'center', color: '#374151' }}>Autres<br />Agents</div>
            </div>

=======
            <div className="flux-arrow" style={{ minWidth: 22 }} />

            {/* Right side: Prediction + Error */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, flexShrink: 0 }}>
              {/* Prediction */}
              <div className="flux-node">
                <div className="flux-node-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><TrendingUp size={20} /></div>
                <div className="flux-node-label">Prédiction</div>
              </div>

              {/* Error */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 32, height: 32,
                  borderRadius: "50%",
                  border: "2px solid #f59e0b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#f59e0b", fontSize: 15, fontWeight: 800
                }}>!</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Erreur /<br />Redirection</div>
                </div>
              </div>
            </div>

            {/* Arrow to Other agents */}
            <div className="flux-arrow" style={{ minWidth: 16 }} />

            {/* Other Agents */}
            <div className="flux-node">
              <div className="flux-node-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><Settings2 size={20} /></div>
              <div className="flux-node-label">Autres<br />Agents</div>
            </div>
>>>>>>> djeriV2
          </div>
        </div>
      )}
    </div>
  );
};

<<<<<<< HEAD
const Arrow: React.FC = () => (
  <div style={{ flex: 1, position: 'relative', height: '2px', backgroundColor: '#e5e7eb', margin: '0 4px' }}>
    <div style={{
      position: 'absolute', right: '-1px', top: '50%', transform: 'translateY(-50%)',
      width: 0, height: 0,
      borderLeft: '6px solid #F97316',
      borderTop: '4px solid transparent',
      borderBottom: '4px solid transparent'
    }} />
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #e5e7eb, #F97316)' }} />
  </div>
);

=======
>>>>>>> djeriV2
export default FluxCard;