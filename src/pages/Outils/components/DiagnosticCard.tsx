import React, { useState } from "react";
import { Play, CheckCircle, XCircle, AlertTriangle, Loader, Stethoscope } from "lucide-react";
import { DiagnosticCheck, DiagnosticStatus } from "../types";
import { getToolsDiagnostic } from "../../../services/api";

const INITIAL_CHECKS: DiagnosticCheck[] = [
  { id: "c1", name: "Connexion base de données",      description: "Vérifie la connexion à la base de données principale",   status: "pending" },
  { id: "c2", name: "Pipeline de prédiction",         description: "Vérifie que le pipeline ML est opérationnel",            status: "pending" },
  { id: "c3", name: "Intégrité des données capteurs", description: "Contrôle la cohérence et la fraîcheur des données",      status: "pending" },
  { id: "c4", name: "Modèles chargés en mémoire",     description: "Vérifie que tous les modèles actifs sont disponibles",   status: "pending" },
  { id: "c5", name: "API de collecte",                description: "Vérifie la disponibilité des APIs de collecte de données",status: "pending" },
];

const STATUS_AFTER: DiagnosticCheck["status"][] = ["pass", "pass", "warning", "pass", "fail"];

const DiagnosticCard: React.FC = () => {
  const [status, setStatus] = useState<DiagnosticStatus>("idle");
  const [checks, setChecks] = useState<DiagnosticCheck[]>(INITIAL_CHECKS);
  const [currentIdx, setCurrentIdx] = useState(-1);

  const runDiagnostic = async () => {
    setStatus("running");
    setCurrentIdx(0);
    const updated = INITIAL_CHECKS.map((c) => ({ ...c, status: "pending" as const }));
    setChecks(updated);
    try {
      const data = await getToolsDiagnostic();
      const next = (data.checks || []).map((c: any) => ({
        id: String(c.id || c.name),
        name: String(c.name || "Check"),
        description: c.description || "",
        status: c.status || "pending",
        detail: c.detail,
      }));
      setChecks(next.length ? next : updated);
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setChecks(updated.map((c) => ({ ...c, status: "fail", detail: "Erreur diagnostic" })));
    } finally {
      setCurrentIdx(-1);
    }
  };

  const reset = () => {
    setStatus("idle");
    setChecks(INITIAL_CHECKS);
    setCurrentIdx(-1);
  };

  const icon = (check: DiagnosticCheck, i: number) => {
    if (status === "running" && i === currentIdx)
      return <Loader size={16} className="diag-running" style={{ color: "#f97316" }} />;
    if (check.status === "pass")    return <CheckCircle  size={16} style={{ color: "#16a34a" }} />;
    if (check.status === "fail")    return <XCircle      size={16} style={{ color: "#dc2626" }} />;
    if (check.status === "warning") return <AlertTriangle size={16} style={{ color: "#f59e0b" }} />;
    return <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1.5px solid #d1d5db" }} />;
  };

  const passCount    = checks.filter((c) => c.status === "pass").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;
  const failCount    = checks.filter((c) => c.status === "fail").length;

  return (
    <div className="outil-card">
      <div className="outil-card-header">
        <div className="outil-card-title-wrap">
          <div className="outil-card-icon icon-orange"><Stethoscope size={16} /></div>
          <div>
            <div className="outil-card-title">Diagnostic Système</div>
            <div className="outil-card-sub">Vérification automatique des composants</div>
          </div>
        </div>
        {status === "success" && (
          <span className={`outil-badge ${failCount > 0 ? "outil-badge-red" : warningCount > 0 ? "outil-badge-orange" : "outil-badge-green"}`}>
            {passCount} OK · {warningCount} avert. · {failCount} err.
          </span>
        )}
      </div>

      <div className="diagnostic-checks">
        {checks.map((check, i) => (
          <div key={check.id} className="diag-item">
            <div className="diag-status-icon">{icon(check, i)}</div>
            <div className="diag-info">
              <div className="diag-name">{check.name}</div>
              {check.detail
                ? <div className="diag-detail">{check.detail}</div>
                : <div className="diag-detail" style={{ color: "#c4c9d4" }}>{check.description}</div>
              }
            </div>
          </div>
        ))}
      </div>

      <div className="diag-actions">
        <button className="btn-primary" onClick={runDiagnostic} disabled={status === "running"}>
          <Play size={14} />
          {status === "running" ? "Diagnostic en cours…" : "Lancer le diagnostic"}
        </button>
        {status !== "idle" && status !== "running" && (
          <button className="btn-secondary" onClick={reset}>Réinitialiser</button>
        )}
      </div>
    </div>
  );
};

export default DiagnosticCard;
