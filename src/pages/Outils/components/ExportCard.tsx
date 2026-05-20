import React, { useState } from "react";
import { Download, FileText, BarChart2, Wrench, TrendingUp, Database } from "lucide-react";
import { ExportOption, ExportFormat } from "../types";
import { exportToolsData } from "../../../services/api";

const EXPORT_OPTIONS: ExportOption[] = [
  { id: "csv",     label: "Données capteurs",  format: "CSV",     description: "Historique brut des capteurs",   icon: "chart" },
  { id: "json",    label: "Résultats ML",      format: "JSON",    description: "Prédictions et métadonnées",      icon: "wrench" },
  { id: "excel",   label: "Rapport KPI",       format: "Excel",   description: "Indicateurs de performance",      icon: "trending" },
  { id: "parquet", label: "Dataset complet",   format: "Parquet", description: "Format optimisé pour le ML",      icon: "database" },
];

const PERIOD_OPTIONS = ["Aujourd'hui", "7 derniers jours", "30 derniers jours", "3 derniers mois", "Personnalisé"];

const ExportCard: React.FC = () => {
  const [selected, setSelected] = useState<string>("csv");
  const [period, setPeriod]     = useState<string>("7 derniers jours");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportToolsData({ format: selected, period });
      if (res.download_url) {
        window.open(res.download_url, "_blank");
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="outil-card">
      <div className="outil-card-header">
        <div className="outil-card-title-wrap">
          <div className="outil-card-icon icon-blue"><Download size={16} /></div>
          <div>
            <div className="outil-card-title">Export de Données</div>
            <div className="outil-card-sub">Exporter vos données dans différents formats</div>
          </div>
        </div>
      </div>

      {/* Period selector */}
      <div className="export-field">
        <label className="export-label">Période</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="export-select"
        >
          {PERIOD_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Format options */}
      <div className="export-field">
        <label className="export-label">Format d'export</label>
        <div className="export-options">
          {EXPORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className={`export-option ${selected === opt.id ? "selected" : ""}`}
              onClick={() => setSelected(opt.id)}
            >
              <span className="export-format-badge">{opt.format}</span>
              <div className="export-option-info">
                <div className="export-option-label">{opt.label}</div>
                <div className="export-option-desc">{opt.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={handleExport} disabled={exporting}>
        <FileText size={14} />
        {exporting ? "Export en cours…" : `Exporter en ${EXPORT_OPTIONS.find((o) => o.id === selected)?.format ?? ""}`}
      </button>
    </div>
  );
};

export default ExportCard;
