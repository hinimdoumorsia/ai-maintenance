// src/pages/Donnees/components/KPICard.tsx
// Panneau bas droite : Contrôle des KPI - Cahier des Charges 2025-2026

import React from 'react';
import {
  KPIFiabilite,
  KPICouts,
  KPIProductivite,
  KPIPerformanceModele,
} from '../types';

/* ─── Donut SVG ──────────────────────────────────────────── */
const Donut: React.FC<{ pct: number; color: string; label: string }> = ({ pct, color, label }) => {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="donut-wrap">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle
          cx="26" cy="26" r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '26px 26px' }}
        />
      </svg>
      <div className="donut-text">{label}</div>
    </div>
  );
};

/* ─── Mini donut inline ─────────────────────────────────── */
const SmallDonut: React.FC<{ pct: number; color: string; size?: number }> = ({ pct, color, size = 36 }) => {
  const r = (size / 2) - 4;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transform: `rotate(-90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700, color: '#1e293b'
      }}>{pct}%</div>
    </div>
  );
};

/* ─── Props ──────────────────────────────────────────────── */
interface Props {
  fiabilite: KPIFiabilite;
  couts: KPICouts;
  productivite: KPIProductivite;
  modele: KPIPerformanceModele;
}

export const KPICard: React.FC<Props> = ({ fiabilite, couts, productivite, modele }) => {
  return (
    <div className="card kpi-card">
      <h2 className="card-title">
        <span className="card-icon">🎯</span>
        Contrôle des KPI - Cahier des Charges 2025-2026
      </h2>

      {/* Grille 2x2 pour les 4 sections principales */}
      <div className="kpi-grid-2x2">
        {/* a) KPI de Fiabilité */}
        <div className="kpi-section">
          <div className="kpi-section-title">a) KPI de Fiabilité</div>
          <div className="kpi-item">
            <div className="kpi-label">Taux de Disponibilité</div>
            <div className="kpi-value-row">
              <div>
                <div className="kpi-value">{fiabilite.taux_disponibilite}%</div>
                <div className="kpi-sub">Target/Cible</div>
              </div>
              <Donut pct={fiabilite.taux_disponibilite_cible} color="#f97316" label={`${fiabilite.taux_disponibilite_cible}%`} />
            </div>
            <div className={`kpi-cible ${fiabilite.cible_atteinte ? 'ok' : 'progress'}`}>
              {fiabilite.cible_atteinte ? '✅ Cible atteinte' : '🟡 En progrès'}
            </div>
          </div>
        </div>

        {/* b) KPI de Coûts */}
        <div className="kpi-section">
          <div className="kpi-section-title">b) KPI de Coûts</div>
          <div className="kpi-item">
            <div className="kpi-label">Coût Total</div>
            <div className="kpi-value-row">
              <div>
                <div className="kpi-value" style={{ fontSize: 16 }}>{couts.reduction_pourcentage}</div>
                <div className="kpi-sub">Réduction cible</div>
              </div>
              <div className="kpi-badge-orange">
                {couts.reduction_pourcentage}
              </div>
            </div>
            <div className={`kpi-cible ${couts.cible_atteinte ? 'ok' : 'progress'}`}>
              {couts.cible_atteinte ? '✅ Cible atteinte' : '🟡 En progrès'}
            </div>
          </div>
        </div>

        {/* c) KPI de Productivité */}
        <div className="kpi-section">
          <div className="kpi-section-title">c) KPI de Productivité</div>
          <div className="kpi-subsection">
            {/* Temps d'arrêt */}
            <div className="kpi-item-small">
              <div className="kpi-label">Temps d'arrêt non planifié</div>
              <div className="kpi-value-row">
                <div className="kpi-value-medium">{productivite.temps_arret_non_planifie}</div>
                <div className="kpi-badge-yellow">{productivite.temps_arret_non_planifie}</div>
              </div>
              <div className="kpi-cible ok">✅ Cible atteinte</div>
            </div>

            {/* OEE */}
            <div className="kpi-item-small">
              <div className="kpi-label">OEE</div>
              <div className="kpi-value-row">
                <div>
                  <div className="kpi-value">&gt;{productivite.oee}%</div>
                  <div className="kpi-sub">Cible &gt;150%</div>
                </div>
                <SmallDonut pct={productivite.oee_progress} color="#22c55e" />
              </div>
              <div className={`kpi-cible ${productivite.cible_oee_atteinte ? 'ok' : 'progress'}`}>
                {productivite.cible_oee_atteinte ? '✅ Cible atteinte' : '🟡 En progrès'}
              </div>
            </div>
          </div>
        </div>

        {/* d) KPI de Performance du Modèle */}
        <div className="kpi-section">
          <div className="kpi-section-title">d) KPI de Performance du Modèle</div>
          
          {/* Précision - ligne 1 */}
          <div className="kpi-model-row">
            <div className="kpi-model-item">
              <span className="kpi-model-label">Précision</span>
              <span className="kpi-model-current">{modele.precision}%</span>
              <span className="kpi-model-target">Target/Cible {modele.precision_target}%</span>
              <SmallDonut pct={modele.precision} color="#f97316" size={32} />
            </div>
            <div className="kpi-model-status success">✅ Atteint</div>
          </div>

          {/* Faux Positifs - ligne 2 */}
          <div className="kpi-model-row">
            <div className="kpi-model-item">
              <span className="kpi-model-label">Faux Positifs</span>
              <span className="kpi-model-current">{modele.faux_positifs_pct}%</span>
              <span className="kpi-model-target">&lt;{modele.faux_positifs_cible}%</span>
              <div className="kpi-zero-badge">{modele.faux_positifs_pct}%</div>
            </div>
            <div className="kpi-model-status success">✅ Atteint</div>
          </div>

          {/* Lead Time - ligne 3 */}
          <div className="kpi-model-row">
            <div className="kpi-model-item">
              <span className="kpi-model-label">Lead Time</span>
              <span className="kpi-model-current">{modele.lead_time_h}h</span>
              <span className="kpi-model-target">Cible {modele.lead_time_progress}h</span>
              <div className="kpi-lead-badge">{modele.lead_time_h}h</div>
            </div>
            <div className="kpi-model-status success">✅ Atteint</div>
          </div>
        </div>
      </div>
    </div>
  );
};