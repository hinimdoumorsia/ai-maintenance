import React, { useState } from "react";
import type { FluxStatus } from "../types";

interface FluxCardProps {
  status: FluxStatus;
}

const FluxCard: React.FC<FluxCardProps> = ({ status }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="card flux-card">
      {/* Header */}
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-icon">🤖</div>
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
          </button>
        </div>
      </div>

      {/* Diagram */}
      {!collapsed && (
        <div className="flux-diagram fade-in">
          <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%" }}>
            {/* Données Capteurs */}
            <div className="flux-node">
              <div className="flux-node-icon" style={{ fontSize: 20 }}>🖥️</div>
              <div className="flux-node-label">Données<br />Capteurs</div>
            </div>

            {/* Arrow */}
            <div className="flux-arrow" style={{ minWidth: 28 }} />

            {/* Agent Central */}
            <div className="flux-node">
              <div
                className="flux-node-icon primary"
                style={{ width: 56, height: 56, fontSize: 24 }}
              >
                🤖
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
                  <span className="tool-item-icon">✂️</span> Nettoyage
                </div>
                <div className="tool-item">
                  <span className="tool-item-icon">📋</span> Validation de Schéma
                </div>
                <div className="tool-item">
                  <span className="tool-item-icon">🔍</span> Analyse de Compatibilité
                </div>
                <div className="tool-box-footer">
                  <span className="status-pill online" style={{ display: "inline-flex", fontSize: 10 }}>
                    <span className="status-dot online" />En Ligne
                  </span>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flux-arrow" style={{ minWidth: 22 }} />

            {/* Fork + Models */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
              {/* Diamond fork */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
                <div className="fork-diamond" />
              </div>

              {/* ML Model */}
              <div className="flux-node" style={{ flexDirection: "row", gap: 8 }}>
                <div className="flux-node-icon" style={{ width: 44, height: 44, fontSize: 18 }}>📊</div>
                <div className="flux-node-label" style={{ textAlign: "left" }}>
                  Modèles<br />Machine Learning
                </div>
              </div>

              {/* DL Model */}
              <div className="flux-node" style={{ flexDirection: "row", gap: 8 }}>
                <div className="flux-node-icon" style={{ width: 44, height: 44, fontSize: 18 }}>🧠</div>
                <div className="flux-node-label" style={{ textAlign: "left" }}>
                  Modèles<br />Deep Learning
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flux-arrow" style={{ minWidth: 22 }} />

            {/* Right side: Prediction + Error */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, flexShrink: 0 }}>
              {/* Prediction */}
              <div className="flux-node">
                <div className="flux-node-icon" style={{ fontSize: 20 }}>📈</div>
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
              <div className="flux-node-icon" style={{ fontSize: 20 }}>⚙️</div>
              <div className="flux-node-label">Other de-les<br />Agents</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FluxCard;