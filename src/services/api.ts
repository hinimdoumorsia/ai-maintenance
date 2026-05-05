// services/api.ts

const API_BASE_URL = 'http://localhost:8000';

export interface TrainingJob {
  job_id: string;
  status: string;
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