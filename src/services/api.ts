// services/api.ts

const API_BASE_URL = 'http://localhost:8000';

export interface TrainingJob {
  job_id: string;
  status: string;
}

export interface TrainingJobSummary {
  job_id: string;
  status: string;
  model_id?: string;
  created_at?: string;
}

export interface JobResultsEnvelope {
  job_id: string;
  status: string;
  result: unknown;
  n_logs: number;
}

export interface LogEntry {
  type: string;
  title: string;
  detail: string;
  time: string;
}

export interface TrainingResult {
  status: string;
  final_answer: string;
  logs: LogEntry[];
  context: {
    mlflow_run_id: string;
    model_uri: string;
    is_production: boolean;
    best_run: string;
    comparison: {
      primary_metric: string;
      baseline_score: number;
      cleaned_score: number;
      delta: number;
      winner: string;
    };
    feature_cols: string[];
    target_col: string;
    shape: number[];
  };
}

export async function uploadAndTrain(
  file: File,
  modelId: string,
  targetCol: string,
  groqApiKey: string = ''
): Promise<TrainingJob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model_id', modelId);
  formData.append('target_col', targetCol);
  if (groqApiKey) {
    formData.append('groq_api_key', groqApiKey);
  }

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function streamLogs(
  jobId: string,
  onLog: (log: LogEntry) => void,
  onDone: () => void,
  onError: (error: Error) => void
): Promise<() => void> {
  const eventSource = new EventSource(`${API_BASE_URL}/logs/${jobId}`);
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onLog(data);
      if (data.type === 'done' || data.type === 'error') {
        eventSource.close();
        onDone();
      }
    } catch (e) {
      console.error('Parse error:', e);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('EventSource error:', error);
    eventSource.close();
    onError(new Error('Connection lost with server'));
  };
  
  return () => eventSource.close();
}

export async function getResults(jobId: string): Promise<TrainingResult> {
  const response = await fetch(`${API_BASE_URL}/results/${jobId}`);
  if (!response.ok) {
    throw new Error(`Failed to get results: ${response.statusText}`);
  }
  return response.json();
}

export async function getHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  return response.json();
}

export async function listJobs(): Promise<TrainingJobSummary[]> {
  const response = await fetch(`${API_BASE_URL}/jobs`);
  if (!response.ok) {
    throw new Error(`Failed to list jobs: ${response.statusText}`);
  }
  return response.json();
}

export async function getJobResults(jobId: string): Promise<JobResultsEnvelope> {
  const response = await fetch(`${API_BASE_URL}/results/${jobId}`);
  if (!response.ok) {
    throw new Error(`Failed to get job results: ${response.statusText}`);
  }
  return response.json();
}

// ---- Predictions API -----------------------------------------------------
export interface PredictionResult {
  job_id?: string;
  predictions?: any;
  summary?: any;
}

export async function predictFile(
  file: File | Blob,
  modelId: string,
  options: Record<string, any> = {}
): Promise<PredictionResult> {
  const fd = new FormData();
  fd.append('file', file as any);
  fd.append('model_id', modelId);
  Object.entries(options).forEach(([k, v]) => fd.append(k, String(v)));

  const response = await fetch(`${API_BASE_URL}/api/predictions/predict`, {
    method: 'POST',
    body: fd,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Prediction failed: ${response.status} ${text}`);
  }
  return response.json();
}

export async function batchPredict(payload: any): Promise<PredictionResult> {
  const response = await fetch(`${API_BASE_URL}/api/predictions/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Batch predict failed: ${response.statusText}`);
  return response.json();
}

export async function streamPredictions(
  jobId: string | null,
  onEvent: (data: any) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<() => void> {
  const url = jobId ? `${API_BASE_URL}/api/predictions/stream?job_id=${jobId}` : `${API_BASE_URL}/api/predictions/stream`;
  const es = new EventSource(url);
  es.onmessage = (e) => {
    try {
      const d = JSON.parse(e.data);
      onEvent(d);
      if (d.type === 'done' || d.type === 'error') {
        es.close();
        onDone();
      }
    } catch (err) {
      console.error('streamPredictions parse', err);
    }
  };
  es.onerror = (ev) => {
    es.close();
    onError(new Error('Prediction stream error'));
  };
  return () => es.close();
}

export async function exportPredictions(jobId: string, format: string): Promise<Blob> {
  const response = await fetch(
    `${API_BASE_URL}/api/predictions/export?job_id=${encodeURIComponent(jobId)}&format=${encodeURIComponent(format)}`
  );
  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }
  return response.blob();
}

// ---- Tools API -----------------------------------------------------------
export async function getToolsDiagnostic(): Promise<{ status: string; checks: any[] }> {
  const response = await fetch(`${API_BASE_URL}/api/tools/diagnostic`);
  if (!response.ok) {
    throw new Error(`Diagnostics failed: ${response.statusText}`);
  }
  return response.json();
}

export async function getToolsLogs(): Promise<{ logs: any[] }> {
  const response = await fetch(`${API_BASE_URL}/api/tools/logs`);
  if (!response.ok) {
    throw new Error(`Logs fetch failed: ${response.statusText}`);
  }
  return response.json();
}

export async function getToolsDataQuality(): Promise<{ metrics: any[] }> {
  const response = await fetch(`${API_BASE_URL}/api/tools/data-quality`);
  if (!response.ok) {
    throw new Error(`Data quality failed: ${response.statusText}`);
  }
  return response.json();
}

export async function exportToolsData(payload: { format: string; period: string }): Promise<{ download_url?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/tools/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }
  return response.json();
}