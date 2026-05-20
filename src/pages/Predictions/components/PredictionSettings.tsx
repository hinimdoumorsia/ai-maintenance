import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { PredictionWindow } from "../types";

const WINDOWS: PredictionWindow[] = ["7 jours", "14 jours", "30 jours"];

export interface PredictionSettingsValue {
  window: PredictionWindow;
  activeForecast: boolean;
  batchPrediction: boolean;
}

interface PredictionSettingsProps {
  value: PredictionSettingsValue;
  onChange: (next: PredictionSettingsValue) => void;
}

const PredictionSettings: React.FC<PredictionSettingsProps> = ({ value, onChange }) => {
  const [openWin, setOpenWin] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Fermeture du dropdown au clic extérieur ou touche Escape
  useEffect(() => {
    if (!openWin) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpenWin(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenWin(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [openWin]);

  const set = <K extends keyof PredictionSettingsValue>(key: K, v: PredictionSettingsValue[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="card settings-card">
      <div className="card-section-label">
        <span className="step-badge orange">3</span>
        <h3 className="section-title">Paramètres de la Prédiction</h3>
      </div>

      <div className="settings-row">
        <span className="settings-label">Fenêtre de prédiction</span>
        <div className="window-select-wrap" ref={wrapRef}>
          <button
            type="button"
            className="window-select-btn"
            onClick={() => setOpenWin((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={openWin}
          >
            {value.window} <ChevronDown size={14} />
          </button>
          {openWin && (
            <div className="window-dropdown" role="listbox">
              {WINDOWS.map((w) => (
                <button
                  key={w}
                  type="button"
                  role="option"
                  aria-selected={value.window === w}
                  className={`window-option ${value.window === w ? "selected" : ""}`}
                  onClick={() => { set("window", w); setOpenWin(false); }}
                >
                  {w}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="settings-row">
        <span className="settings-label">Activer le forecast</span>
        <button
          type="button"
          className={`toggle-switch ${value.activeForecast ? "on" : ""}`}
          onClick={() => set("activeForecast", !value.activeForecast)}
          aria-pressed={value.activeForecast}
          aria-label="Activer le forecast"
        >
          <span className="toggle-knob" />
        </button>
      </div>

      <div className="settings-row">
        <span className="settings-label">Batch Prediction</span>
        <button
          type="button"
          className={`toggle-switch ${value.batchPrediction ? "on" : ""}`}
          onClick={() => set("batchPrediction", !value.batchPrediction)}
          aria-pressed={value.batchPrediction}
          aria-label="Activer la prédiction batch"
        >
          <span className="toggle-knob" />
        </button>
      </div>
    </div>
  );
};

export default PredictionSettings;
