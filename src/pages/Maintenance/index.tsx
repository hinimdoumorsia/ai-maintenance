// src/pages/Maintenance/index.tsx
// Page Maintenance — Planning, Bons de travail, Stocks pièces

import React, { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { ClipboardList, CalendarCheck, Package, Wrench } from "lucide-react";
import Planning      from "./components/Planning";
import BonsDeTravail from "./components/BonsDeTravail";
import StocksPieces  from "./components/StocksPieces";
import "./maintenance.css";

const API = "http://localhost:8000/api/maintenance";

type TabId = "planning" | "bons" | "stocks";

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

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "planning", label: "Planning",         icon: CalendarCheck },
  { id: "bons",     label: "Bons de travail",  icon: ClipboardList },
  { id: "stocks",   label: "Stocks pièces",    icon: Package },
];

async function fetchApi<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API}${endpoint}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const MaintenancePage: React.FC = () => {
  const [tab,      setTab]      = useState<TabId>("planning");
  const [stats,    setStats]    = useState<MaintenanceStats | null>(null);
  const [planning, setPlanning] = useState<any[]>([]);
  const [bons,     setBons]     = useState<any[]>([]);
  const [stocks,   setStocks]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchApi<any>("/stats"),
      fetchApi<any[]>("/planning"),
      fetchApi<any[]>("/bons-de-travail"),
      fetchApi<any[]>("/stocks"),
    ])
      .then(([s, p, b, st]) => {
        setStats(s);
        setPlanning(p);
        setBons(b);
        setStocks(st);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const urgents = bons.filter(b => b.priorite === 1 && b.statut !== "termine" && b.statut !== "annule").length;

  return (
    <AppLayout
      title="Maintenance"
      subtitle="Planning · Bons de travail · Gestion des stocks"
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
              <div className="maint-stat-label">Urgents P1</div>
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
          </div>

          {/* ── Contenu des onglets ── */}
          {tab === "planning" && (
            <Planning data={planning} loading={loading} />
          )}
          {tab === "bons" && (
            <BonsDeTravail data={bons} loading={loading} />
          )}
          {tab === "stocks" && (
            <StocksPieces data={stocks} loading={loading} />
          )}

        </div>
      </div>
    </AppLayout>
  );
};

export default MaintenancePage;
