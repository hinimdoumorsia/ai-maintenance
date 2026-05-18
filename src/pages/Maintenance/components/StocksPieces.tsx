// src/pages/Maintenance/components/StocksPieces.tsx
import React, { useState } from "react";
import { Package, AlertTriangle, Edit3, X } from "lucide-react";

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
  onRefresh?: () => void;
}

const API = "http://localhost:8000/api/maintenance";

function formatDate(ds: string | null) {
  if (!ds) return "—";
  return new Date(ds).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

const StocksPieces: React.FC<StocksPiecesProps> = ({ data, loading, onRefresh }) => {
  const [onlyCritique, setOnlyCritique] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [newStockMin, setNewStockMin] = useState<number>(0);
  const [newStockMax, setNewStockMax] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const critCount = data.filter(p => p.stock_critique).length;
  const filtered = onlyCritique ? data.filter(p => p.stock_critique) : data;

  const openModal = (piece: Piece) => {
    setSelectedPiece(piece);
    setNewStockMin(piece.stock_min);
    setNewStockMax(piece.stock_max);
    setModalOpen(true);
  };

  const saveThresholds = async () => {
    if (!selectedPiece) return;
    setSaving(true);
    try {
      const response = await fetch(`${API}/stocks/${selectedPiece.id_piece}/seuil`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock_min: newStockMin,
          stock_max: newStockMax
        })
      });
      if (response.ok) {
        if (onRefresh) onRefresh();
        setModalOpen(false);
        alert("Seuils mis à jour avec succès");
      } else {
        alert("Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

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
        <span>Actions</span>
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

          <div>
            <button
              onClick={() => openModal(p)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#f97316",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11
              }}
              title="Modifier les seuils"
            >
              <Edit3 size={14} /> Seuils
            </button>
          </div>
        </div>
      ))}

      {/* Modal de modification des seuils - CORRIGÉ POUR LE THÈME SOMBRE */}
      {modalOpen && selectedPiece && (
        <div className="maint-modal-overlay" onClick={() => !saving && setModalOpen(false)}>
          <div className="maint-modal" onClick={e => e.stopPropagation()}>
            <div className="maint-modal-header">
              <h3>Modifier les seuils de stock</h3>
              <button className="maint-modal-close" onClick={() => !saving && setModalOpen(false)} disabled={saving}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveThresholds(); }}>
              <div className="maint-form-group">
                <label>Pièce</label>
                <input
                  type="text"
                  value={`${selectedPiece.reference} - ${selectedPiece.designation}`}
                  disabled
                  className="maint-input-disabled"
                />
              </div>

              <div className="maint-form-row">
                <div className="maint-form-group">
                  <label>Stock actuel</label>
                  <input
                    type="number"
                    value={selectedPiece.stock_actuel}
                    disabled
                    className="maint-input-disabled"
                  />
                </div>
              </div>

              <div className="maint-form-row">
                <div className="maint-form-group">
                  <label>Seuil minimum (alerte)</label>
                  <input
                    type="number"
                    value={newStockMin}
                    onChange={(e) => setNewStockMin(parseInt(e.target.value) || 0)}
                    min="0"
                    required
                    className="maint-input"
                  />
                  <small className="maint-input-small">
                    En dessous → alerte stock critique
                  </small>
                </div>

                <div className="maint-form-group">
                  <label>Seuil maximum</label>
                  <input
                    type="number"
                    value={newStockMax}
                    onChange={(e) => setNewStockMax(parseInt(e.target.value) || 0)}
                    min="0"
                    required
                    className="maint-input"
                  />
                  <small className="maint-input-small">
                    Objectif de réapprovisionnement
                  </small>
                </div>
              </div>

              <div className="maint-modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StocksPieces;