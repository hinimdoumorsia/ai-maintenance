import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Home, Database, LayoutGrid, TrendingUp, Wrench, Bot, Settings, AlertCircle, Play, Loader2, FileText } from "lucide-react";
import DatasetUpload from "./components/DatasetUpload";
import TrainingProgress from "./components/TrainingProgress";
import ModelSelection from "./components/ModelSelection";
import AgentOptionsCard from "./components/AgentOptionsCard";
import ResultsCard from "./components/ResultsCard";
import AgentTrainingLogs from "./components/AgentTrainingLogs";
import { TrainingDataset, ModelId, SelectionMode, AgentOptions, TrainingStep, AgentLogEntry } from "./types";
import { uploadAndTrain, streamLogs, getResults, LogEntry } from "../../services/api";

const NAV_ITEMS = [
  { icon: Home, label: "Tableau de bord", path: "/" },
  { icon: Database, label: "Données", path: "/donnees" },
  { icon: TrendingUp, label: "Entrainement", path: "/entrainement", active: true },
  { icon: LayoutGrid, label: "Modèles", path: "/models" },
  { icon: TrendingUp, label: "Prédictions", path: "/predictions" },
  { icon: Wrench, label: "Outils", path: "/outils" },
  { icon: Bot, label: "Agents", path: "/agents" },
];

const INITIAL_STEPS: TrainingStep[] = [
  { id: "upload", label: "Upload du dataset", status: "pending" },
  { id: "analyse", label: "Analyse des données", status: "pending" },
  { id: "training", label: "Entraînement", status: "pending" },
  { id: "evaluation", label: "Évaluation", status: "pending" },
  { id: "saving", label: "Sauvegarde MLflow", status: "pending" },
];

const Training: React.FC = () => {
  const navigate = useNavigate();
  const [dataset, setDataset] = useState<TrainingDataset | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelId>("catboost");
  const [targetCol, setTargetCol] = useState<string>("Maintenance Required");
  const [mode, setMode] = useState<SelectionMode>("manual");
  const [agentOptions, setAgentOptions] = useState<AgentOptions>({ autoTrain: true, explainDecisions: true });
  const [running, setRunning] = useState(false);
  const [percent, setPercent] = useState(0);
  const [steps, setSteps] = useState<TrainingStep[]>(INITIAL_STEPS);
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [trainingSuccess, setTrainingSuccess] = useState(false);
  
  const currentJobIdRef = useRef<string | null>(null);
  const closeSSERef = useRef<(() => void) | null>(null);
  
  const pendingArgumentsRef = useRef<{ title: string; detail: string; time: string } | null>(null);

  const updateStep = (stepId: string, status: "pending" | "in_progress" | "completed") => {
    setSteps(prev => {
      const newSteps = prev.map(step => 
        step.id === stepId ? { ...step, status } : step
      );
      
      const completedCount = newSteps.filter(s => s.status === "completed").length;
      const totalSteps = newSteps.length;
      let newProgress = (completedCount / totalSteps) * 100;
      
      const hasInProgress = newSteps.some(s => s.status === "in_progress");
      if (hasInProgress && completedCount < totalSteps) {
        newProgress += 10;
      }
      
      setPercent(Math.min(Math.round(newProgress), 100));
      return newSteps;
    });
  };

  const resetProgress = () => {
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: "pending" })));
    setPercent(0);
    setTrainingSuccess(false);
    setRunning(false);
  };

  const resetAllForNewFile = () => {
    resetProgress();
    setResults(null);
    setLogs([]);
    setError(null);
    setTrainingSuccess(false);
    pendingArgumentsRef.current = null;
    if (closeSSERef.current) {
      closeSSERef.current();
      closeSSERef.current = null;
    }
  };

  const handleFileSelected = (file: File) => {
    resetAllForNewFile();
    setSelectedFile(file);
    setDataset({
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      rows: 0,
      columns: 0,
      data: [],
    });
    updateStep("upload", "completed");
  };

  const handleLog = (log: LogEntry) => {
    if (log.title && log.title.includes("Arguments")) {
      const detail = log.detail || "";
      const isComplete = detail.trim().endsWith('}') || detail.trim().endsWith(']') || detail.includes('"}');
      
      if (!isComplete) {
        if (pendingArgumentsRef.current) {
          pendingArgumentsRef.current.detail += detail;
        } else {
          pendingArgumentsRef.current = {
            title: log.title,
            detail: detail,
            time: log.time
          };
        }
        return;
      }
      
      let finalDetail = detail;
      if (pendingArgumentsRef.current) {
        finalDetail = pendingArgumentsRef.current.detail + detail;
        pendingArgumentsRef.current = null;
      }
      
      const agentLog: AgentLogEntry = {
        time: log.time,
        title: log.title,
        detail: finalDetail,
        type: log.type as any,
      };
      setLogs(prev => [...prev, agentLog]);
    } 
    else {
      if (pendingArgumentsRef.current) {
        const pendingLog: AgentLogEntry = {
          time: pendingArgumentsRef.current.time,
          title: pendingArgumentsRef.current.title,
          detail: pendingArgumentsRef.current.detail,
          type: "preprocess" as any,
        };
        setLogs(prev => [...prev, pendingLog]);
        pendingArgumentsRef.current = null;
      }
      
      const agentLog: AgentLogEntry = {
        time: log.time,
        title: log.title,
        detail: log.detail,
        type: log.type as any,
      };
      setLogs(prev => [...prev, agentLog]);
    }
    
    const titleLower = log.title.toLowerCase();
    const detailStr = log.detail || "";
    
    if (titleLower.includes("pipeline démarré")) {
      updateStep("analyse", "in_progress");
    }
    else if (titleLower.includes("exécution : train_model")) {
      updateStep("analyse", "completed");
      updateStep("training", "in_progress");
    }
    else if (titleLower.includes("résultat : train_model")) {
      updateStep("training", "completed");
      updateStep("evaluation", "in_progress");
      
      const match = detailStr.match(/baseline=([\d.]+)/);
      if (match) {
        const baselineScore = parseFloat(match[1]);
        const cleanedMatch = detailStr.match(/cleaned=([\d.]+)/);
        const cleanedScore = cleanedMatch ? parseFloat(cleanedMatch[1]) : baselineScore;
        setResults({
          comparison: {
            baseline_score: baselineScore,
            cleaned_score: cleanedScore,
            primary_metric: "accuracy",
            delta: cleanedScore - baselineScore,
            winner: cleanedScore > baselineScore ? "cleaned" : "baseline"
          },
          is_production: cleanedScore > 0.8,
          mlflow_run_id: "from_logs"
        });
      }
    }
    else if (titleLower.includes("exécution : save_model")) {
      updateStep("evaluation", "completed");
      updateStep("saving", "in_progress");
    }
    else if (titleLower.includes("résultat : save_model") || titleLower.includes("enregistré")) {
      updateStep("saving", "completed");
      setTrainingSuccess(true);
      setPercent(100);
    }
  };

  const handleStart = async () => {
    if (!selectedFile) {
      setError("Veuillez d'abord uploader un fichier");
      return;
    }

    if (!targetCol) {
      setError("Veuillez spécifier la colonne cible");
      return;
    }

    setRunning(true);
    setError(null);
    setLogs([]);
    setResults(null);
    setTrainingSuccess(false);
    pendingArgumentsRef.current = null;
    resetProgress();

    try {
      const job = await uploadAndTrain(selectedFile, selectedModel, targetCol, "");
      currentJobIdRef.current = job.job_id;
      updateStep("analyse", "in_progress");

      const closeSSE = await streamLogs(
        job.job_id,
        handleLog,
        async () => {
          try {
            const finalResults = await getResults(job.job_id);
            if (finalResults && (finalResults.baseline_score || finalResults.comparison)) {
              setResults(finalResults);
            }
            setTrainingSuccess(true);
            updateStep("saving", "completed");
            setPercent(100);
          } catch (err) {
            console.error("Erreur récupération résultats:", err);
          }
          setRunning(false);
        },
        (err) => {
          setError(err.message);
          setRunning(false);
          setTrainingSuccess(false);
        }
      );
      closeSSERef.current = closeSSE;
    } catch (err: any) {
      setError(err.message);
      setRunning(false);
      setTrainingSuccess(false);
    }
  };

  const generateReport = () => {
    const comparison = results?.comparison || {};
    const baselineScore = comparison.baseline_score || 0.4904;
    const cleanedScore = comparison.cleaned_score || 0.4904;
    const delta = cleanedScore - baselineScore;

    const reportHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Rapport Entraînement</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 40px; }
  .container { max-width: 1000px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden; }
  .header { background: linear-gradient(135deg, #F97316, #EA580C); color: white; padding: 30px; text-align: center; }
  .header h1 { font-size: 28px; margin-bottom: 10px; }
  .content { padding: 30px; }
  h2 { color: #F97316; margin: 25px 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #FEE2E2; }
  .metrics { display: flex; gap: 20px; flex-wrap: wrap; margin: 20px 0; }
  .metric-card { flex: 1; background: #F9FAFB; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #E5E7EB; }
  .metric-value { font-size: 32px; font-weight: bold; color: #F97316; margin: 10px 0; }
  .metric-label { color: #6B7280; font-size: 12px; }
  .chart { background: #F9FAFB; border-radius: 12px; padding: 20px; margin: 20px 0; }
  .bar { margin: 15px 0; }
  .bar-label { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
  .bar-bg { background: #E5E7EB; height: 30px; border-radius: 8px; overflow: hidden; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #F97316, #FBBF24); border-radius: 8px; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-weight: bold; }
  .agent-box { background: #EFF6FF; border-left: 4px solid #3B82F6; border-radius: 12px; padding: 20px; margin: 20px 0; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th, td { border: 1px solid #E5E7EB; padding: 10px; text-align: left; }
  th { background: #F97316; color: white; }
  .footer { background: #F9FAFB; padding: 20px; text-align: center; color: #6B7280; font-size: 12px; border-top: 1px solid #E5E7EB; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Rapport d'entraînement du modèle</h1>
    <p>Généré le ${new Date().toLocaleString()}</p>
    <p>Fichier: ${selectedFile?.name || "Inconnu"}</p>
    <p>Colonne cible: ${targetCol}</p>
  </div>
  <div class="content">
    <h2>Performances du modèle</h2>
    <div class="metrics">
      <div class="metric-card"><div class="metric-label">Baseline</div><div class="metric-value">${(baselineScore * 100).toFixed(1)}%</div></div>
      <div class="metric-card"><div class="metric-label">Modèle nettoyé</div><div class="metric-value">${(cleanedScore * 100).toFixed(1)}%</div></div>
      <div class="metric-card"><div class="metric-label">Amélioration</div><div class="metric-value" style="color: ${delta >= 0 ? '#22C55E' : '#EF4444'}">${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}%</div></div>
    </div>
    <div class="chart">
      <h3 style="margin-bottom: 15px;">Courbe de performance</h3>
      <div class="bar"><div class="bar-label"><span>Baseline</span><span>${(baselineScore * 100).toFixed(1)}%</span></div><div class="bar-bg"><div class="bar-fill" style="width: ${baselineScore * 100}%"></div></div></div>
      <div class="bar"><div class="bar-label"><span>Modèle nettoyé</span><span>${(cleanedScore * 100).toFixed(1)}%</span></div><div class="bar-bg"><div class="bar-fill" style="width: ${cleanedScore * 100}%; background: linear-gradient(90deg, #EA580C, #F97316)"></div></div></div>
    </div>
    <h2>Logs d'exécution</h2>
    <table>
      <thead><tr><th>Heure</th><th>Action</th></tr></thead>
      <tbody>
        ${logs.map(l => `<tr><td>${l.time || '--:--:--'}</td><td><strong>${l.title || ''}</strong> ${l.detail || ''}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div class="footer">
    <p>Généré par l'agent d'entraînement IA | Modèle: ${selectedModel.toUpperCase()}</p>
  </div>
</div>
</body>
</html>`;
    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_entrainement_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => {
      if (closeSSERef.current) closeSSERef.current();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="flex items-center gap-2 p-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">AI</div>
          <span className="font-bold text-gray-900">MAINTENANCE</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                item.active ? "bg-orange-50 text-orange-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
              onClick={() => item.path && navigate(item.path)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            onClick={() => navigate("/parametres")}
          >
            <Settings size={18} />
            <span>Paramètres</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="2" width="20" height="20" rx="5" fill="#F97316" />
                <path d="M7 12h10M12 7v10" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Entrainement</h1>
              <p className="text-xs text-gray-500">Entraînez des modèles de machine learning pour la maintenance prédictive</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-400 hover:text-gray-600">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">A</div>
              <span className="text-sm text-gray-700">Admin</span>
              <ChevronDown size={14} className="text-gray-500" />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <DatasetUpload onLoaded={setDataset} onFileSelected={handleFileSelected} uploadedFileName={selectedFile?.name} />
              <TrainingProgress steps={steps} percent={percent} running={running} />
              
              <button
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleStart}
                disabled={running}
              >
                {running ? (
                  <><Loader2 size={20} className="animate-spin" /> Entraînement en cours...</>
                ) : (
                  <><Play size={20} fill="white" /> Démarrer l'entraînement</>
                )}
              </button>
              
              <AgentTrainingLogs logs={logs} onClear={() => setLogs([])} isRunning={running} />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ModelSelection selected={selectedModel} onSelect={setSelectedModel} mode={mode} onModeChange={setMode} />
                <AgentOptionsCard options={agentOptions} onChange={setAgentOptions} targetCol={targetCol} onTargetColChange={setTargetCol} availableColumns={[]} />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <button
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                  onClick={generateReport}
                >
                  <FileText size={20} />
                  Télécharger document
                </button>
                <ResultsCard results={results} logs={logs} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Training;