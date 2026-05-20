import React, { useState, useRef } from "react";
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
import { predictFile, streamPredictions, exportPredictions, PredictionResult } from "../../services/api";

const initialLogs: any[] = [];

const Predictions: React.FC = () => {
  const [filePreview, setFilePreview] = useState<DataPreview | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelOption>({ 
    id: "random_forest", 
    name: "Random Forest", 
    description: "Baseline robuste" 
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [predictionLaunched, setPredictionLaunched] = useState(false);
  const [results, setResults] = useState<PredictionResult | null>(null);
  const [logs, setLogs] = useState<any[]>(initialLogs);
  const currentJobRef = useRef<string | null>(null);

  const handleFileLoaded = (preview: DataPreview) => {
    // store preview if needed
  };

  const handleLaunch = async () => {
    if (!selectedFile) {
      setLogs((s) => [...s, { type: 'error', detail: 'Veuillez sélectionner un fichier' }]);
      return;
    }
    setPredictionLaunched(true);
    setLogs([]);
    try {
      const res = await predictFile(selectedFile, selectedModel.id, { window: '7' });
      setResults(res);
      if (res.job_id) currentJobRef.current = res.job_id;

      // subscribe to stream
      const closeStream = await streamPredictions(
        res.job_id || null,
        (d) => setLogs((s) => [...s, d]),
        () => {},
        (err) => setLogs((s) => [...s, { type: 'error', detail: err.message }])
      );

      // stop stream automatically after 60s if not closed
      setTimeout(() => closeStream(), 60000);
    } catch (e: any) {
      setLogs((s) => [...s, { type: 'error', detail: e.message }]);
    } finally {
      setPredictionLaunched(false);
    }
  };

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    if (!results?.job_id) {
      setLogs((s) => [...s, { type: 'error', detail: 'Aucun job_id pour exporter' }]);
      return;
    }
    try {
      const blob = await exportPredictions(results.job_id, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const ext = format === 'excel' ? 'xlsx' : format;
      link.href = url;
      link.download = `predictions_${results.job_id}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setLogs((s) => [...s, { type: 'error', detail: e.message }]);
    }
  };

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
            <FileUploadCard
              onFileLoaded={(p) => { setFilePreview(p); handleFileLoaded(p); }}
              onFileSelected={(f) => setSelectedFile(f)}
            />
            <ResultsCard results={results} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModelSelector onModelChange={setSelectedModel} />
              <PredictionSettings />
            </div>
            <ActionButton onLaunch={handleLaunch} onExport={handleExport} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PredictionChart />
              <ExplanationsCard />
            </div>
            <AgentLogs logs={logs} />
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default Predictions;