import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Home, Database, LayoutGrid, TrendingUp, Wrench, Bot, Settings, AlertCircle, Play, Loader2, Trash2, FileText } from "lucide-react";
import DatasetUpload from "./components/DatasetUpload";
import TrainingProgress from "./components/TrainingProgress";
import ModelSelection from "./components/ModelSelection";
import AgentOptionsCard from "./components/AgentOptionsCard";
import ResultsCard from "./components/ResultsCard";
import AgentTrainingLogs from "./components/AgentTrainingLogs";
import { TrainingDataset, ModelId, SelectionMode, AgentOptions, TrainingStep, AgentLogEntry } from "./types";
import { uploadAndTrain, streamLogs, getResults, LogEntry } from "../../services/api";
import "./training.css";

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
  
  // STOCKAGE POUR RECONSTRUIRE LES ARGUMENTS COUPÉS
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
    // RECONSTRUCTION DES ARGUMENTS COUPÉS
    if (log.title && log.title.includes("Arguments")) {
      const detail = log.detail || "";
      
      // Vérifie si l'argument est complet (se termine par } ou ])
      const isComplete = detail.trim().endsWith('}') || detail.trim().endsWith(']') || detail.includes('"}');
      
      if (!isComplete) {
        // Stocke le morceau coupé
        if (pendingArgumentsRef.current) {
          pendingArgumentsRef.current.detail += detail;
        } else {
          pendingArgumentsRef.current = {
            title: log.title,
            detail: detail,
            time: log.time
          };
        }
        return; // N'affiche pas encore
      }
      
      // Si on a un stockage en attente, on combine
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
      // Pour les autres logs, affiche normalement
      // Si on avait des arguments stockés mais qu'on reçoit autre chose, on vide
      if (pendingArgumentsRef.current) {
        // Affiche ce qui était stocké avant de continuer
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
    
    // GESTION DES ÉTAPES
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
    <div className="training-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">AI</div>
          <span className="brand-name">MAINTENANCE</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button key={item.label} className={`nav-item ${item.active ? "active" : ""}`} onClick={() => item.path && navigate(item.path)}>
              <item.icon size={17} className="nav-icon-svg" />
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => navigate("/parametres")}>
            <Settings size={17} className="nav-icon-svg" />
            <span className="nav-label">Paramètres</span>
          </button>
          <div className="help-card">
            <p className="help-title">Besoin d'aide?</p>
            <a href="#" className="help-link">Voir la documentation →</a>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="prediction-header">
          <div className="header-left">
            <div className="header-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="2" width="24" height="24" rx="6" fill="#F97316" />
                <path d="M8 14h12M14 8v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="header-title">Entrainement</h1>
              <p className="header-subtitle">Entraînez des modèles de machine learning pour la maintenance prédictive</p>
            </div>
          </div>
          <div className="header-right">
            <div className="notif-bell"><Bell size={20} /><span className="notif-badge">1</span></div>
            <div className="user-chip"><div className="user-avatar">A</div><span>Admin</span><ChevronDown size={16} /></div>
          </div>
        </header>

        {error && <div className="error-banner"><AlertCircle size={16} />{error}</div>}

        <div className="training-content-grid">
          <div className="training-left-col">
            <DatasetUpload onLoaded={setDataset} onFileSelected={handleFileSelected} uploadedFileName={selectedFile?.name} />
            <TrainingProgress steps={steps} percent={percent} running={running} />
            
            <button className="btn-start-training-main" onClick={handleStart} disabled={running}>
              {running ? <><Loader2 size={22} className="spin" /> Entraînement en cours...</> : <><Play size={22} fill="white" /> Démarrer l'entraînement</>}
            </button>
            
            <AgentTrainingLogs logs={logs} onClear={() => setLogs([])} isRunning={running} />
          </div>

          <div className="training-right-col">
            <div className="training-top-row">
              <ModelSelection selected={selectedModel} onSelect={setSelectedModel} mode={mode} onModeChange={setMode} />
              <AgentOptionsCard options={agentOptions} onChange={setAgentOptions} targetCol={targetCol} onTargetColChange={setTargetCol} availableColumns={[]} />
            </div>
            
            <div className="training-bottom-row">
              <button className="btn-download-report-main" onClick={generateReport}>
                <FileText size={22} />
                Télécharger document
              </button>
              <ResultsCard results={results} logs={logs} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Training;