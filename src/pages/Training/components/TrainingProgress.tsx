import React from "react";
import { CheckCircle, Circle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { TrainingStep } from "../types";

interface TrainingProgressProps {
  steps: TrainingStep[];
  percent: number;
  running: boolean;
  onToggleCompress?: () => void;
  isCompressed?: boolean;
}

const statusIcon = (s: TrainingStep["status"]) => {
  if (s === "completed") return <CheckCircle size={16} color="#22c55e" />;
  if (s === "in_progress") return <Loader2 size={16} color="#F97316" className="spin" />;
  return <Circle size={16} color="#D1D5DB" />;
};

const statusLabel = (s: TrainingStep["status"]) => {
  if (s === "completed") return <span className="step-status completed">Terminé</span>;
  if (s === "in_progress") return <span className="step-status in-progress">En cours</span>;
  return <span className="step-status pending">En attente</span>;
};

// SVG circular progress
const CircularProgress: React.FC<{ pct: number }> = ({ pct }) => {
  const r = 54, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth="12" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="#F97316" strokeWidth="12"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="22" fontWeight="700" fill="#111827">{pct}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#6B7280">
        {pct === 100 ? "Terminé" : "En cours"}
      </text>
    </svg>
  );
};

const TrainingProgress: React.FC<TrainingProgressProps> = ({ 
  steps, 
  percent, 
  running, 
  onToggleCompress, 
  isCompressed = false 
}) => {
  const completedCount = steps.filter(s => s.status === "completed").length;
  const totalSteps = steps.length;

  return (
    <div className="card training-progress-card">
      <div className="progress-header">
        <div>
          <h3 className="section-title">Progression de l'entraînement</h3>
          <p className="progress-subtitle">
            {completedCount}/{totalSteps} étapes complétées
          </p>
        </div>
        {onToggleCompress && (
          <button className="compress-btn" onClick={onToggleCompress}>
            {isCompressed ? (
              <><ChevronDown size={13} /> Développer</>
            ) : (
              <><ChevronUp size={13} /> Compresser</>
            )}
          </button>
        )}
      </div>

      <div className={`progress-body ${isCompressed ? "compressed" : ""}`}>
        <CircularProgress pct={percent} />
        
        {!isCompressed && (
          <div className="steps-list">
            {steps.map((step) => (
              <div key={step.id} className="step-row">
                {statusIcon(step.status)}
                <span className="step-label">{step.label}</span>
                {statusLabel(step.status)}
              </div>
            ))}
          </div>
        )}
        
        {isCompressed && (
          <div className="steps-summary">
            <div className="summary-bar">
              <div 
                className="summary-progress" 
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="summary-stats">
              <span className="stat completed">✓ {steps.filter(s => s.status === "completed").length}</span>
              <span className="stat in-progress">⟳ {steps.filter(s => s.status === "in_progress").length}</span>
              <span className="stat pending">○ {steps.filter(s => s.status === "pending").length}</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .progress-subtitle {
          font-size: 12px;
          color: #6B7280;
          margin: 4px 0 0 0;
        }
        
        .progress-body.compressed {
          padding: 16px 0;
        }
        
        .steps-summary {
          margin-top: 16px;
          width: 100%;
        }
        
        .summary-bar {
          height: 6px;
          background-color: #F3F4F6;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        
        .summary-progress {
          height: 100%;
          background: linear-gradient(90deg, #F97316, #EA580C);
          border-radius: 10px;
          transition: width 0.3s ease;
        }
        
        .summary-stats {
          display: flex;
          gap: 16px;
          justify-content: center;
        }
        
        .summary-stats .stat {
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .stat.completed { color: #22c55e; }
        .stat.in-progress { color: #F97316; }
        .stat.pending { color: #9CA3AF; }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TrainingProgress;