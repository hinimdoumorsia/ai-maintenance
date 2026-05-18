// src/pages/Maintenance/components/BonsDeTravail.tsx
import React, { useState, useEffect } from "react";
import { ClipboardList, UserCheck, UserX, FileText } from "lucide-react";
import { CSVLink } from "react-csv";

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

interface Technicien {
  id_technicien: number;
  nom_complet: string;
}

interface BonsDeTravailProps {
  data: BT[];
  loading: boolean;
  onRefresh?: () => void;
}

const STATUTS  = ["Tous", "cree", "planifie", "en_cours", "termine", "annule"];
const PRIORITES = ["Toutes", "1", "2", "3", "4"];
const STATUT_OPTIONS = [
  { value: "cree", label: "Créé" },
  { value: "planifie", label: "Planifié" },
  { value: "en_cours", label: "En cours" },
  { value: "termine", label: "Terminé" },
  { value: "annule", label: "Annulé" }
];

const API = "http://localhost:8000/api/maintenance";

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

function prioriteLabel(p: number) {
  const labels: Record<number, string> = { 1: "Urgente", 2: "Haute", 3: "Moyenne", 4: "Basse" };
  return labels[p] || "Moyenne";
}

function prioriteClass(p: number) {
  if (p === 1) return "p1";
  if (p === 2) return "p2";
  if (p === 3) return "p3";
  return "p4";
}

const BonsDeTravail: React.FC<BonsDeTravailProps> = ({ data, loading, onRefresh }) => {
  const [statut,   setStatut]   = useState("Tous");
  const [priorite, setPriorite] = useState("Toutes");
  const [selectedTechnicien, setSelectedTechnicien] = useState("");
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [selectedTech, setSelectedTech] = useState<Record<number, string>>({});
  const [localData, setLocalData] = useState<BT[]>(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  useEffect(() => {
    fetch(`${API}/techniciens`)
      .then(res => res.json())
      .then(setTechniciens)
      .catch(err => console.error("Erreur chargement techniciens:", err));
  }, []);

  const assignerTechnicien = async (id_bt: number, id_technicien: number | null) => {
    setAssigning(id_bt);
    try {
      const response = await fetch(`${API}/bons-de-travail/${id_bt}/assigner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_technicien: id_technicien || null })
      });
      const result = await response.json();
      
      if (result.success) {
        setLocalData(prev => prev.map(bt => 
          bt.id_bt === id_bt 
            ? { ...bt, prenom_nom_technicien: result.technicien || null }
            : bt
        ));
      }
      
      setSelectedTech(prev => ({ ...prev, [id_bt]: "" }));
      if (onRefresh) onRefresh();
      
    } catch (err) {
      console.error("Erreur assignation:", err);
      alert("Erreur lors de l'assignation");
    } finally {
      setAssigning(null);
    }
  };

  const updateStatut = async (id_bt: number, nouveauStatut: string) => {
    setUpdatingStatus(id_bt);
    try {
      const response = await fetch(`${API}/bons-de-travail/${id_bt}/statut`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: nouveauStatut })
      });
      const result = await response.json();
      
      if (result.success) {
        setLocalData(prev => prev.map(bt => 
          bt.id_bt === id_bt 
            ? { ...bt, statut: nouveauStatut }
            : bt
        ));
      }
      
      if (onRefresh) onRefresh();
      
    } catch (err) {
      console.error("Erreur mise à jour statut:", err);
      alert("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filtered = localData.filter(bt => {
    if (statut !== "Tous" && bt.statut !== statut) return false;
    if (priorite !== "Toutes" && String(bt.priorite) !== priorite) return false;
    if (selectedTechnicien && bt.prenom_nom_technicien !== selectedTechnicien) return false;
    return true;
  });

  // Données pour l'export CSV
  const exportData = filtered.map(bt => ({
    "N° BT": bt.numero_bt,
    "Titre": bt.titre,
    "Machine": bt.nom_machine,
    "Atelier": bt.nom_atelier,
    "Type": bt.type_intervention,
    "Priorité": prioriteLabel(bt.priorite),
    "Statut": statusLabel(bt.statut),
    "Date planifiée": bt.date_planifiee,
    "Technicien": bt.prenom_nom_technicien || "Non assigné"
  }));

  return (
    <div className="maint-card">
      <div className="maint-card-head">
        <div className="maint-card-title">
          <ClipboardList size={15} style={{ color: "#f97316" }} />
          Bons de travail
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <CSVLink
            data={exportData}
            filename={`bons-travail-${new Date().toISOString().slice(0, 19)}.csv`}
            className="export-btn"
            style={{
              background: "#6b7280",
              padding: "4px 10px",
              borderRadius: 6,
              color: "white",
              fontSize: 11,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <FileText size={12} /> Exporter CSV
          </CSVLink>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>
            {filtered.length} / {localData.length} BT
          </span>
        </div>
      </div>

      {/* Barre de filtres */}
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
        
        <span className="maint-filter-label" style={{ marginLeft: 10 }}>Technicien :</span>
        <select
          className="maint-filter-btn"
          value={selectedTechnicien}
          onChange={(e) => setSelectedTechnicien(e.target.value)}
          style={{ minWidth: 130 }}
        >
          <option value="">Tous</option>
          {techniciens.map(tech => (
            <option key={tech.id_technicien} value={tech.nom_complet}>
              {tech.nom_complet}
            </option>
          ))}
        </select>
      </div>

      {/* En-tête du tableau */}
      <div className="maint-bt-header">
        <span>N° BT</span>
        <span>Machine / Titre</span>
        <span>Atelier</span>
        <span>Prio.</span>
        <span>Statut</span>
        <span>Date plan.</span>
        <span>Technicien</span>
        <span>Action</span>
      </div>

      {/* Skeleton */}
      {loading && Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="maint-skeleton" style={{ height: 48, margin: "4px 16px", borderRadius: 8 }} />
      ))}

      {/* Aucun résultat */}
      {!loading && filtered.length === 0 && (
        <div className="maint-empty">Aucun bon de travail correspondant aux filtres</div>
      )}

      {/* Lignes du tableau */}
      {!loading && filtered.map(bt => (
        <div className="maint-bt-row" key={bt.id_bt}>
          <span className="maint-bt-id">{bt.numero_bt}</span>

          <div>
            <div className="maint-bt-machine">{bt.nom_machine ?? "—"}</div>
            <div className="maint-bt-type">{bt.titre}</div>
          </div>

          <span style={{ fontSize: 11, color: "#6b7280" }}>{bt.nom_atelier ?? "—"}</span>

          <span className={`maint-prio ${prioriteClass(bt.priorite)}`}>
            {prioriteLabel(bt.priorite).substring(0, 1)}P
          </span>

          {/* Selecteur de statut - VERT */}
          <div style={{ fontSize: 11 }}>
            <select
              value={bt.statut}
              onChange={(e) => updateStatut(bt.id_bt, e.target.value)}
              disabled={updatingStatus === bt.id_bt}
              className="status-select"
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                border: "1px solid #10b981",
                fontSize: 11,
                background: "#10b981",
                color: "white",
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              {STATUT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} style={{ background: "white", color: "#111827" }}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <span style={{ fontSize: 11, color: "#374151" }}>{formatDateShort(bt.date_planifiee)}</span>

          {/* Sélecteur technicien */}
          <div style={{ fontSize: 11 }}>
            <select
              value={selectedTech[bt.id_bt] || ""}
              onChange={(e) => setSelectedTech(prev => ({ ...prev, [bt.id_bt]: e.target.value }))}
              disabled={assigning === bt.id_bt}
              className="tech-select"
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 11,
                background: "white",
                color: "#111827",
                cursor: "pointer",
                width: "100%",
                minWidth: 180,
              }}
            >
              <option value="">Sélectionner un technicien</option>
              {techniciens.map(tech => (
                <option key={tech.id_technicien} value={tech.nom_complet}>
                  {tech.nom_complet}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {bt.prenom_nom_technicien ? (
              <>
                <span style={{ fontSize: 11, color: "#10b981", fontWeight: 500 }}>
                  {bt.prenom_nom_technicien}
                </span>
                <button
                  className="unassign-btn"
                  onClick={() => assignerTechnicien(bt.id_bt, null)}
                  disabled={assigning === bt.id_bt}
                  style={{
                    background: "#ef4444",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 8px",
                    cursor: "pointer",
                    color: "white",
                    fontSize: 10,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  <UserX size={11} /> Désassigner
                </button>
              </>
            ) : (
              <button
                className="assign-btn"
                onClick={() => {
                  const tech = techniciens.find(t => t.nom_complet === selectedTech[bt.id_bt]);
                  if (tech) {
                    assignerTechnicien(bt.id_bt, tech.id_technicien);
                  } else {
                    alert("Sélectionnez un technicien d'abord");
                  }
                }}
                disabled={assigning === bt.id_bt || !selectedTech[bt.id_bt]}
                style={{
                  background: "#10b981",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 8px",
                  cursor: "pointer",
                  color: "white",
                  fontSize: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <UserCheck size={11} /> Assigner
              </button>
            )}
            
            {/* Bouton Terminer */}
            {bt.statut !== "termine" && bt.statut !== "annule" && (
              <button
                className="terminer-btn"
                onClick={() => updateStatut(bt.id_bt, "termine")}
                disabled={updatingStatus === bt.id_bt}
                style={{
                  background: "#3b82f6",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 8px",
                  cursor: "pointer",
                  color: "white",
                  fontSize: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                ✓ Terminer
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BonsDeTravail;