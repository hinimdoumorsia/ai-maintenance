// src/pages/Maintenance/index.tsx
// Page Maintenance — Planning, Bons de travail, Stocks pièces, Historique

import React, { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { ClipboardList, CalendarCheck, Package, Wrench, Plus, X, History, BarChart3, Trash2 } from "lucide-react";
import Planning      from "./components/Planning";
import BonsDeTravail from "./components/BonsDeTravail";
import StocksPieces  from "./components/StocksPieces";
import Historique from "./components/Historique";
import "./maintenance.css";

const API = "http://localhost:8000/api/maintenance";

type TabId = "planning" | "bons" | "stocks" | "historique";

interface MaintenanceStats {
  bt_ouverts: number;
  bt_en_cours: number;
  bt_urgents: number;
  bt_termines: number;
  stocks_critiques: number;
  total_references: number;
  valeur_stock_total: number | null;
  mttr_moyen_h: number | null;
  interventions_reussies: number;
}

interface Machine {
  id_machine: number;
  code_machine: string;
  nom_machine: string;
}

interface HistoriqueEntry {
  id: number;
  type: string;
  action: string;
  description: string;
  utilisateur: string;
  date: string;
  details: string;
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "planning",   label: "Planning",        icon: CalendarCheck },
  { id: "bons",       label: "Bons de travail", icon: ClipboardList },
  { id: "stocks",     label: "Stocks pièces",   icon: Package },
  { id: "historique", label: "Historique",      icon: History },
];

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${endpoint}`, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const MaintenancePage: React.FC = () => {
  const [tab,           setTab]           = useState<TabId>("planning");
  const [stats,         setStats]         = useState<MaintenanceStats | null>(null);
  const [planning,      setPlanning]      = useState<any[]>([]);
  const [bons,          setBons]          = useState<any[]>([]);
  const [stocks,        setStocks]        = useState<any[]>([]);
  const [machines,      setMachines]      = useState<Machine[]>([]);
  const [historique,    setHistorique]    = useState<HistoriqueEntry[]>([]);
  const [statsGlobaux,  setStatsGlobaux]  = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [showCreateBT,  setShowCreateBT]  = useState(false);
  const [creating,      setCreating]      = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    type_intervention: "predictif",
    priorite: "moyenne",
    date_planifiee: new Date().toISOString().split("T")[0],
    id_machine: ""
  });

  const loadAllData = async () => {
    setLoading(true);
    
    // Charger les stats
    fetchApi<MaintenanceStats>("/stats")
      .then(s => setStats(s))
      .catch(err => { console.error("Stats error:", err); setStats(null); });
    
    // Charger le planning
    fetchApi<any[]>("/planning")
      .then(p => setPlanning(p))
      .catch(err => { console.error("Planning error:", err); setPlanning([]); });
    
    // Charger les bons de travail
    fetchApi<any[]>("/bons-de-travail")
      .then(b => setBons(b))
      .catch(err => { console.error("Bons error:", err); setBons([]); });
    
    // Charger les stocks
    fetchApi<any[]>("/stocks")
      .then(st => setStocks(st))
      .catch(err => { console.error("Stocks error:", err); setStocks([]); });
    
    // Charger les machines
    fetchApi<Machine[]>("/machines")
      .then(m => setMachines(m))
      .catch(err => { console.error("Machines error:", err); setMachines([]); });
    
    // Charger l'historique
    Promise.all([
      fetchApi<any>("/historique/stats").catch(() => null),
      fetchApi<HistoriqueEntry[]>("/historique").catch(() => [])
    ]).then(([statsH, history]) => {
      setStatsGlobaux(statsH);
      setHistorique(history);
    }).catch(console.error);
    
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateBT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id_machine) {
      alert("Veuillez sélectionner une machine");
      return;
    }
    setCreating(true);
    try {
      await fetchApi("/bons-de-travail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          priorite: formData.priorite,
          type_intervention: formData.type_intervention
        })
      });
      setShowCreateBT(false);
      setFormData({
        description: "",
        type_intervention: "predictif",
        priorite: "moyenne",
        date_planifiee: new Date().toISOString().split("T")[0],
        id_machine: ""
      });
      await loadAllData();
    } catch (err) {
      console.error("Erreur création BT:", err);
      alert("Erreur lors de la création du bon de travail");
    } finally {
      setCreating(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm("Êtes-vous sûr de vouloir effacer tout l'historique ?")) {
      try {
        await fetch(`${API}/historique/clear`, { method: "DELETE" });
        await loadAllData();
        alert("Historique effacé");
      } catch (err) {
        console.error("Erreur effacement historique:", err);
        alert("Erreur lors de l'effacement");
      }
    }
  };

  const urgents = bons.filter(b => b.priorite === "urgente" && b.statut !== "termine" && b.statut !== "annule").length;

  return (
    <AppLayout
      title="Maintenance"
      subtitle="Planning · Bons de travail · Gestion des stocks · Historique"
      icon={Wrench}
      notifCount={urgents}
    >
      <div className="maint-main">
        <div className="maint-body">

          {/* ── Stats KPI bar ── */}
          <div className="maint-stats-bar">
            <div className="maint-stat">
              <div className="maint-stat-label">BT ouverts</div>
              <div className="maint-stat-value">{loading ? "—" : (stats?.bt_ouverts ?? 0)}</div>
              <div className="maint-stat-meta">Créés + planifiés</div>
            </div>
            <div className="maint-stat">
              <div className="maint-stat-label">En cours</div>
              <div className="maint-stat-value">{loading ? "—" : (stats?.bt_en_cours ?? 0)}</div>
              <div className="maint-stat-meta">Interventions actives</div>
            </div>
            <div className={`maint-stat ${(stats?.bt_urgents ?? 0) > 0 ? "urgent" : ""}`}>
              <div className="maint-stat-label">Urgents</div>
              <div className="maint-stat-value">{loading ? "—" : (stats?.bt_urgents ?? 0)}</div>
              <div className="maint-stat-meta">Priorité maximale</div>
            </div>
            <div className={`maint-stat ${(stats?.stocks_critiques ?? 0) > 0 ? "warn" : ""}`}>
              <div className="maint-stat-label">Stocks critiques</div>
              <div className="maint-stat-value">{loading ? "—" : (stats?.stocks_critiques ?? 0)}</div>
              <div className="maint-stat-meta">Sous le seuil min.</div>
            </div>
            <div className="maint-stat">
              <div className="maint-stat-label">MTTR moyen</div>
              <div className="maint-stat-value">
                {loading ? "—" : (stats?.mttr_moyen_h != null ? `${stats.mttr_moyen_h}h` : "—")}
              </div>
              <div className="maint-stat-meta">Temps de remise en route</div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="maint-tabs">
            {TABS.map(t => {
              const Icon = t.icon;
              const badge =
                t.id === "bons"   ? (stats?.bt_urgents ?? 0) :
                t.id === "stocks" ? (stats?.stocks_critiques ?? 0) : 0;
              return (
                <button
                  key={t.id}
                  className={`maint-tab ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  <Icon size={14} />
                  {t.label}
                  {badge > 0 && <span className="maint-tab-badge">{badge}</span>}
                </button>
              );
            })}
            
            {/* Bouton Nouveau BT - visible dans l'onglet "bons" */}
            {tab === "bons" && (
              <button 
                className="maint-tab btn-new-bt"
                onClick={() => setShowCreateBT(true)}
                style={{ marginLeft: "auto", background: "#f97316", color: "white", gap: "6px" }}
              >
                <Plus size={14} />
                Nouveau BT
              </button>
            )}
            
            {/* Bouton effacer historique - visible dans l'onglet "historique" */}
            {tab === "historique" && (
              <button 
                className="maint-tab btn-clear-history"
                onClick={handleClearHistory}
                style={{ marginLeft: "auto", background: "#ef4444", color: "white", gap: "6px" }}
              >
                <Trash2 size={14} />
                Effacer l'historique
              </button>
            )}
          </div>

          {/* ── Contenu des onglets ── */}
          {tab === "planning" && (
            <Planning data={planning} loading={loading} />
          )}
          {tab === "bons" && (
            <BonsDeTravail data={bons} loading={loading} onRefresh={loadAllData} />
          )}
          {tab === "stocks" && (
            <StocksPieces data={stocks} loading={loading} />
          )}
          {tab === "historique" && (
            <Historique 
              data={historique} 
              stats={statsGlobaux} 
              loading={loading} 
              onRefresh={loadAllData}
            />
          )}

        </div>
      </div>

      {/* ── MODAL DE CRÉATION BT ── */}
      {showCreateBT && (
        <div className="maint-modal-overlay" onClick={() => !creating && setShowCreateBT(false)}>
          <div className="maint-modal" onClick={e => e.stopPropagation()}>
            <div className="maint-modal-header">
              <h3>Nouveau bon de travail</h3>
              <button className="maint-modal-close" onClick={() => !creating && setShowCreateBT(false)} disabled={creating}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateBT}>
              <div className="maint-form-group">
                <label>Description / Titre *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  placeholder="Décrire l'intervention à réaliser..."
                />
              </div>

              <div className="maint-form-row">
                <div className="maint-form-group">
                  <label>Machine *</label>
                  <select
                    required
                    value={formData.id_machine}
                    onChange={e => setFormData({...formData, id_machine: e.target.value})}
                  >
                    <option value="">Sélectionner une machine</option>
                    {machines.map(m => (
                      <option key={m.id_machine} value={m.id_machine}>
                        {m.code_machine} - {m.nom_machine}
                      </option>
                    ))}
                  </select>
                  {machines.length === 0 && !loading && (
                    <p style={{ fontSize: 11, color: "#ef4444", marginTop: 5 }}>
                      Aucune machine disponible. Veuillez en ajouter une dans Paramètres.
                    </p>
                  )}
                </div>

                <div className="maint-form-group">
                  <label>Type d'intervention</label>
                  <select
                    value={formData.type_intervention}
                    onChange={e => setFormData({...formData, type_intervention: e.target.value})}
                  >
                    <option value="predictif">Prédictif</option>
                    <option value="preventif">Préventif</option>
                    <option value="correctif">Correctif</option>
                    <option value="conditionnel">Conditionnel</option>
                  </select>
                </div>
              </div>

              <div className="maint-form-row">
                <div className="maint-form-group">
                  <label>Priorité</label>
                  <select
                    value={formData.priorite}
                    onChange={e => setFormData({...formData, priorite: e.target.value})}
                  >
                    <option value="basse">Basse</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="haute">Haute</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div className="maint-form-group">
                  <label>Date planifiée</label>
                  <input
                    type="date"
                    value={formData.date_planifiee}
                    onChange={e => setFormData({...formData, date_planifiee: e.target.value})}
                  />
                </div>
              </div>

              <div className="maint-modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateBT(false)} disabled={creating}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? "Création..." : "Créer le BT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default MaintenancePage;