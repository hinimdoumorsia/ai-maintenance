import React, { useState, useRef } from "react";
import { Upload, CheckCircle, ChevronDown } from "lucide-react";
import { TrainingDataset, SensorRow } from "../types";

const MOCK_ROWS: SensorRow[] = [
  { timestamp: "2024-01 15 10:00:00", machine_id: "MCH-001", temperature: 75.4, vibration: 0.023, pressure: 1.24, status: "OK" },
  { timestamp: "2024-01 15 10:01:00", machine_id: "MCH-001", temperature: 76.1, vibration: 0.025, pressure: 1.21, status: "OK" },
  { timestamp: "2024-01 15 10:02:00", machine_id: "MCH-002", temperature: 68.9, vibration: 0.018, pressure: 1.15, status: "OK" },
];

interface DatasetUploadProps {
  onLoaded: (ds: TrainingDataset) => void;
}

const DatasetUpload: React.FC<DatasetUploadProps> = ({ onLoaded }) => {
  const [dragging, setDragging] = useState(false);
  const [dataset, setDataset] = useState<TrainingDataset | null>(null);
  const [showTable, setShowTable] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = (name: string) => {
    const ds: TrainingDataset = {
      fileName: name,
      fileSize: "12.4 MB",
      rows: 15231,
      columns: 24,
      data: MOCK_ROWS,
    };
    setDataset(ds);
    onLoaded(ds);
  };

  return (
    <div className="card training-upload-card">
      <div className="card-section-label">
        <span className="step-badge">1</span>
        <div>
          <h3 className="section-title">Upload Dataset</h3>
          <p className="section-subtitle">Upload your data sa préfeminéré</p>
        </div>
      </div>

      <div
        className={`drop-zone ${dragging ? "dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); load("dropped_file.csv"); }}
      >
        <div className="drop-icon">
          <Upload size={30} color="white" />
        </div>
        <p className="drop-label">Glissez-déposez vtoué ffeir hér</p>
        <p className="drop-or">ou</p>
        <button className="btn-primary" onClick={() => fileRef.current?.click()}>
          Parcourir les fichiers
        </button>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.json" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f.name); }} />
        <p className="drop-hint">Formats pris en charge: CSV, XLSX, JSON</p>
      </div>

      {dataset && (
        <div className="preview-section">
          <div className="preview-header">
            <div className="preview-title-row">
              <CheckCircle size={17} color="#22c55e" />
              <div>
                <p className="preview-name">Dataset Aperçu</p>
                <p className="preview-meta">{dataset.fileName}</p>
                <p className="preview-meta">{dataset.fileSize} · {dataset.rows.toLocaleString()} rows · {dataset.columns} columns</p>
              </div>
            </div>
            <button className="preview-toggle" onClick={() => setShowTable(!showTable)}>
              Aperçu <ChevronDown size={13} style={{ transform: showTable ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
          </div>
          {showTable && (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>timestamp</th><th>machine_id</th><th>temperature</th>
                    <th>vibration</th><th>pressure</th><th>status</th>
                  </tr>
                </thead>
                <tbody>
                  {dataset.data.map((r, i) => (
                    <tr key={i}>
                      <td>{r.timestamp}</td><td>{r.machine_id}</td>
                      <td>{r.temperature}</td><td>{r.vibration}</td>
                      <td>{r.pressure}</td>
                      <td><span className="status-ok">{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="table-footer">Affichage d 3 sur 15.231 lignes</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatasetUpload;
