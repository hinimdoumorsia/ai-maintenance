import React, { useState, useRef } from "react";
import { Upload, CheckCircle, ChevronDown, FileText, Loader2 } from "lucide-react";
import { TrainingDataset } from "../types";

interface DatasetUploadProps {
  onLoaded: (ds: TrainingDataset) => void;
  onFileSelected: (file: File) => void;
  uploadedFileName?: string;
  isUploading?: boolean;
}

const DatasetUpload: React.FC<DatasetUploadProps> = ({ 
  onLoaded, 
  onFileSelected, 
  uploadedFileName, 
  isUploading = false 
}) => {
  const [dragging, setDragging] = useState(false);
  const [dataset, setDataset] = useState<TrainingDataset | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFileInfo, setSelectedFileInfo] = useState<{ name: string; size: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const load = (file: File) => {
    // Créer un objet TrainingDataset avec les infos de base
    const ds: TrainingDataset = {
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      rows: 0, // Sera mis à jour après l'API
      columns: 0,
      data: [],
    };
    
    setDataset(ds);
    setSelectedFileInfo({
      name: file.name,
      size: formatFileSize(file.size)
    });
    onLoaded(ds);
    onFileSelected(file);
  };

  const handleFileChange = (file: File) => {
    // Vérifier l'extension
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExt)) {
      alert(`Format non supporté. Utilisez: ${validExtensions.join(', ')}`);
      return;
    }
    
    load(file);
  };

  return (
    <div className="card training-upload-card">
      <div className="card-section-label">
        <span className="step-badge">1</span>
        <div>
          <h3 className="section-title">Upload Dataset</h3>
          <p className="section-subtitle">Téléchargez votre fichier de données</p>
        </div>
      </div>

      <div
        className={`drop-zone ${dragging ? "dragging" : ""} ${isUploading ? "uploading" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { 
          e.preventDefault(); 
          setDragging(false); 
          const file = e.dataTransfer.files?.[0];
          if (file) handleFileChange(file);
        }}
      >
        <div className="drop-icon">
          {isUploading ? (
            <Loader2 size={30} color="white" className="spin" />
          ) : (
            <Upload size={30} color="white" />
          )}
        </div>
        <p className="drop-label">
          {isUploading ? "Chargement en cours..." : "Glissez-déposez votre fichier ici"}
        </p>
        <p className="drop-or">ou</p>
        <button 
          className="btn-primary" 
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
        >
          Parcourir les fichiers
        </button>
        <input 
          ref={fileRef} 
          type="file" 
          accept=".csv,.xlsx,.xls,.json" 
          hidden
          onChange={(e) => { 
            const file = e.target.files?.[0]; 
            if (file) handleFileChange(file);
          }} 
        />
        <p className="drop-hint">Formats pris en charge: CSV, XLSX, JSON</p>
      </div>

      {(dataset || uploadedFileName) && (
        <div className="preview-section">
          <div className="preview-header">
            <div className="preview-title-row">
              {isUploading ? (
                <Loader2 size={17} color="#F97316" className="spin" />
              ) : (
                <CheckCircle size={17} color="#22c55e" />
              )}
              <div>
                <p className="preview-name">Fichier chargé</p>
                <p className="preview-meta">{uploadedFileName || dataset?.fileName}</p>
                <p className="preview-meta">
                  {selectedFileInfo?.size || dataset?.fileSize}
                  {dataset && dataset.rows > 0 && ` · ${dataset.rows.toLocaleString()} lignes · ${dataset.columns} colonnes`}
                </p>
              </div>
            </div>
            <button 
              className="preview-toggle" 
              onClick={() => setShowPreview(!showPreview)}
              disabled={!dataset || dataset.rows === 0}
            >
              Aperçu <ChevronDown size={13} style={{ transform: showPreview ? "rotate(180deg)" : "none" }} />
            </button>
          </div>
          {showPreview && dataset && dataset.data && dataset.data.length > 0 && (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {Object.keys(dataset.data[0]).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataset.data.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val, j) => (
                        <td key={j}>{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
               </table>
              <p className="table-footer">
                Affichage de 5 sur {dataset.rows.toLocaleString()} lignes
              </p>
            </div>
          )}
          {showPreview && dataset && dataset.rows === 0 && (
            <div className="preview-placeholder" style={{ padding: 20, textAlign: "center", color: "#9CA3AF" }}>
              <FileText size={24} />
              <p>Aperçu disponible après l'analyse</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .drop-zone.uploading {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .preview-toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default DatasetUpload;