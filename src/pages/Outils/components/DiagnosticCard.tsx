import React, { useState } from "react";
import { Play, CheckCircle, XCircle, AlertTriangle, Loader, Stethoscope } from "lucide-react";
import { DiagnosticCheck, DiagnosticStatus } from "../types";
import { getToolsDiagnostic } from "../../../services/api";

const DiagnosticCard: React.FC = () => {
  const [status, setStatus] = useState<DiagnosticStatus>("idle");
  const [checks, setChecks] = useState<DiagnosticCheck[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setStatus("running");
    setErrorMsg(null);
    setChecks([]);
    try {
      const data = await getToolsDiagnostic();
      const next: DiagnosticCheck[] = (data.checks || []).map((c: any) => ({
        id: String(c.id ?? c.name ?? Math.random()),
        name: String(c.name ?? "Check"),
        description: c.description ?? "",
        status: c.status ?? "pending",
        detail: c.detail,
      }));
      setChecks(next);
      setStatus("success");
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.message || "Impossible de joindre le backend");
    }
  };

  const reset = () => {
    setStatus("idle");
    setChecks([]);
    setErrorMsg(null);
  };

  const icon = (check: DiagnosticCheck) => {
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
            <div className="outil-card-sub">Vérification des composants backend</div>
          </div>
        </div>
        {status === "success" && checks.length > 0 && (
          <span className={`outil-badge ${failCount > 0 ? "outil-badge-red" : warningCount > 0 ? "outil-badge-orange" : "outil-badge-green"}`}>
            {passCount} OK · {warningCount} avert. · {failCount} err.
          </span>
        )}
      </div>

      {status === "idle" && (
        <div style={{ padding: "24px 12px", textAlign: "center", color: "#94a3b8", fontStyle: "italic", fontSize: 13 }}>
          Cliquez sur « Lancer le diagnostic » pour vérifier l'état des composants.
        </div>
      )}

      {status === "running" && (
        <div style={{ padding: "24px 12px", textAlign: "center", color: "#64748b", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Loader size={16} className="diag-running" style={{ color: "#f97316" }} />
          Diagnostic en cours…
        </div>
      )}

      {status === "error" && (
        <div style={{ padding: "12px", color: "#b91c1c", fontSize: 13 }}>
          ❌ {errorMsg ?? "Erreur durant le diagnostic"}
        </div>
      )}

      {status === "success" && checks.length === 0 && (
        <div style={{ padding: "24px 12px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          Aucun composant à vérifier — le backend n'a renvoyé aucun check.
        </div>
      )}

      {checks.length > 0 && (
        <div className="diagnostic-checks">
          {checks.map((check) => (
            <div key={check.id} className="diag-item">
              <div className="diag-status-icon">{icon(check)}</div>
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
      )}

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
