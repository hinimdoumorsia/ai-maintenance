import React, { useState } from "react";
import { Play, ChevronDown, Loader2 } from "lucide-react";

interface ActionButtonProps {
  onLaunch: () => void;
  onExport?: (format: "csv" | "excel" | "pdf") => void;
  loading?: boolean;
  canExport?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onLaunch, onExport, loading = false, canExport = true }) => {
  const [showDownload, setShowDownload] = useState(false);

  return (
    <div className="action-row">
      <button className="btn-launch" onClick={onLaunch} disabled={loading}>
        {loading ? (
          <><Loader2 size={20} className="spin" /> Analyse en cours…</>
        ) : (
          <><Play size={20} fill="white" /> Lancer Prédiction</>
        )}
        {!loading && (
          <p className="launch-sub">
            L'agent analysera vos données et générera des prédictions à partir du modèle sélectionné.
          </p>
        )}
      </button>

      <div className="download-btn-wrap">
        <button
          className="btn-download-pred"
          onClick={() => setShowDownload(!showDownload)}
          disabled={!canExport}
        >
          <span className="download-icon-sq">⊞</span>
          Telecharger les Prédictions...
          <ChevronDown size={14} />
        </button>
        {showDownload && (
          <div className="download-dropdown right">
            <button className="download-option" onClick={() => { onExport?.("csv"); setShowDownload(false); }}>Export CSV</button>
            <button className="download-option" onClick={() => { onExport?.("excel"); setShowDownload(false); }}>Export Excel</button>
            <button className="download-option" onClick={() => { onExport?.("pdf"); setShowDownload(false); }}>Export PDF</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionButton;
