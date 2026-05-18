import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, ChevronDown, Home, Database, LayoutGrid, TrendingUp,
  Wrench, Bot, Settings, AlertCircle, Play, Loader2, FileText,
  Menu, X, Mail, HelpCircle, BookOpen, Shield, GitBranch, MessageCircle,
  Globe, ChevronRight, Send, User, LogOut, Settings as SettingsIcon,
  Moon, Sun, ClipboardList
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import TrainingProgress from "./components/TrainingProgress";
import ModelSelection from "./components/ModelSelection";
import AgentOptionsCard from "./components/AgentOptionsCard";
import ResultsCard from "./components/ResultsCard";
import AgentTrainingLogs from "./components/AgentTrainingLogs";
import { TrainingDataset, ModelId, SelectionMode, AgentOptions, TrainingStep, AgentLogEntry } from "./types";
import { uploadAndTrain, streamLogs, getResults, LogEntry } from "../../services/api";

/* ─── Nav items ─────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { icon: Home,        label: "Tableau de bord", path: "/" },
  { icon: Database,    label: "Données",          path: "/donnees" },
  { icon: TrendingUp,  label: "Entrainement",     path: "/entrainement", active: true },
  { icon: LayoutGrid,  label: "Modèles",           path: "/models" },
  { icon: TrendingUp,  label: "Prédictions",       path: "/predictions" },
  { icon: Wrench,      label: "Outils",            path: "/outils" },
  { icon: Bot,         label: "Agents",            path: "/agents" },
  { icon: ClipboardList, label: "Maintenance",     path: "/maintenance" },
];

/* ─── Footer links ───────────────────────────────────────────────────────── */
const FOOTER_LINKS = {
  Produit: [
    { label: "Fonctionnalités",   href: "#" },
    { label: "Documentation",     href: "#" },
    { label: "Tarifs",            href: "#" },
    { label: "Changelog",         href: "#" },
  ],
  Support: [
    { label: "Centre d'aide",     href: "#" },
    { label: "Tutoriels",         href: "#" },
    { label: "Statut système",    href: "#" },
    { label: "API Reference",     href: "#" },
  ],
  Légal: [
    { label: "Mentions légales",  href: "#" },
    { label: "Confidentialité",   href: "#" },
    { label: "CGU",               href: "#" },
    { label: "Cookies",           href: "#" },
  ],
};

/* ─── Steps ──────────────────────────────────────────────────────────────── */
const INITIAL_STEPS: TrainingStep[] = [
  { id: "upload",   label: "Upload du dataset",  status: "pending" },
  { id: "analyse",  label: "Analyse des données", status: "pending" },
  { id: "training", label: "Entraînement",        status: "pending" },
  { id: "evaluation",label: "Évaluation",         status: "pending" },
  { id: "saving",   label: "Sauvegarde MLflow",   status: "pending" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const Footer: React.FC<{ isDark?: boolean }> = ({ isDark = false }) => {
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <footer className={`${isDark ? 'bg-gray-900' : 'bg-gray-950'} text-gray-300 border-t ${isDark ? 'border-gray-800' : 'border-gray-800'}`}>
      <div className={`border-b ${isDark ? 'border-gray-800/60 bg-gray-900/30' : 'border-gray-800/60 bg-gray-900/50'}`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">AI</div>
            <span className="font-bold text-white tracking-wide text-sm">MAINTENANCE IA</span>
          </div>
          <div className="flex items-center gap-3">
            {[
              { icon: GitBranch,     href: "#" },
              { icon: MessageCircle, href: "#" },
              { icon: Globe,         href: "#" },
            ].map(({ icon: Icon, href }) => (
              <a key={href} href={href}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-orange-500 flex items-center justify-center transition-colors duration-200">
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {Object.entries(FOOTER_LINKS).map(([category, links]) => (
          <div key={category} className="space-y-4">
            <h3 className="text-white font-semibold text-sm tracking-widest uppercase">{category}</h3>
            <ul className="space-y-2">
              {links.map(link => (
                <li key={link.label}>
                  <a href={link.href}
                    className="group flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-400 transition-colors duration-200">
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="space-y-4">
          <h3 className="text-white font-semibold text-sm tracking-widest uppercase">Liens rapides</h3>
          <div className="space-y-2">
            {[
              { icon: HelpCircle, label: "Aide & FAQ",        href: "#" },
              { icon: BookOpen,   label: "Documentation",     href: "#" },
              { icon: Shield,     label: "Sécurité",          href: "#" },
              { icon: Mail,       label: "nous@contact.com",  href: "mailto:nous@contact.com" },
            ].map(({ icon: Icon, label, href }) => (
              <a key={label} href={href}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-orange-400 transition-colors duration-200">
                <Icon size={14} className="text-orange-500/70" />
                {label}
              </a>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-1 space-y-4">
          <h3 className="text-white font-semibold text-sm tracking-widest uppercase">Contactez-nous</h3>
          <p className="text-xs text-gray-500 leading-relaxed">Un problème ? Une question ? Notre équipe vous répond sous 24 h.</p>

          {sent ? (
            <div className="flex items-center gap-2 p-3 bg-green-900/40 border border-green-700/50 rounded-xl text-green-400 text-sm">
              <Send size={14} /> Message envoyé avec succès !
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Votre nom" value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors" />
              <input type="email" placeholder="Votre email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors" />
              <textarea rows={3} placeholder="Votre message..." value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors resize-none" />
              <button type="submit"
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors duration-200">
                <Send size={14} /> Envoyer le message
              </button>
            </form>
          )}
        </div>
      </div>

      <div className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-800 bg-gray-950'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Maintenance IA — Tous droits réservés.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-orange-400 transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-orange-400 transition-colors">CGU</a>
            <a href="#" className="hover:text-orange-400 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN TRAINING PAGE
═══════════════════════════════════════════════════════════════════════════ */
const Training: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // État pour le thème
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Appliquer le thème
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  /* Redirect if not authenticated */
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  /* State */
  const [dataset,         setDataset]         = useState<TrainingDataset | null>(null);
  const [selectedFile,    setSelectedFile]    = useState<File | null>(null);
  const [selectedModel,   setSelectedModel]   = useState<ModelId>("catboost");
  const [targetCol,       setTargetCol]       = useState<string>("Maintenance Required");
  const [mode,            setMode]            = useState<SelectionMode>("manual");
  const [agentOptions,    setAgentOptions]    = useState<AgentOptions>({ autoTrain: true, explainDecisions: true });
  const [running,         setRunning]         = useState(false);
  const [percent,         setPercent]         = useState(0);
  const [steps,           setSteps]           = useState<TrainingStep[]>(INITIAL_STEPS);
  const [logs,            setLogs]            = useState<AgentLogEntry[]>([]);
  const [results,         setResults]         = useState<any>(null);
  const [error,           setError]           = useState<string | null>(null);
  const [trainingSuccess, setTrainingSuccess] = useState(false);
  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const currentJobIdRef    = useRef<string | null>(null);
  const closeSSERef        = useRef<(() => void) | null>(null);
  const pendingArgumentsRef = useRef<{ title: string; detail: string; time: string } | null>(null);

  /* Helpers */
  const updateStep = (stepId: string, status: "pending" | "in_progress" | "completed") => {
    setSteps(prev => {
      const newSteps = prev.map(s => s.id === stepId ? { ...s, status } : s);
      const done = newSteps.filter(s => s.status === "completed").length;
      let p = (done / newSteps.length) * 100;
      if (newSteps.some(s => s.status === "in_progress") && done < newSteps.length) p += 10;
      setPercent(Math.min(Math.round(p), 100));
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
    if (closeSSERef.current) { closeSSERef.current(); closeSSERef.current = null; }
  };

  const handleFileSelected = (file: File) => {
    resetAllForNewFile();
    setSelectedFile(file);
    setDataset({ fileName: file.name, fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`, rows: 0, columns: 0, data: [] });
    updateStep("upload", "completed");
  };

  const handleLog = (log: LogEntry) => {
    if (log.title && log.title.includes("Arguments")) {
      const detail = log.detail || "";
      const isComplete = detail.trim().endsWith('}') || detail.trim().endsWith(']') || detail.includes('"}');
      if (!isComplete) {
        if (pendingArgumentsRef.current) pendingArgumentsRef.current.detail += detail;
        else pendingArgumentsRef.current = { title: log.title, detail, time: log.time };
        return;
      }
      let finalDetail = detail;
      if (pendingArgumentsRef.current) { finalDetail = pendingArgumentsRef.current.detail + detail; pendingArgumentsRef.current = null; }
      setLogs(prev => [...prev, { time: log.time, title: log.title, detail: finalDetail, type: log.type as any }]);
    } else {
      if (pendingArgumentsRef.current) {
        setLogs(prev => [...prev, { time: pendingArgumentsRef.current!.time, title: pendingArgumentsRef.current!.title, detail: pendingArgumentsRef.current!.detail, type: "preprocess" as any }]);
        pendingArgumentsRef.current = null;
      }
      setLogs(prev => [...prev, { time: log.time, title: log.title, detail: log.detail, type: log.type as any }]);
    }

    const t = log.title.toLowerCase();
    const d = log.detail || "";
    if (t.includes("pipeline démarré"))           { updateStep("analyse", "in_progress"); }
    else if (t.includes("exécution : train_model")) { updateStep("analyse", "completed"); updateStep("training", "in_progress"); }
    else if (t.includes("résultat : train_model")) {
      updateStep("training", "completed"); updateStep("evaluation", "in_progress");
      const m = d.match(/baseline=([\d.]+)/);
      if (m) {
        const base = parseFloat(m[1]);
        const cm   = d.match(/cleaned=([\d.]+)/);
        const clean = cm ? parseFloat(cm[1]) : base;
        setResults({ comparison: { baseline_score: base, cleaned_score: clean, primary_metric: "accuracy", delta: clean - base, winner: clean > base ? "cleaned" : "baseline" }, is_production: clean > 0.8, mlflow_run_id: "from_logs" });
      }
    }
    else if (t.includes("exécution : save_model"))                          { updateStep("evaluation", "completed"); updateStep("saving", "in_progress"); }
    else if (t.includes("résultat : save_model") || t.includes("enregistré")) { updateStep("saving", "completed"); setTrainingSuccess(true); setPercent(100); }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleProfileClick = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const handleProfileSettings = () => {
    navigate('/parametres');
    setProfileDropdownOpen(false);
  };

  const handleStart = async () => {
    if (!selectedFile) { setError("Veuillez d'abord uploader un fichier"); return; }
    if (!targetCol)    { setError("Veuillez spécifier la colonne cible"); return; }

    setRunning(true); setError(null); setLogs([]); setResults(null); setTrainingSuccess(false);
    pendingArgumentsRef.current = null;
    resetProgress();

    try {
      const job = await uploadAndTrain(selectedFile, selectedModel, targetCol, "");
      currentJobIdRef.current = job.job_id;
      updateStep("analyse", "in_progress");

      const closeSSE = await streamLogs(
        job.job_id, handleLog,
        async () => {
          try {
            const r = await getResults(job.job_id);
            if (r && (r.baseline_score || r.comparison)) setResults(r);
            setTrainingSuccess(true); updateStep("saving", "completed"); setPercent(100);
          } catch {}
          setRunning(false);
        },
        (err) => { setError(err.message); setRunning(false); setTrainingSuccess(false); }
      );
      closeSSERef.current = closeSSE;
    } catch (err: any) { setError(err.message); setRunning(false); setTrainingSuccess(false); }
  };

  const generateReport = () => {
    const cmp  = results?.comparison || {};
    const base  = cmp.baseline_score || 0.4904;
    const clean = cmp.cleaned_score  || 0.4904;
    const delta = clean - base;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Rapport Entraînement</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;padding:40px}.container{max-width:1000px;margin:0 auto;background:white;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,.1);overflow:hidden}.header{background:linear-gradient(135deg,#F97316,#EA580C);color:white;padding:30px;text-align:center}.header h1{font-size:28px;margin-bottom:10px}.content{padding:30px}h2{color:#F97316;margin:25px 0 15px;padding-bottom:10px;border-bottom:2px solid #FEE2E2}.metrics{display:flex;gap:20px;flex-wrap:wrap;margin:20px 0}.metric-card{flex:1;background:#F9FAFB;border-radius:12px;padding:20px;text-align:center;border:1px solid #E5E7EB}.metric-value{font-size:32px;font-weight:bold;color:#F97316;margin:10px 0}.metric-label{color:#6B7280;font-size:12px}.chart{background:#F9FAFB;border-radius:12px;padding:20px;margin:20px 0}.bar{margin:15px 0}.bar-label{display:flex;justify-content:space-between;margin-bottom:5px;font-size:14px}.bar-bg{background:#E5E7EB;height:30px;border-radius:8px;overflow:hidden}.bar-fill{height:100%;background:linear-gradient(90deg,#F97316,#FBBF24);border-radius:8px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;color:white;font-weight:bold}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #E5E7EB;padding:10px;text-align:left}th{background:#F97316;color:white}.footer{background:#F9FAFB;padding:20px;text-align:center;color:#6B7280;font-size:12px;border-top:1px solid #E5E7EB}</style>
</head><body><div class="container"><div class="header"><h1>Rapport d'entraînement</h1><p>Généré le ${new Date().toLocaleString()}</p><p>Fichier : ${selectedFile?.name || "Inconnu"} — Colonne cible : ${targetCol}</p></div>
<div class="content"><h2>Performances</h2><div class="metrics"><div class="metric-card"><div class="metric-label">Baseline</div><div class="metric-value">${(base*100).toFixed(1)}%</div></div><div class="metric-card"><div class="metric-label">Nettoyé</div><div class="metric-value">${(clean*100).toFixed(1)}%</div></div><div class="metric-card"><div class="metric-label">Amélioration</div><div class="metric-value" style="color:${delta>=0?'#22C55E':'#EF4444'}">${delta>=0?'+':''}${(delta*100).toFixed(1)}%</div></div></div>
<div class="chart"><h3 style="margin-bottom:15px">Courbe de performance</h3><div class="bar"><div class="bar-label"><span>Baseline</span><span>${(base*100).toFixed(1)}%</span></div><div class="bar-bg"><div class="bar-fill" style="width:${base*100}%"></div></div></div><div class="bar"><div class="bar-label"><span>Nettoyé</span><span>${(clean*100).toFixed(1)}%</span></div><div class="bar-bg"><div class="bar-fill" style="width:${clean*100}%;background:linear-gradient(90deg,#EA580C,#F97316)"></div></div></div></div>
<h2>Logs d'exécution</h2><table><thead>32<th>Heure</th><th>Action</th></tr></thead><tbody>${logs.map(l=>`<tr><td>${l.time||'--:--:--'}<td><strong>${l.title||''}</strong> ${l.detail||''}</td></tr>`).join('')}</tbody></table></div>
<div class="footer">Généré par l'agent IA | Modèle : ${selectedModel.toUpperCase()}</div></div></body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `rapport_entrainement_${Date.now()}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => () => { if (closeSSERef.current) closeSSERef.current(); }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  /* ── Sidebar shared markup AVEC bouton thème ── */
  const SidebarContent = () => (
    <>
      <div className={`flex items-center gap-2 p-5 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">AI</div>
        <span className={`font-bold tracking-wide ${isDark ? 'text-white' : 'text-gray-900'}`}>MAINTENANCE</span>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              item.active
                ? isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-50 text-orange-600 shadow-sm"
                : isDark ? "text-gray-400 hover:bg-gray-800 hover:text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
            onClick={() => { item.path && navigate(item.path); setSidebarOpen(false); }}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} space-y-2`}>
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          <span>{isDark ? "Mode clair" : "Mode sombre"}</span>
        </button>
        <button
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          onClick={() => navigate("/parametres")}
        >
          <Settings size={18} />
          <span>Paramètres</span>
        </button>
      </div>
    </>
  );

  /* ─────────────────────────────── RENDER ─────────────────────────────── */
  return (
    <div className={`${isDark ? 'dark' : ''}`}>
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col`}>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className={`relative w-72 ${isDark ? 'bg-gray-900' : 'bg-white'} flex flex-col h-full shadow-2xl`}>
              <button onClick={() => setSidebarOpen(false)} className={`absolute top-4 right-4 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                <X size={20} />
              </button>
              <SidebarContent />
            </aside>
          </div>
        )}

        <div className="flex flex-1 min-h-0">
          <aside className={`hidden lg:flex w-64 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r flex-col fixed h-full z-20 shadow-sm`}>
            <SidebarContent />
          </aside>

          <div className="flex flex-col flex-1 lg:ml-64 min-h-screen">

            <header className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-950 border-gray-800'} border-b px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-lg`}>
              <div className="flex items-center gap-3">
                <button className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors" onClick={() => setSidebarOpen(true)}>
                  <Menu size={20} />
                </button>
                <div className="w-10 h-10 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="2" width="20" height="20" rx="5" fill="#F97316" />
                    <path d="M7 12h10M12 7v10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-white leading-tight tracking-wide">Entrainement</h1>
                  <p className="text-xs text-gray-400 hidden sm:block truncate">Entraînez des modèles ML pour la maintenance prédictive</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button className={`relative p-2 ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'} rounded-lg transition-colors`}>
                  <Bell size={18} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-gray-950" />
                </button>
                <div className="relative profile-dropdown">
                  <button onClick={handleProfileClick} className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-colors">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {user?.username?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <span className="text-sm text-gray-300 hidden sm:inline">{user?.username || 'Admin'}</span>
                    <ChevronDown size={14} className={`text-gray-500 hidden sm:inline transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-50">
                      <div className="p-3 border-b border-gray-700">
                        <p className="text-sm font-medium text-white">{user?.username || 'Admin'}</p>
                        <p className="text-xs text-gray-400">{user?.email || 'admin@example.com'}</p>
                      </div>
                      <div className="py-1">
                        <button onClick={handleProfileSettings} className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2">
                          <SettingsIcon size={14} /> Paramètres
                        </button>
                        <button onClick={handleLogout} className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2">
                          <LogOut size={14} /> Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <main className="flex-1 p-4 sm:p-6">
              {error && (
                <div className={`mb-4 p-3 ${isDark ? 'bg-red-900/30 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-700'} border rounded-xl flex items-start gap-2 text-sm`}>
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* Colonne de GAUCHE - SANS DatasetUpload */}
                <div className="space-y-4 flex flex-col">
                  <TrainingProgress steps={steps} percent={percent} running={running} />
                  <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50" onClick={handleStart} disabled={running}>
                    {running ? <><Loader2 size={20} className="animate-spin" /> Entraînement en cours…</> : <><Play size={18} fill="white" /> Démarrer l'entraînement</>}
                  </button>
                  <AgentTrainingLogs logs={logs} onClear={() => setLogs([])} isRunning={running} />
                </div>

                {/* Colonne de DROITE - PAS de DatasetUpload */}
                <div className="xl:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ModelSelection selected={selectedModel} onSelect={setSelectedModel} mode={mode} onModeChange={setMode} />
                    <AgentOptionsCard options={agentOptions} onChange={setAgentOptions} targetCol={targetCol} onTargetColChange={setTargetCol} availableColumns={[]} />
                  </div>
                  <div className="space-y-4">
                    <button className={`w-full py-3 ${isDark ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200' : 'bg-white hover:bg-gray-50 border-gray-800 text-gray-700'} border-2 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors`} onClick={generateReport}>
                      <FileText size={18} className="text-orange-500" /> Télécharger le rapport
                    </button>
                    <ResultsCard results={results} logs={logs} />
                  </div>
                </div>
              </div>
            </main>

            <Footer isDark={isDark} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Training;