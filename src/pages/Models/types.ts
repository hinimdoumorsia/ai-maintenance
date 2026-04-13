export type ModelStatus = 'Deployed' | 'In-Training' | 'Archived';
export type ModelType = 'LSTM' | 'XGBoost' | 'Random Forest';

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

export interface DeployedModel {
  id: string;
  deployedAt: string;
  accuracyHistory: { epoch: number; loss: number; recall: number }[];
}

export interface ModelRegistry {
  id: string;
  name: string;
  version: string;
  versionNumber: number;
  icon: 'neural' | 'forest' | 'boost';
}