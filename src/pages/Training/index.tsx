import React, { useState } from "react";
import AppLayout from "../../components/AppLayout";
import { GraduationCap } from "lucide-react";
import DatasetUpload from "./components/DatasetUpload";
import TrainingProgress from "./components/TrainingProgress";
import ModelSelection from "./components/ModelSelection";
import AgentOptionsCard from "./components/AgentOptionsCard";
import StartTrainingButton from "./components/StartTrainingButton";
import ResultsCard from "./components/ResultsCard";
import AgentTrainingLogs from "./components/AgentTrainingLogs";
import { TrainingDataset, ModelId, SelectionMode, AgentOptions, TrainingStep } from "./types";
import "./training.css";

const NAV_ITEMS_UNUSED: never[] = []; // removed — sidebar now shared via AppLayout

const INITIAL_STEPS: TrainingStep[] = [
  { id: "analyse",     label: "Analyre du dataset",    status: "completed" },
  { id: "selection",   label: "Selection du modèle",   status: "completed" },
  { id: "preparation", label: "Préparation des donèes", status: "in_progress" },
  { id: "training",    label: "Entrainement du modèle", status: "pending" },
  { id: "evaluation",  label: "Évaluation du modèle",  status: "pending" },
];

const Training: React.FC = () => {
  const [dataset, setDataset] = useState<TrainingDataset | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelId>("lstm");
  const [mode, setMode] = useState<SelectionMode>("auto");
  const [agentOptions, setAgentOptions] = useState<AgentOptions>({ autoTrain: true, explainDecisions: true });
  const [running, setRunning] = useState(false);
  const [percent, setPercent] = useState(65);
  const [steps, setSteps] = useState<TrainingStep[]>(INITIAL_STEPS);

  const handleStart = () => {
    setRunning(true);
    // Simulate progress
    let p = percent;
    const iv = setInterval(() => {
      p += 5;
      setPercent(Math.min(p, 100));
      if (p >= 100) { clearInterval(iv); setRunning(false); }
    }, 600);
  };

  return (
    <AppLayout
      title="Entrainement"
      subtitle="Entraînez des modèles de machine learning pour la maintenance prédictive"
      icon={GraduationCap}
    >
      <main className="main-content">
        {/* Content grid */}
        <div className="training-content-grid">
          {/* LEFT COL */}
          <div className="training-left-col">
            <DatasetUpload onLoaded={setDataset} />
            <TrainingProgress steps={steps} percent={percent} running={running} />
          </div>

          {/* RIGHT COL */}
          <div className="training-right-col">
            {/* Top row: Model + Agent options */}
            <div className="training-top-row">
              <ModelSelection
                selected={selectedModel}
                onSelect={setSelectedModel}
                mode={mode}
                onModeChange={setMode}
              />
              <AgentOptionsCard options={agentOptions} onChange={setAgentOptions} />
            </div>

            {/* Start button */}
            <StartTrainingButton onStart={handleStart} running={running} />

            {/* Bottom row: Results + Logs */}
            <div className="training-bottom-row">
              <ResultsCard results={null} />
              <AgentTrainingLogs />
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default Training;