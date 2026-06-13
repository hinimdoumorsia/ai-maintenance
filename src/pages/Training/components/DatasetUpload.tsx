// DatasetUpload.tsx
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
  isUploading = false,
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
    const ds: TrainingDataset = {
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      rows: 0,
      columns: 0,
      data: [],
    };
    setDataset(ds);
    setSelectedFileInfo({ name: file.name, size: formatFileSize(file.size) });
    onLoaded(ds);
    onFileSelected(file);
  };

  const handleFileChange = (file: File) => {
    const validExtensions = [".csv", ".xlsx", ".xls", ".json"];
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      alert(`Format non supporté. Utilisez: ${validExtensions.join(", ")}`);
      return;
    }
    load(file);
  };

  return (
    <div className="rounded-2xl border-2 border-gray-800 dark:border-gray-700 p-1 shadow-lg shadow-gray-900/20 transition-all duration-300 hover:shadow-gray-800/40 hover:border-gray-700">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-900 dark:bg-gray-700 text-white text-xs font-bold flex-shrink-0 ring-2 ring-gray-700 shadow-md">
            1
          </span>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              Upload Dataset
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Téléchargez votre fichier de données
            </p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileChange(file);
          }}
          className={`
            relative flex flex-col items-center justify-center gap-3 py-6 px-4 rounded-xl border-2 border-dashed
            transition-all duration-300 cursor-pointer group
            ${dragging
              ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 scale-[1.01]"
              : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 hover:border-orange-400 hover:bg-orange-50/40 dark:hover:bg-orange-900/10"}
            ${isUploading ? "opacity-60 cursor-not-allowed" : ""}
          `}
          onClick={() => !isUploading && fileRef.current?.click()}
        >
          {dragging && (
            <div className="absolute inset-0 rounded-xl bg-orange-500/10 animate-pulse pointer-events-none" />
          )}

          <div
            className={`
              w-12 h-12 rounded-full bg-gray-900 dark:bg-gray-700 flex items-center justify-center
              shadow-lg shadow-gray-900/30 transition-transform duration-300
              group-hover:scale-110 group-hover:bg-orange-500
              ${dragging ? "scale-110 bg-orange-500" : ""}
            `}
          >
            {isUploading ? (
              <Loader2 size={22} color="white" className="animate-spin" />
            ) : (
              <Upload size={22} color="white" />
            )}
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isUploading ? "Chargement en cours…" : "Glissez-déposez votre fichier ici"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              ou cliquez pour parcourir
            </p>
          </div>

          <button
            className="px-4 py-2 bg-gray-900 dark:bg-gray-700 hover:bg-orange-500 dark:hover:bg-orange-500 text-white text-xs font-semibold rounded-lg border-2 border-gray-800 dark:border-gray-600 hover:border-orange-500 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={(e) => {
              e.stopPropagation();
              fileRef.current?.click();
            }}
            disabled={isUploading}
          >
            Parcourir les fichiers
          </button>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Formats : CSV, XLSX, JSON
          </p>

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
        </div>

        {/* File info */}
        {(dataset || uploadedFileName) && (
          <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-shrink-0">
                {isUploading ? (
                  <Loader2 size={17} className="text-orange-500 animate-spin" />
                ) : (
                  <CheckCircle size={17} className="text-green-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Fichier chargé
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {uploadedFileName || dataset?.fileName}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {selectedFileInfo?.size || dataset?.fileSize}
                  {dataset && dataset.rows > 0 &&
                    ` · ${dataset.rows.toLocaleString()} lignes · ${dataset.columns} col.`}
                </p>
              </div>
              <button
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setShowPreview(!showPreview)}
                disabled={!dataset || dataset.rows === 0}
              >
                Aperçu
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${
                    showPreview ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {showPreview && dataset && dataset.data && dataset.data.length > 0 && (
              <div className="overflow-x-auto border-t border-gray-200 dark:border-gray-700">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-900 dark:bg-gray-800 text-white">
                      {Object.keys(dataset.data[0]).map((key) => (
                        <th
                          key={key}
                          className="px-3 py-2 text-left font-medium whitespace-nowrap"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.data.slice(0, 5).map((row, i) => (
                      <tr
                        key={i}
                        className={i % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700/50"}
                      >
                        {Object.values(row).map((val, j) => (
                          <td
                            key={j}
                            className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap"
                          >
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700">
                  Affichage de 5 sur {dataset.rows.toLocaleString()} lignes
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetUpload;