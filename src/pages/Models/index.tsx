// src/pages/Models/index.tsx
import React, { useEffect, useMemo, useState } from 'react';
import './models.css';
import AppLayout from '../../components/AppLayout';
import { Package } from 'lucide-react';
import MesModeles          from './components/MesModeles';
import PerformanceComparee from './components/PerformanceComparee';
import NouveauModele       from './components/NouveauModele';
import PerformanceChart    from './components/PerformanceChart';   // ← nouveau
import GestionDeploiement  from './components/GestionDeploiement';
import RegistreModeles     from './components/RegistreModeles';
import { listJobs, getJobResults, JobResultsEnvelope, TrainingJobSummary } from '../../services/api';
import { Model, ModelRegistry, ModelStatus, ModelType, PerformanceData } from './types';

type ResultContext = {
  comparison?: {
    cleaned_score?: number;
    baseline_score?: number;
  };
};

function mapStatus(status: string): ModelStatus {
  if (status === 'done') return 'Deployed';
  if (status === 'running' || status === 'started') return 'In-Training';
  return 'Archived';
}

function mapModelType(modelId?: string): ModelType {
  const value = (modelId || '').toLowerCase();
  if (value.includes('lstm')) return 'LSTM';
  if (value.includes('xgboost')) return 'XGBoost';
  return 'Random Forest';
}

function mapRegistryIcon(type: ModelType): 'neural' | 'forest' | 'boost' {
  if (type === 'LSTM') return 'neural';
  if (type === 'XGBoost') return 'boost';
  return 'forest';
}

function formatCreatedAt(value?: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString();
}

const ModelsPage: React.FC = () => {
  const [jobs, setJobs] = useState<TrainingJobSummary[]>([]);
  const [resultsByJob, setResultsByJob] = useState<Record<string, JobResultsEnvelope>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const jobsData = await listJobs();
        if (!isMounted) return;
        setJobs(jobsData);

        const doneJobs = jobsData.filter((j) => j.status === 'done').slice(0, 10);
        const settled = await Promise.allSettled(doneJobs.map((j) => getJobResults(j.job_id)));
        if (!isMounted) return;

        const byId: Record<string, JobResultsEnvelope> = {};
        settled.forEach((entry) => {
          if (entry.status === 'fulfilled') {
            byId[entry.value.job_id] = entry.value;
          }
        });
        setResultsByJob(byId);
      } catch (e: unknown) {
        if (!isMounted) return;
        setError(e instanceof Error ? e.message : 'Impossible de charger les modèles');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    const intervalId = window.setInterval(load, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const models: Model[] = useMemo(() => {
    return jobs.slice(0, 12).map((job) => {
      const resultEnvelope = resultsByJob[job.job_id];
      const context = (resultEnvelope?.result as { context?: ResultContext } | undefined)?.context;
      const cleaned = context?.comparison?.cleaned_score;
      const baseline = context?.comparison?.baseline_score;
      const performance = typeof cleaned === 'number'
        ? cleaned
        : typeof baseline === 'number'
          ? baseline
          : 0;

      return {
        id: job.job_id,
        type: mapModelType(job.model_id),
        status: mapStatus(job.status),
        performance,
        createdAt: formatCreatedAt(job.created_at),
      };
    });
  }, [jobs, resultsByJob]);

  const performanceData: PerformanceData[] = useMemo(() => {
    const done = models.filter((m) => m.status === 'Deployed').slice(0, 3);
    if (done.length === 0) {
      return [];
    }
    return done.map((m) => ({
      modelName: `${m.type}_${m.id.slice(0, 6)}`,
      f1Score: m.performance,
      precision: Math.max(0, m.performance - 0.04),
      recall: Math.max(0, m.performance - 0.06),
    }));
  }, [models]);

  const registry: ModelRegistry[] = useMemo(() => {
    const latestByType = new Map<ModelType, Model>();
    models.forEach((m) => {
      if (!latestByType.has(m.type)) {
        latestByType.set(m.type, m);
      }
    });

    return Array.from(latestByType.values()).map((m, idx) => ({
      id: `${idx + 1}`,
      name: `${m.type}_${m.id.slice(0, 6)}`,
      version: `Version ${idx + 1}`,
      versionNumber: idx + 1,
      icon: mapRegistryIcon(m.type),
    }));
  }, [models]);

  return (
    <AppLayout
      title="Modèles"
      subtitle="Gérer, évaluer et déployer vos modèles de maintenance prédictive"
      icon={Package}
    >
      <div className="models-main">

        {/* Grille */}
        <div className="page-body">

          {/* Ligne 1 — Mes Modèles | Performance Comparée */}
          <MesModeles models={models} loading={loading} error={error} />
          <PerformanceComparee data={performanceData} />

          {/* Ligne 2 — Nouveau Modèle | Performance Globale (courbes) */}
          <NouveauModele />
          <PerformanceChart />          {/* ← placé exactement à droite de NouveauModele */}

          {/* Ligne 3 — Gestion de Déploiement | Registre des Modèles */}
          <div
            style={{
              gridColumn: '1 / -1',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '18px',
            }}
          >
            <GestionDeploiement />
            <RegistreModeles registry={registry} />
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

export default ModelsPage;