// src/hooks/useDatasetForPage.ts
// Hook pour déterminer la compatibilité d'un dataset avec une page donnée

import { useMemo } from 'react';
import { useDatasets, DatasetMeta } from '../contexts/DatasetContext';

export interface PageRequirements {
  page: string;
  analysisType?: string; // type détecté requis (ex: 'vibration', 'kpi', 'maintenance')
  analysisTypes?: string[]; // types détectés autorisés (si plusieurs)
  requiredColumns?: string[]; // colonnes obligatoires
  minRows?: number;
  minCols?: number;
}

const PAGE_REQUIREMENTS: Record<string, PageRequirements> = {
  vibratoire: {
    page: 'Analyse Vibratoire',
    analysisType: 'vibration',
    requiredColumns: ['vibration', 'vrms'],
  },
  vibration: {
    page: 'Analyse Vibratoire',
    analysisType: 'vibration',
  },
  pronostic: {
    page: 'Pronostic & DRBF',
    analysisType: 'maintenance',
  },
  kpis: {
    page: 'KPIs & Performance',
    analysisType: 'kpi',
  },
  machines: {
    page: 'Parc machines',
    analysisType: 'machine',
  },
  capteurs: {
    page: 'Capteurs IoT',
    analysisTypes: ['generic', 'machine', 'vibration'],
  },
  vis: {
    page: 'Classification VIS',
    analysisType: 'maintenance',
  },
  default: {
    page: 'Vue Générale',
    analysisType: 'generic',
  },
};

export function useDatasetForPage(pageId: string, datasetId?: number | null) {
  const { datasets, selectedId } = useDatasets();
  const id = datasetId ?? selectedId;

  return useMemo(() => {
    const dataset = id ? datasets.find(d => d.id === id) : null;
    const requirements = PAGE_REQUIREMENTS[pageId];

    if (!dataset || !requirements) {
      return {
        dataset: null as DatasetMeta | null,
        isCompatible: false,
        missingColumns: [] as string[],
        analysisType: requirements?.analysisType,
        pageName: requirements?.page || pageId,
      };
    }

    const missingColumns: string[] = [];
    if (requirements.requiredColumns && dataset.status === 'processed') {
      // On ne peut vérifier les colonnes que si le dataset est processed
      // Les colonnes sont dans eda_results qui n'est pas dans DatasetMeta
      // Pour l'instant, on se base uniquement sur le type détecté
    }

    const typeMatches =
      (requirements.analysisTypes && requirements.analysisTypes.length > 0)
        ? requirements.analysisTypes.includes(dataset.detected_type || '')
        : (!requirements.analysisType || dataset.detected_type === requirements.analysisType);
    const isCompatible = typeMatches && missingColumns.length === 0;

    return {
      dataset,
      isCompatible,
      missingColumns,
      analysisType: requirements.analysisType,
      pageName: requirements.page,
    };
  }, [datasets, id, pageId]);
}

export default useDatasetForPage;
