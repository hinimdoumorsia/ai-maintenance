import React from "react";
import { Settings, MessageSquare, ArrowRight, Settings2 } from "lucide-react";
import { AgentOptions as AgentOptionsType } from "../types";

interface AgentOptionsProps {
  options: AgentOptionsType;
  onChange: (opts: AgentOptionsType) => void;
}

const AgentOptionsCard: React.FC<AgentOptionsProps> = ({ options, onChange }) => {
  return (
    <div className="card agent-options-card">
      <div className="card-section-label">
        <span className="step-badge orange">3</span>
        <div>
          <h3 className="section-title">Options de l'Agent</h3>
          <p className="section-subtitle">Confiiure: atetuatïon aim lit ségnttatour</p>
        </div>
      </div>

      {/* Auto-train toggle */}
      <div className="agent-option-row">
        <div className="agent-option-icon-wrap blue">
          <Settings size={16} color="#2563EB" />
        </div>
        <div className="agent-option-text">
          <p className="agent-option-title">Auto-entrainer si ncompatible</p>
          <p className="agent-option-desc">Ponlaites ntàin aod te reina in o ntatins as le reprmsesins tran ipp. compatible, enasants</p>
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
          <p className="agent-option-desc">Fntniair lorn autoïnement, sutax:journaux de oettion de lagent</p>
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
            <span>Detecto nlèr le meilleur modèle</span>
          </div>
          <div className="agent-info-item">
            <ArrowRight size={13} color="#2563EB" />
            <span>Entramer et optimize</span>
          </div>
        </div>
      </div>

      {/* Settings gear icon */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <Settings2 size={20} color="#9CA3AF" />
      </div>
    </div>
  );
};

export default AgentOptionsCard;
