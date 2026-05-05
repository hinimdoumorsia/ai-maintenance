import React from "react";
import { Settings, MessageSquare, ArrowRight, Settings2, Target } from "lucide-react";
import { AgentOptions as AgentOptionsType } from "../types";

interface AgentOptionsProps {
  options: AgentOptionsType;
  onChange: (opts: AgentOptionsType) => void;
  targetCol: string;
  onTargetColChange: (col: string) => void;
  availableColumns?: string[];
}

const AgentOptionsCard: React.FC<AgentOptionsProps> = ({ 
  options, 
  onChange, 
  targetCol, 
  onTargetColChange, 
  availableColumns = [] 
}) => {
  return (
    <div className="card agent-options-card">
      <div className="card-section-label">
        <span className="step-badge orange">3</span>
        <div>
          <h3 className="section-title">Options de l'Agent</h3>
          <p className="section-subtitle">Configurez l'entraînement de votre modèle</p>
        </div>
      </div>

      {/* Colonne cible - NOUVEAU */}
      <div className="agent-option-row" style={{ marginBottom: 16 }}>
        <div className="agent-option-icon-wrap purple">
          <Target size={16} color="#9333EA" />
        </div>
        <div className="agent-option-text">
          <p className="agent-option-title">Colonne cible</p>
          <p className="agent-option-desc">Quelle colonne voulez-vous prédire ?</p>
        </div>
        <input
          type="text"
          className="target-input"
          placeholder="ex: failure, price, temperature"
          value={targetCol}
          onChange={(e) => onTargetColChange(e.target.value)}
          list="target-options"
          style={{
            padding: "8px 12px",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            fontSize: 14,
            width: 180,
            backgroundColor: "white",
          }}
        />
        {availableColumns.length > 0 && (
          <datalist id="target-options">
            {availableColumns.map(col => <option key={col} value={col} />)}
          </datalist>
        )}
      </div>

      {/* Auto-train toggle */}
      <div className="agent-option-row">
        <div className="agent-option-icon-wrap blue">
          <Settings size={16} color="#2563EB" />
        </div>
        <div className="agent-option-text">
          <p className="agent-option-title">Auto-entraînement</p>
          <p className="agent-option-desc">L'agent choisit automatiquement la meilleure configuration</p>
        </div>
        <button
          className={`toggle-switch ${options.autoTrain ? "on" : ""}`}
          onClick={() => onChange({ ...options, autoTrain: !options.autoTrain })}
          aria-label="Toggle auto-train"
        >
          <span className="toggle-knob" />
        </button>
      </div>

      {/* Explain decisions toggle */}
      <div className="agent-option-row">
        <div className="agent-option-icon-wrap blue">
          <MessageSquare size={16} color="#2563EB" />
        </div>
        <div className="agent-option-text">
          <p className="agent-option-title">Expliquer les décisions</p>
          <p className="agent-option-desc">Afficher les journaux détaillés de l'agent</p>
        </div>
        <button
          className={`toggle-switch ${options.explainDecisions ? "on" : ""}`}
          onClick={() => onChange({ ...options, explainDecisions: !options.explainDecisions })}
          aria-label="Toggle explain"
        >
          <span className="toggle-knob" />
        </button>
      </div>

      {/* Agent info box */}
      <div className="agent-info-box">
        <p className="agent-info-title">L'agent va :</p>
        <div className="agent-info-list">
          <div className="agent-info-item">
            <ArrowRight size={13} color="#2563EB" />
            <span>Analyser la structure de vos données</span>
          </div>
          <div className="agent-info-item">
            <ArrowRight size={13} color="#2563EB" />
            <span>Détecter et traiter les outliers intelligemment</span>
          </div>
          <div className="agent-info-item">
            <ArrowRight size={13} color="#2563EB" />
            <span>Entraîner et comparer les modèles</span>
          </div>
          <div className="agent-info-item">
            <ArrowRight size={13} color="#2563EB" />
            <span>Sauvegarder le meilleur modèle dans MLflow</span>
          </div>
        </div>
      </div>

      {/* Settings gear icon */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <Settings2 size={20} color="#9CA3AF" />
      </div>

      <style>{`
        .agent-option-icon-wrap.purple {
          background-color: #F3E8FF;
          border-radius: 10px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }
        .target-input:focus {
          outline: none;
          border-color: #F97316;
          box-shadow: 0 0 0 2px rgba(249,115,22,0.2);
        }
      `}</style>
    </div>
  );
};

export default AgentOptionsCard;