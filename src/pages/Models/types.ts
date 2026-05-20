export type ModelStatus = 'Deployed' | 'In-Training' | 'Archived';
// ModelType reste un string libre — on accepte tout nom renvoyé par le backend MLflow
export type ModelType = string;

export interface Model {
  id: string;
  type: ModelType;
  status: ModelStatus;
  performance: number;
  createdAt: string;
}

export interface PerformanceData {
  modelName: string;
  f1Score: number;
  precision: number;
  recall: number;
}

export interface ModelRegistry {
  id: string;
  name: string;
  version: string;
  versionNumber: number;
  icon: 'neural' | 'forest' | 'boost';
}
