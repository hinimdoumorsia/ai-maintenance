// src/pages/Maintenance/components/Historique.tsx
import React, { useState } from "react";
import { History, BarChart3, TrendingUp, TrendingDown, Calendar, User, Activity, FileText, Filter, X, Package } from "lucide-react";

interface HistoriqueEntry {
  id: number;
  type: string;
  action: string;
  description: string;
  utilisateur: string;
  date: string;
  details: string;
}

interface HistoriqueProps {
  data: HistoriqueEntry[];
  stats: any;
  loading: boolean;
  onRefresh?: () => void;
}

const Historique: React.FC<HistoriqueProps> = ({ data, stats, loading, onRefresh }) => {
  const [filterType, setFilterType] = useState<string>("all");
  const [showStats, setShowStats] = useState(true);

  const filteredData = filterType === "all" 
    ? data 
    : data.filter(entry => entry.type === filterType);

  const getTypeIcon = (type: string) => {
    switch(type) {
      case "bt": return <FileText size={14} className="text-orange-500" />;
      case "technicien": return <User size={14} className="text-blue-500" />;
      case "stock": return <Package size={14} className="text-green-500" />;
      case "statut": return <Activity size={14} className="text-purple-500" />;
      default: return <History size={14} className="text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case "bt": return "Bon de travail";
      case "technicien": return "Assignation technicien";
      case "stock": return "Mouvement stock";
      case "statut": return "Changement statut";
      default: return "Autre";
    }
  };

  return (
    <div className="maint-card">
      <div className="maint-card-head">
        <div className="maint-card-title">
          <History size={15} style={{ color: "#8b5cf6" }} />
          Historique des activités
        </div>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>
          {filteredData.length} événements
        </span>
      </div>

      {/* Filtres */}
      <div className="maint-filter-bar">
        <span className="maint-filter-label">Filtrer par :</span>
        <button
          className={`maint-filter-btn ${filterType === "all" ? "active" : ""}`}
          onClick={() => setFilterType("all")}
        >
          Tous
        </button>
        <button
          className={`maint-filter-btn ${filterType === "bt" ? "active" : ""}`}
          onClick={() => setFilterType("bt")}
        >
          <FileText size={11} /> Bons de travail
        </button>
        <button
          className={`maint-filter-btn ${filterType === "technicien" ? "active" : ""}`}
          onClick={() => setFilterType("technicien")}
        >
          <User size={11} /> Techniciens
        </button>
        <button
          className={`maint-filter-btn ${filterType === "statut" ? "active" : ""}`}
          onClick={() => setFilterType("statut")}
        >
          <Activity size={11} /> Statuts
        </button>
        <button
          className={`maint-filter-btn ${filterType === "stock" ? "active" : ""}`}
          onClick={() => setFilterType("stock")}
        >
          <Package size={11} /> Stocks
        </button>
        
        <button
          className="maint-filter-btn"
          onClick={() => setShowStats(!showStats)}
          style={{ marginLeft: "auto" }}
        >
          <BarChart3 size={11} /> {showStats ? "Masquer stats" : "Afficher stats"}
        </button>
      </div>

      {/* Statistiques globales */}
      {showStats && stats && (
        <div className="maint-stats-cards" style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", borderBottom: "1px solid #e5e7eb" }}>
          <div className="maint-stat-mini" style={{ background: "#f3f4f6", borderRadius: "8px", padding: "8px 12px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#f97316" }}>{stats?.total_actions || 0}</div>
            <div style={{ fontSize: "10px", color: "#6b7280" }}>Actions totales</div>
          </div>
          <div className="maint-stat-mini" style={{ background: "#f3f4f6", borderRadius: "8px", padding: "8px 12px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#10b981" }}>{stats?.bt_crees || 0}</div>
            <div style={{ fontSize: "10px", color: "#6b7280" }}>BT créés</div>
          </div>
          <div className="maint-stat-mini" style={{ background: "#f3f4f6", borderRadius: "8px", padding: "8px 12px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#3b82f6" }}>{stats?.assignations || 0}</div>
            <div style={{ fontSize: "10px", color: "#6b7280" }}>Assignations</div>
          </div>
          <div className="maint-stat-mini" style={{ background: "#f3f4f6", borderRadius: "8px", padding: "8px 12px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#8b5cf6" }}>{stats?.changements_statut || 0}</div>
            <div style={{ fontSize: "10px", color: "#6b7280" }}>Changements statut</div>
          </div>
        </div>
      )}

      {/* En-tête du tableau */}
      <div className="maint-history-header" style={{ display: "grid", gridTemplateColumns: "50px 1fr 80px 120px 100px 80px", gap: "10px", padding: "8px 16px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: "9px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>
        <span>Type</span>
        <span>Action / Description</span>
        <span>Utilisateur</span>
        <span>Date</span>
        <span>Détails</span>
        <span></span>
      </div>

      {loading && Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="maint-skeleton" style={{ height: 48, margin: "4px 16px", borderRadius: 8 }} />
      ))}

      {!loading && filteredData.length === 0 && (
        <div className="maint-empty">Aucun événement dans l'historique</div>
      )}

      {!loading && filteredData.map(entry => (
        <div key={entry.id} className="maint-history-row" style={{ display: "grid", gridTemplateColumns: "50px 1fr 80px 120px 100px 80px", gap: "10px", padding: "11px 16px", borderBottom: "1px solid #f9fafb", alignItems: "center", fontSize: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {getTypeIcon(entry.type)}
            <span style={{ fontSize: 10, color: "#6b7280" }}>{getTypeLabel(entry.type)}</span>
          </div>
          
          <div>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{entry.action}</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>{entry.description}</div>
          </div>
          
          <span style={{ fontSize: 11, color: "#6b7280" }}>{entry.utilisateur || "Système"}</span>
          
          <span style={{ fontSize: 11, color: "#374151" }}>
            {new Date(entry.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
          </span>
          
          <span style={{ fontSize: 10, color: "#9ca3af" }}>{entry.details}</span>
          
          <div></div>
        </div>
      ))}
    </div>
  );
};

export default Historique;