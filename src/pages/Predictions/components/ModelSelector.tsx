import React, { useEffect, useRef, useState } from "react";
import { Settings, ChevronDown } from "lucide-react";
import { ModelOption } from "../types";
import { listAvailableModels, AvailableModel } from "../../../services/api";

interface ModelSelectorProps {
  value: ModelOption | null;
  onChange: (model: ModelOption) => void;
}

interface BadgeInfo {
  label: string;
  bg: string;
  fg: string;
}

function sourceBadge(source: AvailableModel["source"]): BadgeInfo | null {
  if (source === "production") return { label: "Production", bg: "#dcfce7", fg: "#15803d" };
  if (source === "staging") return { label: "Staging", bg: "#fef3c7", fg: "#92400e" };
  if (source === "latest") return { label: "Latest", bg: "#e0e7ff", fg: "#4338ca" };
  return null;
}

function buildOption(m: AvailableModel): ModelOption {
  return {
    id: m.id,
    name: m.name,
    description: m.description,
  };
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState<AvailableModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);

  // Refs pour accéder à value/onChange sans déclencher de re-fetch
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Fetch initial + polling 30s — exécuté UNE seule fois au montage
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // include_unavailable=true → on garde les 5 modèles connus en grisé pour
        // aider l'utilisateur à voir "voici ce que je peux entraîner, mais ce n'est pas encore prêt".
        const data = await listAvailableModels(true);
        if (!mounted) return;
        setAvailable(data.models);
        setWarning(data.warning ?? null);

        // Auto-sélection du 1er modèle disponible si rien n'est encore choisi
        if (!valueRef.current) {
          const firstAvailable = data.models.find((m) => m.available);
          if (firstAvailable) {
            onChangeRef.current(buildOption(firstAvailable));
          }
        }
      } catch (e: any) {
        if (!mounted) return;
        setWarning(e?.message || "Impossible de charger la liste des modèles");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const id = window.setInterval(load, 30000);
    return () => { mounted = false; window.clearInterval(id); };
  }, []);

  // Fermeture du dropdown au clic extérieur / touche Escape
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const currentMeta = value ? available.find((m) => m.id === value.id) : null;
  const currentBadge = currentMeta ? sourceBadge(currentMeta.source) : null;

  const handleSelect = (m: AvailableModel) => {
    if (!m.available) return;
    onChange(buildOption(m));
    setOpen(false);
  };

  const noAvailable = !loading && available.every((m) => !m.available);

  return (
    <div className="card model-selector-card">
      <div className="card-section-label">
        <span className="step-badge">2</span>
        <h3 className="section-title">Sélectionner un Modèle</h3>
      </div>

      <div className="model-dropdown-wrap" ref={wrapRef}>
        <button className="model-dropdown-btn" onClick={() => setOpen(!open)} disabled={loading && available.length === 0}>
          <div className="model-icon-wrap">
            <Settings size={18} color="#2563EB" />
          </div>
          <div className="model-info">
            {value ? (
              <>
                <span className="model-name">
                  {value.name}
                  {currentMeta?.current_version && (
                    <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 6 }}>
                      v{currentMeta.current_version}
                    </span>
                  )}
                </span>
                <span className="model-desc">{value.description}</span>
              </>
            ) : (
              <>
                <span className="model-name" style={{ color: "#94a3b8" }}>
                  {loading ? "Chargement…" : "Aucun modèle disponible"}
                </span>
                <span className="model-desc" style={{ color: "#cbd5e1" }}>
                  {loading ? "Interrogation du registre MLflow" : "Entraîne d'abord un modèle"}
                </span>
              </>
            )}
          </div>
          {currentBadge && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
              background: currentBadge.bg, color: currentBadge.fg, marginRight: 6,
            }}>
              {currentBadge.label}
            </span>
          )}
          <ChevronDown size={18} className={`dropdown-arrow ${open ? "open" : ""}`} />
        </button>

        {open && (
          <div className="model-dropdown-list">
            {loading && available.length === 0 && (
              <div style={{ padding: "8px 12px", fontSize: 12, color: "#94a3b8" }}>
                Chargement du registre MLflow…
              </div>
            )}
            {!loading && available.length === 0 && (
              <div style={{ padding: "8px 12px", fontSize: 12, color: "#94a3b8" }}>
                Aucun modèle enregistré dans MLflow.
              </div>
            )}
            {available.map((m) => {
              const badge = sourceBadge(m.source);
              const disabled = !m.available;
              return (
                <button
                  key={m.id}
                  className={`model-option ${value?.id === m.id ? "selected" : ""}`}
                  onClick={() => handleSelect(m)}
                  disabled={disabled}
                  style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                  title={disabled ? "Aucune version enregistrée dans MLflow — entraîne d'abord ce modèle." : undefined}
                >
                  <Settings size={15} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="model-opt-name" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {m.name}
                      {m.current_version && (
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>v{m.current_version}</span>
                      )}
                      {badge && (
                        <span style={{
                          fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 3,
                          background: badge.bg, color: badge.fg,
                        }}>
                          {badge.label}
                        </span>
                      )}
                      {!m.available && (
                        <span style={{ fontSize: 9, color: "#94a3b8" }}>(non entraîné)</span>
                      )}
                    </p>
                    <p className="model-opt-desc">
                      {m.description}
                      {m.score !== null && (
                        <span style={{ marginLeft: 6, color: "#16a34a" }}>
                          · score {m.score.toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              );
            })}
            {warning && (
              <div style={{ padding: "6px 12px", fontSize: 11, color: "#b91c1c" }}>
                ⚠ {warning}
              </div>
            )}
          </div>
        )}
      </div>

      {noAvailable && !warning && (
        <p style={{ marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
          Aucun modèle n'est encore entraîné. Va sur la page Entraînement pour en créer un.
        </p>
      )}
    </div>
  );
};

export default ModelSelector;
