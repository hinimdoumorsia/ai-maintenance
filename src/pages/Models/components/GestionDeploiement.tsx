// src/pages/Models/components/GestionDeploiement.tsx
import React from 'react';
import { AvailableModel } from '../../../services/api';

interface GestionDeploiementProps {
  productionModel?: AvailableModel;
  onUndeploy?: () => void;
  onReplace?: () => void;
}

function formatTimestamp(ts: number | null | undefined): string {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

const STAGE_LABEL: Record<string, { label: string; bg: string; fg: string }> = {
  production: { label: 'Production', bg: '#dcfce7', fg: '#15803d' },
  staging:    { label: 'Staging',    bg: '#fef3c7', fg: '#92400e' },
  latest:     { label: 'Latest',     bg: '#e0e7ff', fg: '#4338ca' },
};

const GestionDeploiement: React.FC<GestionDeploiementProps> = ({
  productionModel,
  onUndeploy,
  onReplace,
}) => {
  const hasModel = Boolean(productionModel);
  const stageInfo = productionModel?.source ? STAGE_LABEL[productionModel.source] : null;
  const inProduction = productionModel?.source === 'production';

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <div style={{ width: 4, height: 20, background: 'var(--accent-orange)', borderRadius: 2 }} />
          <div>
            <div className="card-title">Gestion de Déploiement</div>
            <div className="card-subtitle">Modèle actuellement en service</div>
          </div>
        </div>
      </div>

      {hasModel ? (
        <>
          <div className="deployed-model-info">
            <div className="deployed-model-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--accent-blue)">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                {inProduction ? 'Modèle en Production' : 'Modèle disponible (non promu en Production)'}
              </div>
              <div className="deployed-model-name" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {productionModel!.name}
                {productionModel!.current_version && (
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    v{productionModel!.current_version}
                  </span>
                )}
                {stageInfo && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                    background: stageInfo.bg, color: stageInfo.fg,
                  }}>
                    {stageInfo.label}
                  </span>
                )}
              </div>
              <div className="deployed-model-meta">
                Dernière maj : {formatTimestamp(productionModel!.last_updated)}
                {productionModel!.score !== null && (
                  <> · score {productionModel!.score.toFixed(2)}</>
                )}
              </div>
            </div>
          </div>

          <div className="deploy-actions">
            <button
              type="button"
              className="btn-undeploy"
              onClick={onUndeploy}
              disabled={!inProduction}
              title={inProduction ? 'Archiver la version courante' : 'Pas en production'}
              style={!inProduction ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Undeploy
            </button>
            <button type="button" className="btn-replace" onClick={onReplace}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Remplacer
            </button>
          </div>
        </>
      ) : (
        <div style={{ padding: '32px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Aucun modèle déployé. Promeus un modèle en Production depuis la liste « Mes Modèles ».
        </div>
      )}
    </div>
  );
};

export default GestionDeploiement;
