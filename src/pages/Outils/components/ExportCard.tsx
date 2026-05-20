import React, { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { ExportOption } from "../types";
import { exportToolsData } from "../../../services/api";

const EXPORT_OPTIONS: ExportOption[] = [
  { id: "csv",     label: "Données capteurs",  format: "CSV",     description: "Historique brut des capteurs",   icon: "chart" },
  { id: "json",    label: "Résultats ML",      format: "JSON",    description: "Prédictions et métadonnées",      icon: "wrench" },
  { id: "excel",   label: "Rapport KPI",       format: "Excel",   description: "Indicateurs de performance",      icon: "trending" },
  { id: "parquet", label: "Dataset complet",   format: "Parquet", description: "Format optimisé pour le ML",      icon: "database" },
];

const PERIOD_OPTIONS = ["Aujourd'hui", "7 derniers jours", "30 derniers jours", "3 derniers mois"];

type FeedbackKind = "success" | "error";

const ExportCard: React.FC = () => {
  const [selected, setSelected] = useState<string>("csv");
  const [period, setPeriod]     = useState<string>("7 derniers jours");
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: FeedbackKind; message: string } | null>(null);

  // Auto-clear feedback après 5s
  useEffect(() => {
    if (!feedback) return;
    const id = window.setTimeout(() => setFeedback(null), 5000);
    return () => window.clearTimeout(id);
  }, [feedback]);

  const handleExport = async () => {
    setExporting(true);
    setFeedback(null);
    try {
      const res = await exportToolsData({ format: selected, period });
      if (res.download_url) {
        window.open(res.download_url, "_blank");
        const fmt = EXPORT_OPTIONS.find((o) => o.id === selected)?.format ?? selected;
        setFeedback({ kind: "success", message: `Export ${fmt} démarré dans un nouvel onglet.` });
      } else {
        setFeedback({ kind: "error", message: "Le backend n'a pas renvoyé d'URL de téléchargement." });
      }
    } catch (e: any) {
      setFeedback({ kind: "error", message: e?.message || "Export échoué" });
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
            <div className="outil-card-sub">Exporter les mesures depuis la base de données</div>
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
              type="button"
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

      {feedback && (
        <div style={{
          marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: 12,
          background: feedback.kind === "success" ? "#ecfdf5" : "#fef2f2",
          color: feedback.kind === "success" ? "#065f46" : "#b91c1c",
          border: `1px solid ${feedback.kind === "success" ? "#a7f3d0" : "#fecaca"}`,
        }}>
          {feedback.kind === "success" ? "✅" : "❌"} {feedback.message}
        </div>
      )}
    </div>
  );
};

export default ExportCard;
