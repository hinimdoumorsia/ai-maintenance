// types.ts — Page Données & Prédiction

export type StatusType = 'OK' | 'Alerte' | 'Panne';

export interface Observation {
  timestamp: string;
  machine_id: string;
  temperature: number;
  vibration: number;
  status: StatusType;
}

export interface StatistiqueApercu {
  total_observations: number;
  total_features: number;
  values_missings: number;
  features: number;
  valuers_desentations: number;
}

export interface KPIFiabilite {
  taux_disponibilite: number;       // ex: 95
  taux_disponibilite_cible: number; // ex: 94
  cible_atteinte: boolean;
}

export interface KPICouts {
  reduction_pourcentage: string;    // ex: "-20-30%"
  cible_atteinte: boolean;
}

export interface KPIProductivite {
  temps_arret_non_planifie: string; // ex: "-35-50%"
  oee: number;                      // ex: 150 (>150%)
  oee_progress: number;             // ex: 85
  cible_oee_atteinte: boolean;
}

export interface KPIPerformanceModele {
  precision: number;                // ex: 85
  precision_target: number;
  faux_positifs_pct: number;        // ex: 0
  faux_positifs_cible: number;      // ex: 10
  lead_time_h: number;              // ex: 72
  lead_time_progress: number;
}

export interface PredictionManuelle {
  temperature: string;
  vibration: string;
  pressure: string;
  status: StatusType;
  runtime: string;
}

export interface DonneesPageState {
  predictionFile: File | null;
  predictionManuelle: PredictionManuelle;
  apercu: StatistiqueApercu;
  observations: Observation[];
  kpiFiabilite: KPIFiabilite;
  kpiCouts: KPICouts;
  kpiProductivite: KPIProductivite;
  kpiModele: KPIPerformanceModele;
}