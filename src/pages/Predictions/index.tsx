import React, { useState } from "react";
import AppLayout from "../../components/AppLayout";
import { Sparkles } from "lucide-react";
import FileUploadCard from "./components/FileUploadCard";
import ResultsCard from "./components/ResultsCard";
import ModelSelector from "./components/ModelSelector";
import PredictionSettings from "./components/PredictionSettings";
import PredictionChart from "./components/PredictionChart";
import ExplanationsCard from "./components/ExplanationsCard";
import AgentLogs from "./components/AgentLogs";
import ActionButton from "./components/ActionButton";
import { DataPreview, ModelOption } from "./types";

const Predictions: React.FC = () => {
  const [filePreview, setFilePreview] = useState<DataPreview | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelOption>({ 
    id: "lstm", 
    name: "LSTM", 
    description: "Séries temporelles" 
  });
  const [predictionLaunched, setPredictionLaunched] = useState(false);

  return (
    <AppLayout
      title="Prédictions"
      subtitle="Préparer et effectuer des prédictions basées sur votre modèle IA"
      icon={Sparkles}
      notifCount={1}
    >
      <main className="flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Left Column */}
          <div className="space-y-6">
            <FileUploadCard onFileLoaded={setFilePreview} />
            <ResultsCard />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModelSelector onModelChange={setSelectedModel} />
              <PredictionSettings />
            </div>
            <ActionButton onLaunch={() => setPredictionLaunched(true)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PredictionChart />
              <ExplanationsCard />
            </div>
            <AgentLogs />
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default Predictions;