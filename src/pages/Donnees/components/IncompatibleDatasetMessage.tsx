// src/pages/Donnees/components/IncompatibleDatasetMessage.tsx
// Message affiché quand le dataset sélectionné n'est pas compatible avec la sous-page

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronDown, Upload } from 'lucide-react';
import { useDatasets, DatasetMeta } from '../../../contexts/DatasetContext';

const TYPE_LABELS_FR: Record<string, string> = {
  machine: 'Parc machines',
  maintenance: 'Maintenance / classification VIS',
  vibration: 'Analyse vibratoire',
  kpi: 'KPI et performance',
  generic: 'Générique',
};

export interface IncompatibleDatasetMessageProps {
  page: string; // nom de la page (ex: "Analyse Vibratoire", "Vue Générale")
  datasetName: string; // nom du dataset courant
  missingColumns?: string[]; // colonnes manquantes
  compatibleDatasetIds?: number[]; // IDs des datasets compatibles avec cette page
  analysisType?: string; // type requis (ex: 'vibration', 'kpi', 'maintenance')
  /** Type détecté par l'EDA pour le dataset sélectionné (affichage explicite écart de typage) */
  datasetDetectedType?: string | null;
}

const IncompatibleDatasetMessage: React.FC<IncompatibleDatasetMessageProps> = ({
  page,
  datasetName,
  missingColumns = [],
  compatibleDatasetIds,
  analysisType,
  datasetDetectedType,
}) => {
  const navigate = useNavigate();
  const { datasets, setSelectedId } = useDatasets();
  const [showDropdown, setShowDropdown] = useState(false);

  const compatibleDatasets: DatasetMeta[] = compatibleDatasetIds
    ? datasets.filter(d => compatibleDatasetIds.includes(d.id))
    : analysisType
      ? datasets.filter(d => d.detected_type === analysisType && d.status === 'processed')
      : [];

  return (
    <div className="incompatible-dataset">
      <div className="incompatible-dataset-icon">
        <AlertCircle size={48} color="#f97316" />
      </div>

      <h2 className="incompatible-dataset-title">
        Dataset incompatible avec cette analyse
      </h2>

      <p className="incompatible-dataset-message">
        {missingColumns.length > 0 ? (
          <>
            Le dataset <strong>&apos;{datasetName}&apos;</strong> ne contient pas les colonnes
            attendues pour <strong>{page}</strong>.
          </>
        ) : analysisType && datasetDetectedType && datasetDetectedType !== analysisType ? (
          <>
            Le dataset <strong>&apos;{datasetName}&apos;</strong> est classé{' '}
            <strong>{TYPE_LABELS_FR[datasetDetectedType] || datasetDetectedType}</strong> par
            l&apos;analyse automatique (EDA). La vue <strong>{page}</strong> attend un fichier
            classé{' '}
            <strong>{TYPE_LABELS_FR[analysisType] || analysisType}</strong> — structure et
            colonnes différentes (souvent un CSV dédié à cette vue).
          </>
        ) : (
          <>
            Le dataset <strong>&apos;{datasetName}&apos;</strong> n&apos;est pas adapté à{' '}
            <strong>{page}</strong>
            {analysisType ? (
              <>
                {' '}
                (type attendu :{' '}
                <strong>{TYPE_LABELS_FR[analysisType] || analysisType}</strong>).
              </>
            ) : (
              <>.</>
            )}
          </>
        )}
      </p>

      {missingColumns.length > 0 && (
        <div className="incompatible-dataset-missing">
          <p className="incompatible-dataset-missing-label">Colonnes manquantes :</p>
          <ul className="incompatible-dataset-missing-list">
            {missingColumns.map(col => (
              <li key={col} className="incompatible-dataset-missing-item">
                <AlertCircle size={12} color="#dc2626" />
                {col}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="incompatible-dataset-actions">
        {compatibleDatasets.length > 0 && (
          <div className="incompatible-dataset-dropdown">
            <button
              className="btn-incompatible-dropdown"
              onClick={() => setShowDropdown(v => !v)}
            >
              Changer de dataset
              <ChevronDown
                size={14}
                style={{
                  transform: showDropdown ? 'rotate(180deg)' : 'none',
                  transition: 'transform .2s',
                }}
              />
            </button>
            {showDropdown && (
              <div className="incompatible-dataset-dropdown-menu">
                {compatibleDatasets.map(ds => (
                  <button
                    key={ds.id}
                    className="incompatible-dataset-dropdown-item"
                    onClick={() => {
                      setSelectedId(ds.id);
                      setShowDropdown(false);
                    }}
                  >
                    <span className="dropdown-item-name">{ds.name}</span>
                    <span className="dropdown-item-type">{ds.detected_type || 'générique'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          className="btn-incompatible-navigate"
          onClick={() => navigate('/donnees?analyse=chargement')}
        >
          <Upload size={14} />
          Aller au Chargement
        </button>
      </div>
    </div>
  );
};

export default IncompatibleDatasetMessage;
