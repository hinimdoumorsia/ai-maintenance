import React, { useRef, useState } from "react";
import { Upload, CheckCircle, ChevronDown } from "lucide-react";
import { DataPreview } from "../types";

interface FileUploadCardProps {
  onFileSelected: (file: File) => void;
}

const PREVIEW_ROWS = 5;
const HEAD_BYTES = 64 * 1024; // 64 KB suffisent pour estimer + 5 lignes d'aperçu

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function detectDelimiter(headerLine: string): string {
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = 0;
  for (const c of candidates) {
    const count = headerLine.split(c).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = c;
    }
  }
  return best;
}

function splitCSVLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delim && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out;
}

async function parseCSVPreview(file: File): Promise<DataPreview> {
  const slice = file.slice(0, Math.min(file.size, HEAD_BYTES));
  const head = await slice.text();
  const lines = head.split(/\r?\n/).filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { fileName: file.name, fileSize: formatSize(file.size), rows: 0, columns: 0, data: [] };
  }

  const delim = detectDelimiter(lines[0]);
  const headers = splitCSVLine(lines[0], delim).map((h) => h.trim());

  const dataRows = lines.slice(1, PREVIEW_ROWS + 1).map((line) => {
    const cells = splitCSVLine(line, delim);
    const row: Record<string, any> = {};
    headers.forEach((h, i) => {
      row[h || `col_${i}`] = cells[i] ?? "";
    });
    return row;
  });

  let estimatedRows: number;
  if (slice.size === file.size) {
    estimatedRows = Math.max(0, lines.length - 1);
  } else {
    const avgLineBytes = head.length / lines.length;
    estimatedRows = Math.max(0, Math.round(file.size / avgLineBytes) - 1);
  }

  return {
    fileName: file.name,
    fileSize: formatSize(file.size),
    rows: estimatedRows,
    columns: headers.length,
    data: dataRows as DataPreview["data"],
  };
}

async function buildPreview(file: File): Promise<DataPreview> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv" || ext === "tsv" || ext === "txt") {
    return parseCSVPreview(file);
  }
  // Formats non parsés en client (xlsx, json) — preview minimal sans table
  return {
    fileName: file.name,
    fileSize: formatSize(file.size),
    rows: 0,
    columns: 0,
    data: [],
  };
}

const FileUploadCard: React.FC<FileUploadCardProps> = ({ onFileSelected }) => {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<DataPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    onFileSelected(file);
    setPreviewError(null);
    try {
      const p = await buildPreview(file);
      setPreview(p);
    } catch (e: any) {
      setPreviewError(e?.message || "Erreur d'analyse du fichier");
      setPreview({
        fileName: file.name,
        fileSize: formatSize(file.size),
        rows: 0,
        columns: 0,
        data: [],
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const headers = preview && preview.data.length > 0 ? Object.keys(preview.data[0]) : [];

  return (
    <div className="card file-upload-card">
      <div className="card-section-label">
        <span className="step-badge">1</span>
        <h3 className="section-title">Charger un Fichier</h3>
      </div>

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
        <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.xlsx,.json" hidden onChange={handleFileChange} />
        <p className="drop-hint">Formats pris en charge : CSV, TSV, XLSX, JSON (aperçu détaillé pour CSV/TSV)</p>
      </div>

      {preview && (
        <div className="preview-section">
          <div className="preview-header">
            <div className="preview-title-row">
              <CheckCircle size={18} color="#22c55e" />
              <div>
                <p className="preview-name">Aperçu des Données</p>
                <p className="preview-meta">{preview.fileName}</p>
                <p className="preview-meta">
                  {preview.fileSize}
                  {preview.rows > 0 && ` · ~${preview.rows.toLocaleString()} lignes`}
                  {preview.columns > 0 && ` · ${preview.columns} colonnes`}
                </p>
                {previewError && (
                  <p className="preview-meta" style={{ color: "#dc2626" }}>{previewError}</p>
                )}
              </div>
            </div>
            {headers.length > 0 && (
              <button className="preview-toggle" onClick={() => setShowPreview(!showPreview)}>
                Aperçu <ChevronDown size={14} style={{ transform: showPreview ? "rotate(180deg)" : "none" }} />
              </button>
            )}
          </div>

          {showPreview && headers.length > 0 && (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.data.map((row, i) => (
                    <tr key={i}>
                      {headers.map((h) => <td key={h}>{String((row as any)[h] ?? "")}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="table-footer">
                {preview.data.length} lignes affichées
                {preview.rows > preview.data.length && ` sur ~${preview.rows.toLocaleString()}`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploadCard;
