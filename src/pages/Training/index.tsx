import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Home, Database, Target, LayoutGrid, TrendingUp, Wrench, Bot, Settings } from "lucide-react";
import DatasetUpload from "./components/DatasetUpload";
import TrainingProgress from "./components/TrainingProgress";
import ModelSelection from "./components/ModelSelection";
import AgentOptionsCard from "./components/AgentOptionsCard";
import StartTrainingButton from "./components/StartTrainingButton";
import ResultsCard from "./components/ResultsCard";
import AgentTrainingLogs from "./components/AgentTrainingLogs";
import { TrainingDataset, ModelId, SelectionMode, AgentOptions, TrainingStep } from "./types";
import "./training.css";

const NAV_ITEMS = [
  { icon: Home,       label: "Tableau de bord", path: "/" },
  { icon: Database,   label: "Données",          path: "/donnees" },
  { icon: TrendingUp, label: "Entrainement",     path: "/entrainement", active: true },
  { icon: LayoutGrid, label: "Modèles",          path: "/models" }, // ← Changé de null à '/models'
  { icon: TrendingUp, label: "Prédictions",      path: "/predictions" },
  { icon: Wrench,     label: "Outils",           path: "/outils" },
  { icon: Bot,        label: "Agents",           path: "/agents" },
];

const INITIAL_STEPS: TrainingStep[] = [
  { id: "analyse",     label: "Analyre du dataset",    status: "completed" },
  { id: "selection",   label: "Selection du modèle",   status: "completed" },
  { id: "preparation", label: "Préparation des donèes", status: "in_progress" },
  { id: "training",    label: "Entrainement du modèle", status: "pending" },
  { id: "evaluation",  label: "Évaluation du modèle",  status: "pending" },
];

const Training: React.FC = () => {
  const navigate = useNavigate();

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
    <div className="training-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">🧠</div>
          <span className="brand-name">AI MAINTENANCE</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${item.active ? "active" : ""}`}
              onClick={() => item.path && navigate(item.path)}
            >
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

      {/* Main */}
      <main className="main-content">
        {/* Header */}
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
            <div className="notif-bell">
              <Bell size={20} />
              <span className="notif-badge">1</span>
            </div>
            <div className="user-chip">
              <div className="user-avatar">A</div>
              <span>Admin</span>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>

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
    </div>
  );
};

export default Training;