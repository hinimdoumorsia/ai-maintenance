// src/contexts/DatasetContext.tsx
// Context global — datasets uploadés + dataset sélectionné pour toutes les pages

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

export const API = 'http://localhost:8000';

/* ─── Types ─────────────────────────────────────────────── */
export interface DatasetMeta {
  id: number;
  name: string;
  description: string | null;
  original_filename: string;
  file_type: string | null;
  file_size_bytes: number | null;
  n_rows: number | null;
  n_cols: number | null;
  detected_type: string | null;
  status: 'uploaded' | 'processing' | 'processed' | 'error';
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
}

export interface DatasetFull extends DatasetMeta {
  eda_results: EDAFrame[] | null;
}

export interface EDAFrame {
  frame_name: string;
  data_type: string;
  summary: {
    n_rows: number;
    n_cols: number;
    n_numeric: number;
    n_categorical: number;
    missing_total: number;
    missing_pct: number;
    duplicates: number;
    columns: ColumnInfo[];
  };
  llm_result: {
    preprocessing_plan: string;
    narrative: string;
    feature_recommendations: string;
  };
  plots: { title: string; path: string; b64: string }[];
  encoding_maps: Record<string, { type: string; mapping: Record<string, number> }>;
  processed_path: string;
  report_path: string;
}

export interface ColumnInfo {
  name: string;
  dtype: string;
  type: 'numeric' | 'categorical';
  missing: number;
  missing_pct: number;
  unique: number;
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  top_values?: Record<string, number>;
}

/* ─── Context ────────────────────────────────────────────── */
interface DatasetContextType {
  datasets: DatasetMeta[];
  loading: boolean;
  refresh: () => Promise<void>;
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  selectedDataset: DatasetFull | null;
  loadingSelected: boolean;
  pollUntilDone: (id: number) => void;
}

const DatasetContext = createContext<DatasetContextType>({
  datasets: [],
  loading: false,
  refresh: async () => {},
  selectedId: null,
  setSelectedId: () => {},
  selectedDataset: null,
  loadingSelected: false,
  pollUntilDone: () => {},
});

export const useDatasets = () => useContext(DatasetContext);

/* ─── Provider ───────────────────────────────────────────── */
export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [datasets,        setDatasets]        = useState<DatasetMeta[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [selectedId,      setSelectedId]      = useState<number | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<DatasetFull | null>(null);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Fetch list ── */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/donnees/datasets`);
      if (res.ok) setDatasets(await res.json());
    } catch { /* backend hors-ligne */ }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  /* ── Fetch full dataset when selectedId changes ── */
  useEffect(() => {
    if (selectedId == null) { setSelectedDataset(null); return; }
    setLoadingSelected(true);
    fetch(`${API}/api/donnees/datasets/${selectedId}`)
      .then(r => r.json())
      .then((d: DatasetFull) => {
        // eda_results is JSON string from backend — parse if needed
        if (d.eda_results && typeof d.eda_results === 'string') {
          try { d.eda_results = JSON.parse(d.eda_results as unknown as string); } catch {}
        }
        setSelectedDataset(d);
      })
      .catch(() => setSelectedDataset(null))
      .finally(() => setLoadingSelected(false));
  }, [selectedId]);

  /* ── Polling helper ── */
  const pollUntilDone = useCallback((id: number) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/donnees/datasets/${id}`);
        const d: DatasetFull = await res.json();
        if (d.eda_results && typeof d.eda_results === 'string') {
          try { d.eda_results = JSON.parse(d.eda_results as unknown as string); } catch {}
        }
        if (d.status === 'processed' || d.status === 'error') {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setSelectedDataset(d);
          await refresh();
        } else {
          setSelectedDataset(d);
        }
      } catch { /* ignore */ }
    }, 3000);
  }, [refresh]);

  /* cleanup */
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  return (
    <DatasetContext.Provider value={{
      datasets, loading, refresh,
      selectedId, setSelectedId,
      selectedDataset, loadingSelected,
      pollUntilDone,
    }}>
      {children}
    </DatasetContext.Provider>
  );
};
