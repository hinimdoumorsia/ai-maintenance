import React, { useState } from "react";
import { Play, Loader2 } from "lucide-react";

interface StartTrainingButtonProps {
  onStart: () => void;
  running: boolean;
}

const StartTrainingButton: React.FC<StartTrainingButtonProps> = ({ onStart, running }) => {
  return (
    <button className="btn-start-training" onClick={onStart} disabled={running}>
      {running ? (
        <>
          <Loader2 size={22} className="spin" />
          Entrainement en cours…
        </>
      ) : (
        <>
          <Play size={22} fill="white" />
          Démarrer l'entrainement
        </>
      )}
      {!running && (
        <p className="start-sub">L'agent analysera vos données et entrainera le meilleur modèle.</p>
      )}
    </button>
  );
};

export default StartTrainingButton;
