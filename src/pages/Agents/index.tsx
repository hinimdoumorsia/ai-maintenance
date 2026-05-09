import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home, Database, GraduationCap, Package, Sparkles,
  Wrench, Bot, Settings, Bell, ChevronDown, Menu, X,
  ChevronLeft, ChevronRight, ChevronUp, Wifi, Globe,
  Users, Activity, Monitor, Cpu, Scissors, ClipboardList,
  Search, BarChart2, Brain, TrendingUp, AlertTriangle,
  GitBranch, CheckCircle, AlertCircle, XCircle,
  MoreHorizontal, ArrowRight, Zap, Shield, Clock, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type FluxStatus = "En Ligne" | "Hors Ligne";
interface CompatibilityEntry {
  id: string; incomentId: string;
  status: "Compatible" | "Alert" | "Non Compatible";
  actionLabel: string; message: string;
}
interface Agent {
  id: string; name: string; role: string; description: string;
  status: "Disponible" | "Occupé" | "Hors Ligne"; children?: Agent[];
}
interface ToolPerformance {
  name: string; execution: string; temps: string; success: string;
  f1Score: number; recall: number;
}
interface PerformanceBarPoint { label: number; f1Score: number; recall: number; }

// ─── Static Data ──────────────────────────────────────────────────────────────
const compatData: CompatibilityEntry[] = [
  { id:"1", incomentId:"source_01", status:"Compatible",     actionLabel:"envoyé au modèle", message:"Modèle LSTM nécessite format X" },
  { id:"2", incomentId:"source_02", status:"Alert",          actionLabel:"délégué",           message:"Modèle LSTM nécessite format X" },
  { id:"3", incomentId:"source_03", status:"Non Compatible", actionLabel:"rejeté",            message:"Modèle LSTM nécessite format X" },
  { id:"4", incomentId:"source_04", status:"Non Compatible", actionLabel:"rejeté",            message:"Modèle LSTM nécessite format X" },
];
const agentData: Agent[] = [{
  id:"adc", name:"Agent_Data_Cleaner", role:"Nettoyage",
  description:"Nettoyage — analyse des données actuelles", status:"Occupé",
  children:[
    { id:"afe",  name:"Agent_Feature_Engineer",     role:"Ingénierie", description:"Ingénierie des features",  status:"Disponible" },
    { id:"apf1", name:"Agent_Prediction_Finalizer", role:"Prédiction", description:"Finalisation prédiction", status:"Disponible" },
    { id:"apf2", name:"Agent_Prediction_Finalizer", role:"Prédiction", description:"Finalisation prédiction", status:"Disponible" },
  ],
}];
const toolData: ToolPerformance[] = [
  { name:"Data Validation",   execution:"9.3 ms",  temps:"0.0%", success:"99.2%", f1Score:0.92, recall:0.78 },
  { name:"Anomaly Detection", execution:"13.5 ms", temps:"0.0%", success:"99.2%", f1Score:0.88, recall:0.90 },
];
const chartData: PerformanceBarPoint[] = [
  { label:10, f1Score:0.82, recall:0.70 },
  { label:20, f1Score:0.91, recall:0.88 },
  { label:30, f1Score:0.75, recall:0.85 },
  { label:40, f1Score:0.89, recall:0.80 },
];

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  orange:"#F97316", orangeLight:"rgba(249,115,22,0.08)", orangeMid:"rgba(249,115,22,0.15)",
  blue:"#1E40AF", blueMid:"#3B82F6", blueLight:"rgba(59,130,246,0.10)",
  purple:"#8B5CF6", purpleLight:"rgba(139,92,246,0.10)",
  bg:"#F1F4F9", white:"#ffffff",
  border:"#E5E7EB", borderLight:"#F3F4F6",
  text:"#111827", textMid:"#374151", textMuted:"#6B7280", textFaint:"#9CA3AF",
  green:"#16A34A", greenLight:"rgba(22,163,74,0.08)",
  amber:"#D97706", amberLight:"rgba(217,119,6,0.08)",
  red:"#DC2626",   redLight:"rgba(220,38,38,0.08)",
};

// ─── Shared components ────────────────────────────────────────────────────────
const CardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ backgroundColor:C.white, borderRadius:14, border:`1px solid ${C.border}`, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", overflow:"hidden" }}>
    {children}
  </div>
);

const CardHead: React.FC<{
  icon: React.ReactNode; title: string; subtitle?: string;
  collapsed: boolean; onToggle: () => void; badge?: React.ReactNode;
}> = ({ icon, title, subtitle, collapsed, onToggle, badge }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 22px", borderBottom:`1px solid ${C.borderLight}` }}>
    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ width:38, height:38, backgroundColor:C.orangeLight, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", color:C.orange, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{title}</div>
        {subtitle && <div style={{ fontSize:12, color:C.textMuted, marginTop:1 }}>{subtitle}</div>}
      </div>
    </div>
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      {badge}
      <button onClick={onToggle} style={{ padding:5, color:C.textFaint, background:"none", border:"none", cursor:"pointer", borderRadius:7, display:"flex" }}>
        {collapsed ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
      </button>
    </div>
  </div>
);

const TH: React.FC<{ cols: string[]; template: string }> = ({ cols, template }) => (
  <div style={{ display:"grid", gridTemplateColumns:template, padding:"10px 22px", backgroundColor:"#F9FAFB", borderBottom:`1px solid ${C.borderLight}` }}>
    {cols.map(c => <span key={c} style={{ fontSize:11, fontWeight:700, color:C.textMuted }}>{c}</span>)}
  </div>
);

// ─── FluxCard ─────────────────────────────────────────────────────────────────
const FluxCard: React.FC<{ status: FluxStatus }> = ({ status }) => {
  const [col, setCol] = useState(false);
  const online = status === "En Ligne";

  const Node: React.FC<{ icon: React.ReactNode; label: string; hi?: boolean }> = ({ icon, label, hi }) => (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:7, flexShrink:0 }}>
      <div style={{ width:50, height:50, borderRadius:13, border:`1.5px solid ${hi ? C.orange : C.border}`, backgroundColor:hi ? C.orangeLight : C.white, display:"flex", alignItems:"center", justifyContent:"center", color:hi ? C.orange : C.textMuted, boxShadow:hi ? `0 0 0 4px ${C.orangeLight}` : undefined }}>
        {icon}
      </div>
      <span style={{ fontSize:10, fontWeight:500, color:C.textMid, textAlign:"center", lineHeight:1.3, whiteSpace:"pre-line" }}>{label}</span>
    </div>
  );

  const Arr = () => (
    <div style={{ flex:1, display:"flex", alignItems:"center", padding:"0 6px", paddingBottom:22, minWidth:24 }}>
      <div style={{ flex:1, height:1.5, background:`linear-gradient(to right,${C.border},${C.orange})`, position:"relative" }}>
        <ArrowRight size={11} style={{ position:"absolute", right:-6, top:"50%", transform:"translateY(-50%)", color:C.orange }} />
      </div>
    </div>
  );

  return (
    <CardShell>
      <CardHead icon={<Wifi size={18}/>} title="Flux de Données & Modèles" subtitle="Flux des données et délégation d'agents" collapsed={col} onToggle={() => setCol(!col)}
        badge={<span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:999, fontSize:11, fontWeight:600, backgroundColor:online ? C.greenLight : C.redLight, color:online ? C.green : C.red }}>
          <span style={{ width:6, height:6, borderRadius:"50%", backgroundColor:online ? C.green : C.red }} />{status}
        </span>}
      />
      {!col && (
        <div style={{ padding:"20px 22px", overflowX:"auto" }}>
          <div style={{ display:"flex", alignItems:"center", minWidth:780 }}>
            <Node icon={<Monitor size={22}/>} label={"Données\nCapteurs"} />
            <Arr />
            <Node icon={<Bot size={24}/>} label={"Agent\nCentral"} hi />
            <Arr />

            {/* Toolbox */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
              <div style={{ marginBottom:8, padding:"3px 10px", backgroundColor:C.greenLight, color:C.green, borderRadius:999, fontSize:10, fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>
                <Zap size={10}/> Agent Central
              </div>
              <div style={{ backgroundColor:"#F9FAFB", borderRadius:12, padding:"12px 14px", minWidth:152, border:`1px solid ${C.borderLight}` }}>
                <div style={{ fontSize:11, fontWeight:600, color:C.text, marginBottom:10, textAlign:"center" }}>Trousse à Outils</div>
                {[{I:Scissors, l:"Nettoyage"},{I:ClipboardList, l:"Validation de Schéma"},{I:Search, l:"Analyse de Compatibilité"}].map(({I, l}, i, a) => (
                  <div key={l} style={{ display:"flex", alignItems:"center", gap:7, fontSize:10, color:C.textMuted, padding:"4px 0", borderBottom:i<a.length-1?`1px solid ${C.borderLight}`:"none" }}>
                    <I size={11} color={C.orange}/>{l}
                  </div>
                ))}
                <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${C.borderLight}` }}>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:9, fontWeight:600, color:C.green, backgroundColor:C.greenLight, padding:"2px 8px", borderRadius:999 }}>
                    <CheckCircle size={9}/> En Ligne
                  </span>
                </div>
              </div>
            </div>

            <Arr />

            {/* Models */}
            <div style={{ display:"flex", flexDirection:"column", gap:8, flexShrink:0 }}>
              {[{I:BarChart2, l:"Modèles\nMachine Learning"},{I:Brain, l:"Modèles\nDeep Learning"}].map(({I, l}) => (
                <div key={l} style={{ display:"flex", alignItems:"center", gap:10, backgroundColor:C.white, borderRadius:10, padding:"8px 12px", border:`1px solid ${C.border}` }}>
                  <div style={{ width:34, height:34, borderRadius:8, backgroundColor:C.blueLight, display:"flex", alignItems:"center", justifyContent:"center", color:C.blueMid, flexShrink:0 }}><I size={17}/></div>
                  <div style={{ fontSize:9, fontWeight:600, color:C.textMid, whiteSpace:"pre-line", lineHeight:1.4 }}>{l}</div>
                </div>
              ))}
            </div>

            <Arr />

            {/* Prediction */}
            <div style={{ display:"flex", flexDirection:"column", gap:14, flexShrink:0 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                <div style={{ width:46, height:46, borderRadius:12, border:`1.5px solid ${C.border}`, backgroundColor:C.white, display:"flex", alignItems:"center", justifyContent:"center", color:C.blueMid }}><TrendingUp size={20}/></div>
                <span style={{ fontSize:10, fontWeight:500, color:C.textMid }}>Prédiction</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:30, height:30, borderRadius:"50%", border:`2px solid ${C.amber}`, display:"flex", alignItems:"center", justifyContent:"center", color:C.amber }}><AlertTriangle size={13}/></div>
                <span style={{ fontSize:9, fontWeight:500, color:C.textMuted, lineHeight:1.4 }}>Erreur /<br/>Redirection</span>
              </div>
            </div>

            <Arr />
            <Node icon={<GitBranch size={20}/>} label={"Autres\nAgents"} />
          </div>
        </div>
      )}
    </CardShell>
  );
};

// ─── CompatibilityCard ────────────────────────────────────────────────────────
const CompatibilityCard: React.FC<{ entries: CompatibilityEntry[] }> = ({ entries }) => {
  const [col, setCol] = useState(false);
  const cfg = (s: CompatibilityEntry["status"]) => {
    if (s === "Compatible")     return { bg:C.greenLight, color:C.green, Icon:CheckCircle };
    if (s === "Alert")          return { bg:C.amberLight, color:C.amber, Icon:AlertCircle };
    return                             { bg:C.redLight,   color:C.red,   Icon:XCircle    };
  };
  return (
    <CardShell>
      <CardHead icon={<Globe size={18}/>} title="Statut de Compatibilité" subtitle="Compatibilité des données entrantes" collapsed={col} onToggle={() => setCol(!col)} />
      {!col && (
        <div>
          <TH cols={["Incoment ID","Statut","Action","Message"]} template="160px 1fr 160px 1fr" />
          {entries.map(e => {
            const { bg, color, Icon } = cfg(e.status);
            return (
              <div key={e.id} style={{ display:"grid", gridTemplateColumns:"160px 1fr 160px 1fr", padding:"12px 22px", borderBottom:`1px solid ${C.borderLight}`, alignItems:"center" }}>
                <span style={{ fontSize:13, fontWeight:500, color:C.text, fontFamily:"monospace" }}>{e.incomentId}</span>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:999, fontSize:10, fontWeight:600, backgroundColor:bg, color, width:"fit-content" }}>
                  <Icon size={11}/> {e.status}
                </span>
                <span style={{ fontSize:11, color:C.orange, fontWeight:500 }}>{e.actionLabel}</span>
                <span style={{ fontSize:11, color:C.textFaint }}>{e.message}</span>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
};

// ─── DelegationCard ───────────────────────────────────────────────────────────
const AgentRow: React.FC<{ agent: Agent; depth?: number }> = ({ agent, depth = 0 }) => {
  const [exp, setExp] = useState(true);
  const sCfg = (s: Agent["status"]) => {
    if (s === "Disponible") return { bg:C.greenLight, color:C.green, dot:C.green };
    if (s === "Occupé")     return { bg:C.amberLight, color:C.amber, dot:C.amber };
    return                         { bg:C.redLight,   color:C.red,   dot:C.red   };
  };
  const { bg, color, dot } = sCfg(agent.status);
  return (
    <>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 120px 130px 36px", alignItems:"center", paddingLeft:22+depth*28, paddingRight:22, paddingTop:12, paddingBottom:12, borderBottom:`1px solid ${C.borderLight}`, backgroundColor:depth>0 ? "#FAFAFA" : C.white }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {depth > 0 && <div style={{ width:10, height:10, borderLeft:`1.5px solid ${C.border}`, borderBottom:`1.5px solid ${C.border}`, marginRight:2, flexShrink:0 }} />}
          <button onClick={() => setExp(!exp)} style={{ background:"none", border:"none", cursor:"pointer", color:C.textFaint, display:"flex", padding:0 }}>
            {agent.children?.length ? (exp ? <ChevronDown size={14}/> : <ChevronRight size={14}/>) : <div style={{ width:14 }}/>}
          </button>
          <div style={{ width:30, height:30, borderRadius:8, backgroundColor:C.orangeLight, display:"flex", alignItems:"center", justifyContent:"center", color:C.orange, flexShrink:0 }}><Bot size={15}/></div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{agent.name}</div>
            <div style={{ fontSize:10, color:C.textFaint, marginTop:1 }}>{agent.description}</div>
          </div>
        </div>
        <span style={{ fontSize:12, color:C.textMuted }}>{agent.role}</span>
        <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:999, fontSize:10, fontWeight:600, backgroundColor:bg, color, width:"fit-content" }}>
          <span style={{ width:6, height:6, borderRadius:"50%", backgroundColor:dot }}/>{agent.status}
        </span>
        <button style={{ background:"none", border:"none", cursor:"pointer", color:C.textFaint, display:"flex", alignItems:"center", justifyContent:"center", padding:4, borderRadius:6 }}><MoreHorizontal size={15}/></button>
      </div>
      {exp && agent.children?.map(c => <AgentRow key={c.id} agent={c} depth={depth+1}/>)}
    </>
  );
};

const DelegationCard: React.FC<{ agents: Agent[] }> = ({ agents }) => {
  const [col, setCol] = useState(false);
  return (
    <CardShell>
      <CardHead icon={<Users size={18}/>} title="Délégation d'Agents" collapsed={col} onToggle={() => setCol(!col)}/>
      {!col && (
        <div>
          <TH cols={["Agent","Rôle","Statut",""]} template="1fr 120px 130px 36px" />
          {agents.map(a => <AgentRow key={a.id} agent={a} depth={0}/>)}
        </div>
      )}
    </CardShell>
  );
};

// ─── PerformanceCard ──────────────────────────────────────────────────────────
const PerformanceCard: React.FC<{ tools: ToolPerformance[]; chartData: PerformanceBarPoint[] }> = ({ tools, chartData }) => {
  const [col, setCol] = useState(false);
  const maxVal = Math.max(...chartData.flatMap(d => [d.f1Score, d.recall]));
  const CH = 100;
  return (
    <CardShell>
      <CardHead icon={<Activity size={18}/>} title="Performance des Outils" collapsed={col} onToggle={() => setCol(!col)}/>
      {!col && (
        <div>
          <TH cols={["Outil","Exécution","Temps","Succès"]} template="1fr 100px 80px 90px" />
          {tools.map(t => (
            <div key={t.name} style={{ display:"grid", gridTemplateColumns:"1fr 100px 80px 90px", padding:"12px 22px", borderBottom:`1px solid ${C.borderLight}`, alignItems:"center" }}>
              <span style={{ fontSize:13, fontWeight:500, color:C.text }}>{t.name}</span>
              <span style={{ fontSize:12, color:C.textMuted }}>{t.execution}</span>
              <span style={{ fontSize:12, color:C.textMuted }}>{t.temps}</span>
              <span style={{ fontSize:12, color:C.green, fontWeight:600 }}>{t.success}</span>
            </div>
          ))}
          <div style={{ padding:"18px 22px" }}>
            <div style={{ display:"flex", gap:20, marginBottom:14 }}>
              {[{c:C.blueMid,l:"F1-Score"},{c:C.purple,l:"Recall"}].map(({c,l}) => (
                <div key={l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.textMuted }}>
                  <div style={{ width:10, height:10, borderRadius:2, backgroundColor:c }}/>{l}
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ display:"flex", flexDirection:"column", justifyContent:"space-between", height:CH+22, paddingBottom:22, fontSize:10, color:C.textFaint, minWidth:28, textAlign:"right" }}>
                {["1.0","0.8","0.6","0.3","0.0"].map(v=><span key={v}>{v}</span>)}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-end", height:CH, borderBottom:`1px solid ${C.border}` }}>
                  {chartData.map((pt,i) => (
                    <div key={pt.label} style={{ flex:1, display:"flex", gap:3, alignItems:"flex-end" }}>
                      <div style={{ flex:1, backgroundColor:C.blueMid, borderRadius:"3px 3px 0 0", height:`${(pt.f1Score/maxVal)*CH}px`, transition:`height 0.5s ease ${i*0.06}s` }}/>
                      <div style={{ flex:1, backgroundColor:C.purple, borderRadius:"3px 3px 0 0", height:`${(pt.recall/maxVal)*CH}px`, transition:`height 0.5s ease ${i*0.06+0.1}s` }}/>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", marginTop:6 }}>
                  {chartData.map(pt=><div key={pt.label} style={{ flex:1, textAlign:"center", fontSize:10, color:C.textMuted }}>{pt.label}</div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </CardShell>
  );
};

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV = [
  { label:"Tableau de bord", Icon:Home,          path:"/" },
  { label:"Données",          Icon:Database,      path:"/donnees" },
  { label:"Entraînement",     Icon:GraduationCap, path:"/entrainement" },
  { label:"Modèles",          Icon:Package,       path:"/models" },
  { label:"Prédictions",      Icon:Sparkles,      path:"/predictions" },
  { label:"Outils",           Icon:Wrench,        path:"/outils" },
  { label:"Agents",           Icon:Bot,           path:"/agents" },
];
const TABS = [
  { id:"flux",       label:"Flux de Données", short:"Flux",   Icon:Wifi    },
  { id:"compat",     label:"Compatibilité",   short:"Compat.", Icon:Shield  },
  { id:"delegation", label:"Délégation",      short:"Délég.", Icon:Users   },
  { id:"perf",       label:"Performance",     short:"Perf.",  Icon:Activity },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebar, setSidebar] = useState(true);
  const [mobile,  setMobile]  = useState(false);
  const [active,  setActive]  = useState(0);
  const [dir,     setDir]     = useState<"left"|"right">("left");
  const [aKey,    setAKey]    = useState(0);

  useEffect(() => {
    const fn = () => { const m = window.innerWidth < 768; setMobile(m); setSidebar(!m); };
    fn(); window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const goTo = (i: number) => {
    if (i === active) return;
    setDir(i > active ? "left" : "right");
    setActive(i); setAKey(k => k+1);
  };

  const renderCard = () => {
    switch (active) {
      case 0: return <FluxCard status="En Ligne"/>;
      case 1: return <CompatibilityCard entries={compatData}/>;
      case 2: return <DelegationCard agents={agentData}/>;
      case 3: return <PerformanceCard tools={toolData} chartData={chartData}/>;
    }
  };

  const navStyle = (on: boolean): React.CSSProperties => ({
    width:"100%", display:"flex", alignItems:"center", gap:12, padding:"10px 12px",
    borderRadius:8, fontSize:14, fontWeight:500, border:"none", cursor:"pointer",
    backgroundColor: on ? C.orangeLight : "transparent",
    color: on ? C.orange : C.textMuted, position:"relative", transition:"all 0.15s",
  });

  return (
    <div style={{ minHeight:"100vh", backgroundColor:C.bg, fontFamily:"'DM Sans','Geist',system-ui,sans-serif" }}>
      <style>{`
        @keyframes slL { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slR { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
        .sl-left  { animation: slL 0.2s cubic-bezier(.22,.68,0,1.15) forwards; }
        .sl-right { animation: slR 0.2s cubic-bezier(.22,.68,0,1.15) forwards; }
        .nh:hover { background-color:#F9FAFB!important; color:#111827!important; }
        .tbtn:hover { opacity:0.82; }
        .abtn:hover { background-color:#F3F4F6!important; }
      `}</style>

      <div style={{ display:"flex" }}>
        {/* overlay */}
        {mobile && sidebar && (
          <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.35)", zIndex:40 }} onClick={() => setSidebar(false)}/>
        )}

        {/* ── Sidebar ── */}
        <aside style={{
          position: mobile ? "fixed" : "sticky", top:0, zIndex:50,
          width:252, height:"100vh", backgroundColor:C.white,
          borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column",
          transition:"transform 0.25s ease", flexShrink:0,
          transform: sidebar ? "translateX(0)" : "translateX(-100%)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"18px 16px", borderBottom:`1px solid ${C.borderLight}` }}>
            <div style={{ width:36, height:36, backgroundColor:C.orangeLight, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", color:C.orange }}><Cpu size={19}/></div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:C.text }}>AI Maintenance</div>
              <div style={{ fontSize:10, color:C.textMuted, marginTop:1 }}>Système intelligent</div>
            </div>
            {mobile && <button onClick={() => setSidebar(false)} style={{ background:"none", border:"none", cursor:"pointer", color:C.textFaint, display:"flex" }}><X size={16}/></button>}
          </div>

          <nav style={{ flex:1, padding:"8px 8px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" }}>
            {NAV.map(({ label, Icon, path }) => {
              const on = location.pathname === path;
              return (
                <button key={path} onClick={() => { navigate(path); if(mobile) setSidebar(false); }}
                  className={on ? "" : "nh"} style={navStyle(on)}>
                  <Icon size={17}/><span>{label}</span>
                  {on && <div style={{ position:"absolute", right:0, width:2.5, height:18, backgroundColor:C.orange, borderRadius:999 }}/>}
                </button>
              );
            })}
          </nav>

          <div style={{ padding:"8px 8px 16px", borderTop:`1px solid ${C.borderLight}` }}>
            <button onClick={() => navigate("/parametres")} className="nh" style={navStyle(false)}>
              <Settings size={17}/><span>Paramètres</span>
            </button>
            <div style={{ marginTop:10, padding:"13px 14px", background:"linear-gradient(135deg,#1E40AF,#2563EB)", borderRadius:12, color:"white" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                <RefreshCw size={12}/><span style={{ fontSize:12, fontWeight:600 }}>Besoin d'aide ?</span>
              </div>
              <p style={{ fontSize:10, opacity:0.7, marginBottom:10, lineHeight:1.5, margin:"4px 0 10px" }}>Documentation et support</p>
              <button style={{ width:"100%", fontSize:10, backgroundColor:"rgba(255,255,255,0.15)", padding:"6px 0", borderRadius:999, border:"1px solid rgba(255,255,255,0.2)", color:"white", cursor:"pointer" }}>
                Voir la documentation
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:"100vh", minWidth:0 }}>

          {/* Topbar */}
          <header style={{ position:"sticky", top:0, zIndex:30, height:64, backgroundColor:C.white, borderBottom:`1px solid ${C.borderLight}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              {mobile && <button onClick={() => setSidebar(true)} style={{ background:"none", border:"none", cursor:"pointer", color:C.textMid, display:"flex" }}><Menu size={20}/></button>}
              <div>
                <h1 style={{ fontSize:19, fontWeight:700, color:C.text, margin:0, letterSpacing:"-0.02em" }}>Agents</h1>
                <p style={{ fontSize:12, color:C.textMuted, margin:"1px 0 0" }}>Flux de données, prédictions et délégation</p>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button style={{ position:"relative", width:34, height:34, backgroundColor:"#F9FAFB", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${C.border}`, cursor:"pointer" }}>
                <Bell size={16} color={C.textMid}/>
                <span style={{ position:"absolute", top:-3, right:-3, minWidth:16, height:16, backgroundColor:C.orange, color:"white", fontSize:9, fontWeight:700, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center" }}>3</span>
              </button>
              <button style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 10px", borderRadius:8, border:`1px solid ${C.border}`, background:"none", cursor:"pointer" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#667eea,#764ba2)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:11, fontWeight:700 }}>AD</div>
                <span style={{ fontSize:13, fontWeight:500, color:C.textMid }}>Admin</span>
                <ChevronDown size={13} color={C.textFaint}/>
              </button>
            </div>
          </header>

          {/* Content */}
          <main style={{ flex:1, padding:"22px 24px", overflowY:"auto" }}>
            <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", flexDirection:"column", gap:16 }}>

              {/* Tabs */}
              <div style={{ display:"flex", gap:5, backgroundColor:C.white, borderRadius:12, padding:5, border:`1px solid ${C.border}` }}>
                {TABS.map(({ id, label, short, Icon }, i) => {
                  const on = i === active;
                  return (
                    <button key={id} onClick={() => goTo(i)} className="tbtn"
                      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 10px", borderRadius:9, fontSize:13, fontWeight:on?600:400, border:"none", cursor:"pointer", backgroundColor:on?C.orange:"transparent", color:on?"white":C.textMuted, transition:"all 0.18s" }}>
                      <Icon size={15}/>
                      <span>{mobile ? short : label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Prev / dots / Next */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <button onClick={() => goTo(active===0 ? TABS.length-1 : active-1)} className="abtn"
                  style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:8, fontSize:12, fontWeight:500, border:`1px solid ${C.border}`, backgroundColor:C.white, color:C.textMid, cursor:"pointer", transition:"background 0.15s" }}>
                  <ChevronLeft size={14}/> Précédent
                </button>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  {TABS.map((_,i) => (
                    <button key={i} onClick={() => goTo(i)} style={{ width:i===active?22:7, height:7, borderRadius:999, padding:0, border:"none", cursor:"pointer", backgroundColor:i===active?C.orange:C.border, transition:"all 0.2s ease" }}/>
                  ))}
                </div>
                <button onClick={() => goTo(active===TABS.length-1 ? 0 : active+1)} className="abtn"
                  style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:8, fontSize:12, fontWeight:500, border:`1px solid ${C.border}`, backgroundColor:C.white, color:C.textMid, cursor:"pointer", transition:"background 0.15s" }}>
                  Suivant <ChevronRight size={14}/>
                </button>
              </div>

              {/* Card */}
              <div key={aKey} className={`sl-${dir}`}>
                {renderCard()}
              </div>

            </div>
          </main>

          {/* Footer */}
          <footer style={{ backgroundColor:C.white, borderTop:`1px solid ${C.borderLight}`, flexShrink:0 }}>
            <div style={{ maxWidth:1100, margin:"0 auto", padding:"18px 24px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:20 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                    <Cpu size={14} color={C.orange}/>
                    <span style={{ fontSize:13, fontWeight:700, color:C.text }}>AI Maintenance</span>
                  </div>
                  <p style={{ fontSize:11, color:C.textMuted, lineHeight:1.5, margin:0 }}>Solution intelligente de maintenance prédictive</p>
                </div>
                <div>
                  <h5 style={{ fontSize:11, fontWeight:600, marginBottom:8, color:C.textMid }}>Liens rapides</h5>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {["Documentation","Support","API"].map(l=><a key={l} href="#" style={{ fontSize:11, color:C.textMuted, textDecoration:"none" }}>{l}</a>)}
                  </div>
                </div>
                <div>
                  <h5 style={{ fontSize:11, fontWeight:600, marginBottom:8, color:C.textMid }}>Statut système</h5>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                    <CheckCircle size={13} color={C.green}/>
                    <span style={{ fontSize:11, color:C.textMid }}>Tous systèmes opérationnels</span>
                  </div>
                  <span style={{ fontSize:10, color:C.textFaint }}>Version 2.4.0</span>
                </div>
              </div>
              <div style={{ textAlign:"center", paddingTop:12, marginTop:12, borderTop:`1px solid ${C.borderLight}` }}>
                <span style={{ fontSize:10, color:C.textFaint }}>© 2024 AI Maintenance System. Tous droits réservés.</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AgentsPage;