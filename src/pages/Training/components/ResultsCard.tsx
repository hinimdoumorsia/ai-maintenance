import React from "react";
import { Settings, TrendingUp, TrendingDown, CheckCircle, AlertCircle } from "lucide-react";

interface ResultsCardProps {
  results: any;
  logs?: any[];
}

const ResultsCard: React.FC<ResultsCardProps> = ({ results, logs = [] }) => {
  console.log("ResultsCard - résultats reçus:", results);
  console.log("ResultsCard - logs reçus:", logs);
  
  let baselineScore = 0;
  let cleanedScore = 0;
  let winner = "baseline";
  let primaryMetric = "accuracy";
  
  // Essayer d'extraire depuis results
  if (results) {
    const comparison = results.comparison || results;
    baselineScore = comparison.baseline_score || 0;
    cleanedScore = comparison.cleaned_score || 0;
    winner = comparison.winner || (cleanedScore > baselineScore ? "cleaned" : "baseline");
    primaryMetric = comparison.primary_metric || "accuracy";
  }
  
  // Si pas de résultats, essayer d'extraire depuis les logs
  if (baselineScore === 0 && cleanedScore === 0 && logs.length > 0) {
    const trainLog = logs.find(l => l.title === "Résultat : train_model");
    if (trainLog && trainLog.detail) {
      const match = trainLog.detail.match(/baseline=([\d.]+)\s*\|\s*cleaned=([\d.]+)/);
      if (match) {
        baselineScore = parseFloat(match[1]);
        cleanedScore = parseFloat(match[2]);
        winner = cleanedScore > baselineScore ? "cleaned" : "baseline";
        console.log("Scores extraits des logs:", { baselineScore, cleanedScore });
      }
    }
  }
  
  // Aucune donnée disponible
  if (baselineScore === 0 && cleanedScore === 0) {
    return (
      <div className="card results-training-card">
        <div className="card-section-label" style={{ marginBottom: 12 }}>
          <span className="results-bar-icon" />
          <h3 className="section-title">Résultats</h3>
        </div>
        <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>
          <Settings size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p>Les résultats apparaîtront ici après l'entraînement</p>
        </div>
      </div>
    );
  }
  
  const bestScore = Math.max(baselineScore, cleanedScore);
  const delta = cleanedScore - baselineScore;
  const deltaPositive = delta >= 0;
  const bestRun = baselineScore > cleanedScore ? "Baseline" : "Cleaned";

  return (
    <div className="card results-training-card">
      <div className="card-section-label" style={{ marginBottom: 12 }}>
        <span className="results-bar-icon" />
        <h3 className="section-title">Résultats de l'entraînement</h3>
      </div>

      {/* Métriques principales */}
      <div className="metrics-grid">
        <div className="metric-chip blue">
          <span className="metric-label">{primaryMetric.toUpperCase()}</span>
          <span className="metric-value">{(bestScore * 100).toFixed(1)}%</span>
          <span className="metric-badge">{bestRun}</span>
        </div>
        <div className="metric-chip orange">
          <span className="metric-label">Baseline</span>
          <span className="metric-value">{(baselineScore * 100).toFixed(1)}%</span>
          <span className="metric-sub">(sans outliers)</span>
        </div>
        <div className="metric-chip green">
          <span className="metric-label">Cleaned</span>
          <span className="metric-value">{(cleanedScore * 100).toFixed(1)}%</span>
          <span className="metric-sub">(avec outliers traités)</span>
        </div>
        <div className={`metric-chip ${deltaPositive ? "purple" : "red"}`}>
          <span className="metric-label">Delta</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {deltaPositive ? (
              <TrendingUp size={14} color="#22c55e" />
            ) : (
              <TrendingDown size={14} color="#ef4444" />
            )}
            <span className="metric-value" style={{ color: deltaPositive ? "#22c55e" : "#ef4444" }}>
              {delta > 0 ? `+${(delta * 100).toFixed(1)}` : `${(delta * 100).toFixed(1)}`}%
            </span>
          </div>
        </div>
      </div>

      {/* Détails supplémentaires */}
      <div className="additional-metrics" style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
        <p className="additional-title" style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, color: "#6B7280" }}>
          Détails de l'entraînement
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <div style={{ fontSize: 12, color: "#374151" }}>
            <span style={{ fontWeight: 500 }}>Meilleur run:</span> {winner === "cleaned" ? "Cleaned" : "Baseline"}
          </div>
          <div style={{ fontSize: 12, color: "#374151" }}>
            <span style={{ fontWeight: 500 }}>Amélioration:</span> {deltaPositive ? "+" : ""}{(Math.abs(delta) * 100).toFixed(2)}%
          </div>
          <div style={{ fontSize: 12, color: "#374151" }}>
            <span style={{ fontWeight: 500 }}>Score final:</span> {(bestScore * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Information sur le résultat */}
      <div className="winner-info" style={{ 
        marginTop: 16, 
        padding: 12, 
        backgroundColor: "#F3E8FF", 
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        gap: 8
      }}>
        <span style={{ fontSize: 12, color: "#6B21A5" }}>
          📊 Modèle entraîné avec succès - Baseline: {(baselineScore * 100).toFixed(1)}% / Cleaned: {(cleanedScore * 100).toFixed(1)}%
        </span>
      </div>

      <style>{`
        .metric-chip {
          border-radius: 12px;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .metric-chip.blue { background: #EFF6FF; }
        .metric-chip.orange { background: #FFF7ED; }
        .metric-chip.green { background: #F0FDF4; }
        .metric-chip.purple { background: #F5F3FF; }
        .metric-chip.red { background: #FEF2F2; }
        .metric-label { font-size: 11px; font-weight: 500; color: #6B7280; }
        .metric-value { font-size: 20px; font-weight: 700; }
        .metric-sub { font-size: 9px; color: #9CA3AF; margin-top: 2px; }
        .metric-chip.blue .metric-value { color: #2563EB; }
        .metric-chip.orange .metric-value { color: #F97316; }
        .metric-chip.green .metric-value { color: #22c55e; }
        .metric-chip.purple .metric-value { color: #8B5CF6; }
        .metric-chip.red .metric-value { color: #ef4444; }
        .metric-badge {
          font-size: 9px;
          background-color: rgba(0,0,0,0.08);
          padding: 2px 6px;
          border-radius: 20px;
          margin-left: 8px;
          font-weight: normal;
          display: inline-block;
          width: fit-content;
        }
      `}</style>
    </div>
  );
};

export default ResultsCard;