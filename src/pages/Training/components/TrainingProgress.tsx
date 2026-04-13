import React from "react";
import { CheckCircle, Circle, Loader2, Download, ChevronDown } from "lucide-react";
import { TrainingStep } from "../types";

interface TrainingProgressProps {
  steps: TrainingStep[];
  percent: number;
  running: boolean;
}

const statusIcon = (s: TrainingStep["status"]) => {
  if (s === "completed") return <CheckCircle size={16} color="#22c55e" />;
  if (s === "in_progress") return <Loader2 size={16} color="#F97316" className="spin" />;
  return <Circle size={16} color="#F97316" />;
};

const statusLabel = (s: TrainingStep["status"]) => {
  if (s === "completed") return <span className="step-status completed">Completed</span>;
  if (s === "in_progress") return <span className="step-status in-progress">T'mnors</span>;
  return <span className="step-status pending">Pende</span>;
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
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#6B7280">En cours</text>
    </svg>
  );
};

const TrainingProgress: React.FC<TrainingProgressProps> = ({ steps, percent, running }) => {
  return (
    <div className="card training-progress-card">
      <div className="progress-header">
        <h3 className="section-title">Progression de l'entrainement</h3>
        <button className="compress-btn">
          <Download size={13} /> Compress <ChevronDown size={13} />
        </button>
      </div>

      <div className="progress-body">
        <CircularProgress pct={percent} />
        <div className="steps-list">
          {steps.map((step) => (
            <div key={step.id} className="step-row">
              {statusIcon(step.status)}
              <span className="step-label">{step.label}</span>
              {statusLabel(step.status)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainingProgress;
