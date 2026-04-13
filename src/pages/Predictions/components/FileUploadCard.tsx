import React, { useState, useRef } from "react";
import { Upload, CheckCircle, ChevronDown } from "lucide-react";
import { DataPreview, SensorRow } from "../types";

const MOCK_DATA: SensorRow[] = [
  { timestamp: "2024-01-15 10.00.00", machine_id: "MCH-001", temperature: "1.96 h", vibration: 0.025, pressure: 1.24, status: "OK" },
  { timestamp: "2024-01-15 10.01.00", machine_id: "MCH-001", temperature: "1.9 h", vibration: 0.025, pressure: 1.33, status: "OK" },
  { timestamp: "2024-01-15 10.02.00", machine_id: "MCH-001", temperature: "6 %", vibration: 0.018, pressure: 1.92, status: "OK" },
];

interface FileUploadCardProps {
  onFileLoaded: (preview: DataPreview) => void;
}

const FileUploadCard: React.FC<FileUploadCardProps> = ({ onFileLoaded }) => {
  const [activeTab, setActiveTab] = useState<"file" | "observation">("file");
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<DataPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    loadMockPreview("dropped_file.csv");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadMockPreview(file.name);
  };

  const loadMockPreview = (fileName: string) => {
    const p: DataPreview = {
      fileName,
      fileSize: "5.2 MB",
      rows: 15231,
      columns: 24,
      data: MOCK_DATA,
    };
    setPreview(p);
    onFileLoaded(p);
  };

  return (
    <div className="card file-upload-card">
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === "file" ? "active" : ""}`}
          onClick={() => setActiveTab("file")}
        >
          <span className="tab-num">1</span> Glisser un Fichier
        </button>
        <button
          className={`tab-btn ${activeTab === "observation" ? "active" : ""}`}
          onClick={() => setActiveTab("observation")}
        >
          <span className="tab-num">2</span> Entrer une Observation
        </button>
      </div>

      {activeTab === "file" && (
        <>
          <div
            className={`drop-zone ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className="drop-icon">
              <Upload size={32} color="white" />
            </div>
            <p className="drop-label">Glissez-déposez votre fichier ici</p>
            <button className="btn-primary" onClick={() => fileRef.current?.click()}>
              Parcourir les fichiers
            </button>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.json" hidden onChange={handleFileChange} />
            <p className="drop-hint">Formats pris en charge: CSV, XLSX, JSON</p>
          </div>

          {preview && (
            <div className="preview-section">
              <div className="preview-header">
                <div className="preview-title-row">
                  <CheckCircle size={18} color="#22c55e" />
                  <div>
                    <p className="preview-name">Aperçu des Données</p>
                    <p className="preview-meta">{preview.fileName}</p>
                    <p className="preview-meta">{preview.fileSize} · {preview.rows.toLocaleString()} rows · {preview.columns} columns</p>
                  </div>
                </div>
                <button className="preview-toggle" onClick={() => setShowPreview(!showPreview)}>
                  Aperçu <ChevronDown size={14} style={{ transform: showPreview ? "rotate(180deg)" : "none" }} />
                </button>
              </div>

              {showPreview && (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>timestamp</th>
                        <th>machine_id</th>
                        <th>temperature</th>
                        <th>vibration</th>
                        <th>pressure</th>
                        <th>status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.map((row, i) => (
                        <tr key={i}>
                          <td>{row.timestamp}</td>
                          <td>{row.machine_id}</td>
                          <td>{row.temperature}</td>
                          <td>{row.vibration}</td>
                          <td className={row.pressure > 1.5 ? "val-high" : ""}>{row.pressure}</td>
                          <td><span className="status-ok">{row.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="table-footer">Affichage d 3l su 15,231 lignes</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "observation" && (
        <div className="observation-tab">
          <textarea className="obs-textarea" placeholder="Entrez vos observations manuellement..." rows={6} />
          <button className="btn-primary" style={{ marginTop: 12, alignSelf: "flex-start" }}>Valider</button>
        </div>
      )}
    </div>
  );
};

export default FileUploadCard;
