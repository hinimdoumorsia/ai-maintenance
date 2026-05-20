import React, { useEffect, useRef, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { Sparkles } from "lucide-react";
import FileUploadCard from "./components/FileUploadCard";
import ResultsCard from "./components/ResultsCard";
import ModelSelector from "./components/ModelSelector";
import PredictionSettings, { PredictionSettingsValue } from "./components/PredictionSettings";
import PredictionChart from "./components/PredictionChart";
import ExplanationsCard from "./components/ExplanationsCard";
import AgentLogs from "./components/AgentLogs";
import ActionButton from "./components/ActionButton";
import { ModelOption } from "./types";
import { predictFile, streamPredictions, exportPredictions, getPredictionResults, PredictionResult } from "../../services/api";

const Predictions: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<ModelOption | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<PredictionSettingsValue>({
    window: "7 jours",
    activeForecast: true,
    batchPrediction: true,
  });
  const [predictionLaunched, setPredictionLaunched] = useState(false);
  const [results, setResults] = useState<PredictionResult | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const closeStreamRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    return () => {
      closeStreamRef.current?.();
    };
  }, []);

  const handleLaunch = async () => {
    if (!selectedFile) {
      setLogs((s) => [...s, { type: "error", message: "Veuillez sélectionner un fichier." }]);
      return;
    }
    if (!selectedModel) {
      setLogs((s) => [...s, { type: "error", message: "Aucun modèle disponible — entraîne d'abord un modèle." }]);
      return;
    }
    setPredictionLaunched(true);
    setLogs([]);
    setResults(null);

    try {
      const windowDays = parseInt(settings.window, 10) || 7;
      const res = await predictFile(selectedFile, selectedModel.id, {
        window: String(windowDays),
        forecast: settings.activeForecast,
        batch: settings.batchPrediction,
      });
      setResults(res);

      if (!res.job_id) {
        setPredictionLaunched(false);
        return;
      }

      const jobId = res.job_id;
      closeStreamRef.current?.();
      closeStreamRef.current = await streamPredictions(
        jobId,
        async (event) => {
          setLogs((s) => [...s, event]);
          if (event.type === "done") {
            try {
              const full = await getPredictionResults(jobId);
              setResults({ job_id: jobId, ...full.result });
            } catch (err: any) {
              setLogs((s) => [...s, { type: "error", message: err.message }]);
            }
            setPredictionLaunched(false);
          } else if (event.type === "error") {
            setPredictionLaunched(false);
          }
        },
        () => {
          setPredictionLaunched(false);
        },
        (err) => {
          setLogs((s) => [...s, { type: "error", message: err.message }]);
          setPredictionLaunched(false);
        }
      );
    } catch (e: any) {
      setLogs((s) => [...s, { type: "error", message: e.message }]);
      setPredictionLaunched(false);
    }
  };

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    if (!results?.job_id) {
      setLogs((s) => [...s, { type: "error", message: "Aucun job_id pour exporter." }]);
      return;
    }
    try {
      const blob = await exportPredictions(results.job_id, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const ext = format === "excel" ? "xlsx" : format;
      link.href = url;
      link.download = `predictions_${results.job_id}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setLogs((s) => [...s, { type: "error", message: e.message }]);
    }
  };

  return (
    <AppLayout
      title="Prédictions"
      subtitle="Préparer et effectuer des prédictions basées sur votre modèle IA"
      icon={Sparkles}
    >
      <main className="flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Left Column */}
          <div className="space-y-6">
            <FileUploadCard onFileSelected={setSelectedFile} />
            <ResultsCard results={results} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModelSelector value={selectedModel} onChange={setSelectedModel} />
              <PredictionSettings value={settings} onChange={setSettings} />
            </div>
            <ActionButton
              onLaunch={handleLaunch}
              onExport={handleExport}
              loading={predictionLaunched}
              canExport={Boolean(results?.job_id)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PredictionChart results={results} />
              <ExplanationsCard results={results} />
            </div>
            <AgentLogs logs={logs} />
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default Predictions;
