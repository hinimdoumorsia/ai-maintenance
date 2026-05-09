// src/pages/Maintenance/components/StocksPieces.tsx
import React, { useState } from "react";
import { Package, AlertTriangle } from "lucide-react";

interface Piece {
  id_piece: number;
  reference: string;
  designation: string;
  categorie: string | null;
  stock_actuel: number;
  stock_min: number;
  stock_max: number;
  prix_unitaire: number | null;
  valeur_stock: number | null;
  stock_critique: boolean;
  derniere_sortie: string | null;
  sorties_30j: number;
  fournisseur: string | null;
  delai_approvisionnement_j: number | null;
}

interface StocksPiecesProps {
  data: Piece[];
  loading: boolean;
}

function formatDate(ds: string | null) {
  if (!ds) return "—";
  return new Date(ds).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

const StocksPieces: React.FC<StocksPiecesProps> = ({ data, loading }) => {
  const [onlyCritique, setOnlyCritique] = useState(false);

  const critCount = data.filter(p => p.stock_critique).length;
  const filtered  = onlyCritique ? data.filter(p => p.stock_critique) : data;

  return (
    <div className="maint-card">
      <div className="maint-card-head">
        <div className="maint-card-title">
          <Package size={15} style={{ color: "#8b5cf6" }} />
          Stocks pièces de rechange
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {critCount > 0 && (
            <span style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(239,68,68,0.08)", color: "#ef4444",
              borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
              border: "1px solid rgba(239,68,68,0.15)",
            }}>
              <AlertTriangle size={11} />
              {critCount} sous le seuil
            </span>
          )}
          <button
            className={`maint-filter-btn ${onlyCritique ? "active" : ""}`}
            onClick={() => setOnlyCritique(!onlyCritique)}
          >
            Stock critique
          </button>
        </div>
      </div>

      <div className="maint-stock-header">
        <span>Référence</span>
        <span>Désignation</span>
        <span>Catégorie</span>
        <span>Stock</span>
        <span>Min / Max</span>
        <span>Valeur</span>
        <span>Sortie 30j</span>
      </div>

      {loading && Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="maint-skeleton" style={{ height: 48, margin: "4px 16px", borderRadius: 8 }} />
      ))}

      {!loading && filtered.length === 0 && (
        <div className="maint-empty">Aucune pièce trouvée</div>
      )}

      {!loading && filtered.map(p => (
        <div
          key={p.id_piece}
          className={`maint-stock-row ${p.stock_critique ? "critique" : ""}`}
        >
          <span className="maint-stock-ref">{p.reference}</span>

          <div>
            <div className="maint-stock-name">{p.designation}</div>
            {p.fournisseur && (
              <div className="maint-stock-cat">{p.fournisseur}</div>
            )}
          </div>

          <span style={{ fontSize: 11, color: "#6b7280" }}>{p.categorie ?? "—"}</span>

          <span className={`maint-stock-qty ${p.stock_critique ? "critique" : p.stock_actuel <= p.stock_min * 1.5 ? "warn" : ""}`}>
            {p.stock_actuel}
          </span>

          <span style={{ fontSize: 11, color: "#6b7280" }}>
            {p.stock_min} / {p.stock_max}
          </span>

          <span style={{ fontSize: 11, color: "#374151" }}>
            {p.valeur_stock != null ? `${p.valeur_stock.toLocaleString("fr-FR")} €` : "—"}
          </span>

          <div>
            <div style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>{p.sorties_30j} unités</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>{formatDate(p.derniere_sortie)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StocksPieces;
