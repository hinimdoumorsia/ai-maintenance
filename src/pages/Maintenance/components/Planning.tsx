// src/pages/Maintenance/components/Planning.tsx
import React from "react";
import { CalendarCheck } from "lucide-react";

interface BT {
  id_bt: number;
  numero_bt: string;
  titre: string;
  type_intervention: string;
  priorite: number;
  statut: string;
  date_planifiee: string | null;
  nom_machine: string | null;
  code_machine: string | null;
  nom_atelier: string | null;
  technicien: string | null;  // ← MODIFIÉ : prenom_nom_technicien → technicien
}

interface PlanningProps {
  data: BT[];
  loading: boolean;
}

function prioClass(p: number) {
  if (p === 1) return "p1";
  if (p === 2) return "p2";
  if (p === 3) return "p3";
  return "p4";
}

function formatDate(ds: string | null) {
  if (!ds) return { day: "—", month: "" };
  const d = new Date(ds);
  return {
    day:   d.getDate().toString().padStart(2, "0"),
    month: d.toLocaleString("fr-FR", { month: "short" }),
  };
}

function statusLabel(s: string) {
  const MAP: Record<string, string> = {
    cree: "Créé", planifie: "Planifié", en_cours: "En cours",
    termine: "Terminé", annule: "Annulé",
  };
  return MAP[s] ?? s;
}

const Planning: React.FC<PlanningProps> = ({ data, loading }) => {
  return (
    <div className="maint-card">
      <div className="maint-card-head">
        <div className="maint-card-title">
          <CalendarCheck size={15} style={{ color: "#3b82f6" }} />
          Planning des interventions à venir
        </div>
        <span style={{ fontSize: 11, color: "var(--theme-text-faint)" }}>
          {data.length} BT planifié{data.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="maint-plan-header">
        <span>Date</span>
        <span>BT / Machine</span>
        <span>Type</span>
        <span>Priorité</span>
        <span>Statut</span>
        <span>Technicien</span>
      </div>

      {loading && Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="maint-skeleton" style={{ height: 52, margin: "4px 16px", borderRadius: 8 }} />
      ))}

      {!loading && data.length === 0 && (
        <div className="maint-empty">Aucun BT planifié</div>
      )}

      {!loading && data.map(bt => {
        const { day, month } = formatDate(bt.date_planifiee);
        return (
          <div className="maint-plan-row" key={bt.id_bt}>
            <div className="maint-date-cell">
              <span className="maint-date-day">{day}</span>
              <span className="maint-date-month">{month}</span>
            </div>

            <div>
              <div className="maint-bt-machine">
                {bt.nom_machine ?? "—"}
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--theme-text-faint)", marginLeft: 6 }}>
                  #{bt.numero_bt}
                </span>
              </div>
              <div className="maint-bt-type">{bt.titre}</div>
            </div>

            <span style={{ fontSize: 11, color: "var(--theme-text)" }}>{bt.type_intervention}</span>

            <span className={`maint-prio p${bt.priorite}`}>P{bt.priorite}</span>

            <span className={`maint-status ${bt.statut}`}>{statusLabel(bt.statut)}</span>

            <span style={{ fontSize: 11, color: "var(--theme-text-muted)" }}>
              {bt.prenom_nom_technicien ?? "Non assigné"}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default Planning;