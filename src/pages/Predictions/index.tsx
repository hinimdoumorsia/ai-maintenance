import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Home, Database, Target, LayoutGrid, TrendingUp, Wrench, Bot, Settings } from "lucide-react";
import Header from "./components/Header";
import FileUploadCard from "./components/FileUploadCard";
import ResultsCard from "./components/ResultsCard";
import ModelSelector from "./components/ModelSelector";
import PredictionSettings from "./components/PredictionSettings";
import PredictionChart from "./components/PredictionChart";
import ExplanationsCard from "./components/ExplanationsCard";
import AgentLogs from "./components/AgentLogs";
import ActionButton from "./components/ActionButton";
import { DataPreview, ModelOption } from "./types";
import "./predictions.css";

const NAV_ITEMS = [
  { icon: Home,       label: "Tableau de bord", path: "/" },
  { icon: Database,   label: "Données",          path: "/donnees" },
  { icon: Target,     label: "Prédictions",      path: "/predictions", active: true },
  { icon: LayoutGrid, label: "Entrainement",     path: "/entrainement" }, // ← Maintenant pointe vers /entrainement
  { icon: LayoutGrid, label: "Modèles",          path: "/modeles" },       // ← Pointe vers /modeles
  { icon: Wrench,     label: "Outils",           path: "/outils" },
  { icon: Bot,        label: "Agents",           path: "/agents" },
];

const Predictions: React.FC = () => {
  const navigate = useNavigate();
  const [filePreview, setFilePreview] = useState<DataPreview | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelOption>({ id: "lstm", name: "LSTM", description: "Séries temporelles" });
  const [predictionLaunched, setPredictionLaunched] = useState(false);

  return (
    <div className="predictions-layout">
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

      {/* Main Content */}
      <main className="main-content">
        <Header />

        <div className="content-grid">
          {/* Left Column */}
          <div className="left-col">
            <FileUploadCard onFileLoaded={setFilePreview} />
            <ResultsCard />
          </div>

          {/* Right Column */}
          <div className="right-col">
            <div className="top-right-row">
              <ModelSelector onModelChange={setSelectedModel} />
              <PredictionSettings />
            </div>
            <ActionButton onLaunch={() => setPredictionLaunched(true)} />
            <div className="bottom-right-row">
              <PredictionChart />
              <ExplanationsCard />
            </div>
            <AgentLogs />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Predictions;