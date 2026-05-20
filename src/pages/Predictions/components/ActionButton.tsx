import React, { useState } from "react";
import { Play, ChevronDown, Loader2 } from "lucide-react";

interface ActionButtonProps {
  onLaunch: () => void;
  onExport?: (format: "csv" | "excel" | "pdf") => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onLaunch, onExport }) => {
  const [loading, setLoading] = useState(false);
  const [showDownload, setShowDownload] = useState(false);

  const handleLaunch = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLaunch();
    }, 2200);
  };

  return (
    <div className="action-row">
      <button className="btn-launch" onClick={handleLaunch} disabled={loading}>
        {loading ? (
          <><Loader2 size={20} className="spin" /> Analyse en cours…</>
        ) : (
          <><Play size={20} fill="white" /> Lancer Prédiction</>
        )}
        {!loading && (
          <p className="launch-sub">
            L'agent analysera vos données, génèrera des prédictions, basées sur votre modèle lle entraîncurl des options.
          </p>
        )}
      </button>

      <div className="download-btn-wrap">
        <button className="btn-download-pred" onClick={() => setShowDownload(!showDownload)}>
          <span className="download-icon-sq">⊞</span>
          Telecharger les Prédictions...
          <ChevronDown size={14} />
        </button>
        {showDownload && (
          <div className="download-dropdown right">
            <button className="download-option" onClick={() => onExport?.("csv")}>Export CSV</button>
            <button className="download-option" onClick={() => onExport?.("excel")}>Export Excel</button>
            <button className="download-option" onClick={() => onExport?.("pdf")}>Export PDF</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionButton;
