import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PredictionWindow } from "../types";

const WINDOWS: PredictionWindow[] = ["7 jours", "14 jours", "30 jours"];

const PredictionSettings: React.FC = () => {
  const [window, setWindow] = useState<PredictionWindow>("7 jours");
  const [activeForecast, setActiveForecast] = useState(true);
  const [batchPrediction, setBatchPrediction] = useState(true);
  const [openWin, setOpenWin] = useState(false);

  return (
    <div className="card settings-card">
      <div className="card-section-label">
        <span className="step-badge orange">2</span>
        <h3 className="section-title">Paramètres de la Prédiction</h3>
      </div>

      <div className="settings-row">
        <span className="settings-label">Fenêtres de prédiction</span>
        <div className="window-select-wrap">
          <button className="window-select-btn" onClick={() => setOpenWin(!openWin)}>
            {window} <ChevronDown size={14} />
          </button>
          {openWin && (
            <div className="window-dropdown">
              {WINDOWS.map((w) => (
                <button
                  key={w}
                  className={`window-option ${window === w ? "selected" : ""}`}
                  onClick={() => { setWindow(w); setOpenWin(false); }}
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
          className={`toggle-switch ${activeForecast ? "on" : ""}`}
          onClick={() => setActiveForecast(!activeForecast)}
          aria-label="Toggle forecast"
        >
          <span className="toggle-knob" />
        </button>
      </div>

      <div className="settings-row">
        <span className="settings-label">Batch Prediction</span>
        <button
          className={`toggle-switch ${batchPrediction ? "on" : ""}`}
          onClick={() => setBatchPrediction(!batchPrediction)}
          aria-label="Toggle batch"
        >
          <span className="toggle-knob" />
        </button>
      </div>
    </div>
  );
};

export default PredictionSettings;
