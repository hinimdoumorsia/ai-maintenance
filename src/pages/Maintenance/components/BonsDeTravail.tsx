// src/pages/Maintenance/components/BonsDeTravail.tsx
import React, { useState } from "react";
import { ClipboardList } from "lucide-react";

interface BT {
  id_bt: number;
  numero_bt: string;
  titre: string;
  type_intervention: string;
  priorite: number;
  statut: string;
  date_creation: string | null;
  date_planifiee: string | null;
  nom_machine: string | null;
  code_machine: string | null;
  nom_atelier: string | null;
  prenom_nom_technicien: string | null;
  cout_estime: number | null;
  cout_reel: number | null;
}

interface BonsDeTravailProps {
  data: BT[];
  loading: boolean;
}

const STATUTS  = ["Tous", "cree", "planifie", "en_cours", "termine", "annule"];
const PRIORITES = ["Toutes", "1", "2", "3", "4"];

function statusLabel(s: string) {
  const M: Record<string, string> = {
    cree: "Créé", planifie: "Planifié", en_cours: "En cours",
    termine: "Terminé", annule: "Annulé",
  };
  return M[s] ?? s;
}

function formatDateShort(ds: string | null) {
  if (!ds) return "—";
  return new Date(ds).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const BonsDeTravail: React.FC<BonsDeTravailProps> = ({ data, loading }) => {
  const [statut,   setStatut]   = useState("Tous");
  const [priorite, setPriorite] = useState("Toutes");

  const filtered = data.filter(bt => {
    if (statut   !== "Tous"    && bt.statut          !== statut)         return false;
    if (priorite !== "Toutes"  && String(bt.priorite) !== priorite)      return false;
    return true;
  });

  return (
    <div className="maint-card">
      <div className="maint-card-head">
        <div className="maint-card-title">
          <ClipboardList size={15} style={{ color: "#f97316" }} />
          Bons de travail
        </div>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>
          {filtered.length} / {data.length} BT
        </span>
      </div>

      {/* Filtres */}
      <div className="maint-filter-bar">
        <span className="maint-filter-label">Statut :</span>
        {STATUTS.map(s => (
          <button
            key={s}
            className={`maint-filter-btn ${statut === s ? "active" : ""}`}
            onClick={() => setStatut(s)}
          >
            {s === "Tous" ? "Tous" : statusLabel(s)}
          </button>
        ))}
        <span className="maint-filter-label" style={{ marginLeft: 10 }}>Priorité :</span>
        {PRIORITES.map(p => (
          <button
            key={p}
            className={`maint-filter-btn ${priorite === p ? "active" : ""}`}
            onClick={() => setPriorite(p)}
          >
            {p === "Toutes" ? "Toutes" : `P${p}`}
          </button>
        ))}
      </div>

      <div className="maint-bt-header">
        <span>N° BT</span>
        <span>Machine / Titre</span>
        <span>Atelier</span>
        <span>Prio.</span>
        <span>Statut</span>
        <span>Date plan.</span>
        <span>Coût est.</span>
      </div>

      {loading && Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="maint-skeleton" style={{ height: 48, margin: "4px 16px", borderRadius: 8 }} />
      ))}

      {!loading && filtered.length === 0 && (
        <div className="maint-empty">Aucun bon de travail correspondant aux filtres</div>
      )}

      {!loading && filtered.map(bt => (
        <div className="maint-bt-row" key={bt.id_bt}>
          <span className="maint-bt-id">{bt.numero_bt}</span>

          <div>
            <div className="maint-bt-machine">{bt.nom_machine ?? "—"}</div>
            <div className="maint-bt-type">{bt.titre}</div>
          </div>

          <span style={{ fontSize: 11, color: "#6b7280" }}>{bt.nom_atelier ?? "—"}</span>

          <span className={`maint-prio p${bt.priorite}`}>P{bt.priorite}</span>

          <span className={`maint-status ${bt.statut}`}>{statusLabel(bt.statut)}</span>

          <span style={{ fontSize: 11, color: "#374151" }}>{formatDateShort(bt.date_planifiee)}</span>

          <span style={{ fontSize: 11, color: "#374151" }}>
            {bt.cout_estime != null ? `${bt.cout_estime.toLocaleString("fr-FR")} €` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
};

export default BonsDeTravail;
