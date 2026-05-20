// src/pages/Models/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './models.css';
import AppLayout from '../../components/AppLayout';
import { Package } from 'lucide-react';
import MesModeles          from './components/MesModeles';
import PerformanceComparee from './components/PerformanceComparee';
import NouveauModele       from './components/NouveauModele';
import PerformanceChart    from './components/PerformanceChart';
import GestionDeploiement  from './components/GestionDeploiement';
import RegistreModeles     from './components/RegistreModeles';
import {
  listAvailableModels,
  promoteModel,
  AvailableModel,
} from '../../services/api';
import { Model, ModelRegistry, ModelStatus, PerformanceData } from './types';

function statusFromSource(source: AvailableModel["source"], available: boolean): ModelStatus {
  if (!available) return 'Archived';
  if (source === 'production') return 'Deployed';
  if (source === 'staging') return 'In-Training';
  return 'Archived';
}

function registryIcon(modelId: string): 'neural' | 'forest' | 'boost' {
  const id = modelId.toLowerCase();
  if (id.includes('lstm') || id.includes('neural') || id.includes('dnn')) return 'neural';
  if (id.includes('xgb') || id.includes('lgbm') || id.includes('boost') || id.includes('cat')) return 'boost';
  return 'forest';
}

function formatLastUpdated(ts: number | null): string {
  if (!ts) return '-';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString();
}

const REFRESH_INTERVAL_MS = 15000;

const ModelsPage: React.FC = () => {
  const navigate = useNavigate();
  const [registry, setRegistry] = useState<AvailableModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await listAvailableModels();
      setRegistry(data.models);
      setError(data.warning ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les modèles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  // ── Vue tabulaire pour MesModeles ────────────────────────────────────────
  const models: Model[] = useMemo(() => {
    return registry.map((m) => ({
      id: m.id,
      type: m.name,
      status: statusFromSource(m.source, m.available),
      performance: m.score ?? 0,
      createdAt: formatLastUpdated(m.last_updated),
    }));
  }, [registry]);

  // ── Comparaison F1 / Precision / Recall depuis MLflow ─────────────────────
  // On garde uniquement les modèles classification (les seuls à avoir f1/precision/recall).
  // Les modèles régression apparaissent dans la liste mais pas dans ce graphique
  // (R² + RMSE n'ont pas de sens sur la même échelle 0-1).
  const performanceData: PerformanceData[] = useMemo(() => {
    return registry
      .filter((m) => m.available && m.metrics.f1 !== null)
      .slice(0, 5)
      .map((m) => ({
        modelName: m.name,
        f1Score: m.metrics.f1 ?? 0,
        precision: m.metrics.precision ?? 0,
        recall: m.metrics.recall ?? 0,
      }));
  }, [registry]);

  const registryList: ModelRegistry[] = useMemo(() => {
    return registry
      .filter((m) => m.available)
      .map((m, idx) => ({
        id: m.id,
        name: m.name,
        version: m.current_version ? `Version ${m.current_version}` : 'Aucune version',
        versionNumber: parseInt(m.current_version || '0', 10) || idx + 1,
        icon: registryIcon(m.id),
      }));
  }, [registry]);

  // Strictement le modèle au stage Production. Sinon on n'affiche RIEN dans GestionDeploiement
  // plutôt que de prétendre qu'un modèle Latest est en production.
  const productionModel: AvailableModel | undefined = useMemo(() => {
    return registry.find((m) => m.source === 'production' && m.available);
  }, [registry]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleView = useCallback((model: Model) => {
    navigate(`/entrainement?model_id=${encodeURIComponent(model.id)}`);
  }, [navigate]);

  const handleRetrain = useCallback((model: Model) => {
    navigate(`/entrainement?model_id=${encodeURIComponent(model.id)}`);
  }, [navigate]);

  const handleDeploy = useCallback(async (model: Model) => {
    try {
      setActionMessage(`Promotion de ${model.id} vers Production…`);
      const res = await promoteModel(model.id, 'Production');
      setActionMessage(`✅ ${model.id} v${res.version} est désormais en Production.`);
      await load();
    } catch (e: any) {
      setActionMessage(`❌ ${e?.message || 'Promotion échouée'}`);
    }
  }, [load]);

  const handleUndeploy = useCallback(async (model: Model) => {
    try {
      setActionMessage(`Archivage de ${model.id}…`);
      const res = await promoteModel(model.id, 'Archived');
      setActionMessage(`✅ ${model.id} v${res.version} archivé.`);
      await load();
    } catch (e: any) {
      setActionMessage(`❌ ${e?.message || 'Archivage échoué'}`);
    }
  }, [load]);

  // Efface le message d'action après 5s
  useEffect(() => {
    if (!actionMessage) return;
    const id = window.setTimeout(() => setActionMessage(null), 5000);
    return () => window.clearTimeout(id);
  }, [actionMessage]);

  return (
    <AppLayout
      title="Modèles"
      subtitle="Gérer, évaluer et déployer vos modèles de maintenance prédictive"
      icon={Package}
    >
      <div className="models-main">
        <div className="page-body">

          {actionMessage && (
            <div style={{
              gridColumn: '1 / -1',
              padding: '8px 14px',
              borderRadius: 8,
              background: actionMessage.startsWith('❌') ? '#fef2f2' : '#ecfdf5',
              color: actionMessage.startsWith('❌') ? '#b91c1c' : '#065f46',
              fontSize: 13,
              border: `1px solid ${actionMessage.startsWith('❌') ? '#fecaca' : '#a7f3d0'}`,
            }}>
              {actionMessage}
            </div>
          )}

          {/* Ligne 1 — Mes Modèles | Performance Comparée */}
          <MesModeles
            models={models}
            loading={loading}
            error={error}
            onView={handleView}
            onRetrain={handleRetrain}
            onDeploy={handleDeploy}
            onUndeploy={handleUndeploy}
          />
          <PerformanceComparee data={performanceData} />

          {/* Ligne 2 — Nouveau Modèle | Performance Globale */}
          <NouveauModele />
          <PerformanceChart />

          {/* Ligne 3 — Gestion de Déploiement | Registre des Modèles */}
          <div
            style={{
              gridColumn: '1 / -1',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '18px',
            }}
          >
            <GestionDeploiement
              productionModel={productionModel}
              onUndeploy={() => productionModel && handleUndeploy({
                id: productionModel.id,
                type: productionModel.name,
                status: 'Deployed',
                performance: productionModel.score ?? 0,
                createdAt: formatLastUpdated(productionModel.last_updated),
              })}
              onReplace={() => navigate('/entrainement')}
            />
            <RegistreModeles registry={registryList} />
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

export default ModelsPage;
