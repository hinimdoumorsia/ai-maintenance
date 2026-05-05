import React, { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { Activity, DollarSign, AlertTriangle, Search, Plus, RefreshCw } from "lucide-react";
import "./dashboard.css";

const API = "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface HeroKpis {
  disponibilite_7j: number; disponibilite_7j_prev: number;
  economies_ytd_k: number; pannes_evitees_ytd: number;
  machines_en_alerte: number; machines_critiques: number; machines_total: number;
  taux_detection_pct: number; faux_positifs_pct: number; lead_time_jours: number;
}
interface MachineRow {
  id_machine: number; code_machine: string; nom_machine: string;
  type_machine: string; nom_atelier: string; vrms: number;
  zone: string; type_defaut: string; gravite: string;
  stade_degradation: string; drbf_jours: number;
}
interface AlerteRow {
  id_alerte: number; timestamp_alerte: string; niveau: string;
  type_alerte: string; titre: string; message: string; code_machine: string;
}
interface KpiCats {
  revenue_recovery:    { economies_ytd_k: number; pannes_evitees: number; cout_moy_panne: number; roi_pct: number };
  asset_availability:  { disponibilite_moy: number; oee_moy: number; mtbf_moy: number; mttr_moy: number };
  risk_reduction:      { machines_zone_d: number; defauts_actifs: number; incidents_ytd: number; drbf_min_parc: number };
  smart_replacement:   { remplacements_optimaux: number; economies_remplacement_k: number; pm_supprimees: number; economies_pm_k: number };
  iot_network:         { total_capteurs: number; capteurs_actifs: number; batterie_faible: number; en_panne: number; passerelles_actives: number; batterie_moy_pct: number };
  planned_maintenance: { bt_planifies: number; bt_en_cours: number; bt_termines: number; bt_urgents: number; duree_moy_h: number };
  service_loss:        { nb_pannes_historique: number; arret_moy_h: number; pertes_arret_k: number; total_arret_h: number };
  workforce:           { nb_techniciens: number; nb_certifications: number; equipe_active: number; nb_interventions: number };
  predictive_power:    { taux_detection_pct: number; confiance_moy_pct: number; defauts_actifs: number; lead_time_moy_j: number };
}

// ─── Scroll helper ────────────────────────────────────────────────────────────
const scrollToSection = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

// ─── Flower SVG (pétales cliquables) ─────────────────────────────────────────
const FlowerSVG: React.FC<{ onPetalClick: (id: string) => void }> = ({ onPetalClick }) => (
  <svg className="flower-svg" viewBox="0 0 380 380" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="centerGrad">
        <stop offset="0%" stopColor="#00d9a3" stopOpacity="0.4"/>
        <stop offset="100%" stopColor="#00d9a3" stopOpacity="0.1"/>
      </radialGradient>
    </defs>
    <g transform="translate(190,190)">
      {/* Smart Replacement — haut */}
      <g className="flower-petal" onClick={() => onPetalClick("kpi-smart")} style={{cursor:"pointer"}}>
        <circle cx="0" cy="-115" r="48" fill="rgba(139,92,246,0.18)" stroke="#a855f7" strokeWidth="1.5"/>
        <text x="0" y="-118" textAnchor="middle" className="d-svg-text" fontSize="10" fontWeight="600">Smart</text>
        <text x="0" y="-105" textAnchor="middle" className="d-svg-text" fontSize="10" fontWeight="600">Replacement</text>
      </g>
      {/* Planned Mtnce — haut-droite */}
      <g className="flower-petal" onClick={() => onPetalClick("kpi-planned")} style={{cursor:"pointer"}}>
        <circle cx="81" cy="-81" r="48" fill="rgba(61,142,255,0.18)" stroke="#3d8eff" strokeWidth="1.5"/>
        <text x="81" y="-84" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="600">Planned</text>
        <text x="81" y="-72" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="600">Mtnce ↓</text>
      </g>
      {/* IoT Network — droite */}
      <g className="flower-petal" onClick={() => onPetalClick("kpi-iot")} style={{cursor:"pointer"}}>
        <circle cx="115" cy="0" r="48" fill="rgba(6,182,212,0.18)" stroke="#06b6d4" strokeWidth="1.5"/>
        <text x="115" y="-3" textAnchor="middle" className="d-svg-text" fontSize="10" fontWeight="600">IoT</text>
        <text x="115" y="9"  textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="500">Network</text>
      </g>
      {/* Service Loss — bas-droite */}
      <g className="flower-petal" onClick={() => onPetalClick("kpi-loss")} style={{cursor:"pointer"}}>
        <circle cx="81" cy="81" r="48" fill="rgba(236,72,153,0.18)" stroke="#ec4899" strokeWidth="1.5"/>
        <text x="81" y="78" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="600">Service</text>
        <text x="81" y="90" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="600">Loss ↓</text>
      </g>
      {/* Risk Reduction — bas */}
      <g className="flower-petal" onClick={() => onPetalClick("kpi-risk")} style={{cursor:"pointer"}}>
        <circle cx="0" cy="115" r="48" fill="rgba(239,68,68,0.18)" stroke="#ef4444" strokeWidth="1.5"/>
        <text x="0" y="112" textAnchor="middle" className="d-svg-text" fontSize="10" fontWeight="600">Risk</text>
        <text x="0" y="124" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="500">Reduction</text>
      </g>
      {/* Workforce — bas-gauche */}
      <g className="flower-petal" onClick={() => onPetalClick("kpi-workforce")} style={{cursor:"pointer"}}>
        <circle cx="-81" cy="81" r="48" fill="rgba(245,158,11,0.18)" stroke="#f59e0b" strokeWidth="1.5"/>
        <text x="-81" y="78" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="600">Workforce</text>
        <text x="-81" y="90" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="500">↑ Improve</text>
      </g>
      {/* Asset Availability — gauche */}
      <g className="flower-petal" onClick={() => onPetalClick("kpi-availability")} style={{cursor:"pointer"}}>
        <circle cx="-115" cy="0" r="48" fill="rgba(132,204,22,0.18)" stroke="#84cc16" strokeWidth="1.5"/>
        <text x="-115" y="-3" textAnchor="middle" className="d-svg-text" fontSize="10" fontWeight="600">Asset</text>
        <text x="-115" y="9"  textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="500">Availability</text>
      </g>
      {/* Revenue Recovery — haut-gauche */}
      <g className="flower-petal" onClick={() => onPetalClick("kpi-revenue")} style={{cursor:"pointer"}}>
        <circle cx="-81" cy="-81" r="48" fill="rgba(16,185,129,0.18)" stroke="#10b981" strokeWidth="1.5"/>
        <text x="-81" y="-84" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="600">Revenue</text>
        <text x="-81" y="-72" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="500">Recovery</text>
      </g>
      {/* Centre (non cliquable) */}
      <circle cx="0" cy="0" r="65" fill="url(#centerGrad)" stroke="#00d9a3" strokeWidth="2"/>
      <text x="0" y="-6" textAnchor="middle" style={{fill:"var(--accent)"}} fontSize="11" fontWeight="700" letterSpacing="1" fontFamily="Space Grotesk">PREDICTIVE</text>
      <text x="0" y="9"  textAnchor="middle" style={{fill:"var(--accent)"}} fontSize="11" fontWeight="700" letterSpacing="1" fontFamily="Space Grotesk">MAINTENANCE</text>
      <text x="0" y="26" textAnchor="middle" className="d-svg-faint" fontSize="9">CORE ENGINE</text>
    </g>
  </svg>
);

// ─── FFT Spectrum Chart (static, maquette) ────────────────────────────────────
const FFTChart: React.FC = () => (
  <svg className="spectrum-chart" viewBox="0 0 600 220" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="specGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.6"/>
        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
      </linearGradient>
    </defs>
    <g className="d-svg-grid" strokeWidth="0.5">
      <line x1="40" y1="40" x2="580" y2="40"/><line x1="40" y1="80" x2="580" y2="80"/>
      <line x1="40" y1="120" x2="580" y2="120"/><line x1="40" y1="160" x2="580" y2="160"/>
    </g>
    <line x1="40" y1="200" x2="580" y2="200" className="d-svg-axis" strokeWidth="0.5"/>
    <line x1="40" y1="20"  x2="40"  y2="200" className="d-svg-axis" strokeWidth="0.5"/>
    <g className="d-svg-faint" fontSize="9" textAnchor="end">
      <text x="35" y="44">10 g</text><text x="35" y="84">1 g</text>
      <text x="35" y="124">0.1</text><text x="35" y="164">0.01</text><text x="35" y="204">0.001</text>
    </g>
    <g className="d-svg-faint" fontSize="9" textAnchor="middle">
      <text x="40"  y="215">0</text><text x="148" y="215">200</text><text x="256" y="215">400</text>
      <text x="364" y="215">600</text><text x="472" y="215">800</text><text x="580" y="215">1000 Hz</text>
    </g>
    {/* noise floor */}
    <path d="M40 175 L100 177 L160 175 L220 174 L280 175 L340 173 L400 174 L460 175 L520 174 L580 174" stroke="#9ca3af" strokeWidth="1" fill="none" opacity="0.5"/>
    {/* 1×fr */}
    <line x1="55" y1="175" x2="55" y2="55" stroke="var(--accent)" strokeWidth="2.5"/>
    <text x="55" y="48" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="8" fill="var(--accent)">1×fr</text>
    {/* 2×fr */}
    <line x1="70" y1="175" x2="70" y2="95" stroke="var(--accent)" strokeWidth="2"/>
    <text x="70" y="90" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="8" fill="var(--accent)">2×</text>
    {/* BPFI cluster */}
    <line x1="180" y1="175" x2="180" y2="70" stroke="var(--danger)" strokeWidth="2.5"/>
    <text x="180" y="62" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="var(--danger)" fontWeight="700">BPFI</text>
    <line x1="195" y1="175" x2="195" y2="100" stroke="var(--danger)" strokeWidth="1.5"/>
    <line x1="165" y1="175" x2="165" y2="105" stroke="var(--danger)" strokeWidth="1.5"/>
    <line x1="210" y1="175" x2="210" y2="110" stroke="var(--danger)" strokeWidth="1.5"/>
    <text x="195" y="93" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="7" fill="var(--danger)">+fr</text>
    <text x="165" y="98" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="7" fill="var(--danger)">-fr</text>
    {/* 2×BPFI */}
    <line x1="320" y1="175" x2="320" y2="100" stroke="var(--danger)" strokeWidth="2"/>
    <text x="320" y="92" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="8" fill="var(--danger)">2×BPFI</text>
    {/* BPF */}
    <line x1="125" y1="175" x2="125" y2="115" stroke="var(--warn)" strokeWidth="1.5"/>
    <text x="125" y="108" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="8" fill="var(--warn)">BPF</text>
    {/* HF */}
    <path d="M400 170 Q420 145 450 155 T500 150 Q530 148 560 158" stroke="#a855f7" strokeWidth="1.5" fill="none" opacity="0.7"/>
    <text x="480" y="138" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="8" fill="#a855f7">HF noise</text>
    {/* thresholds */}
    <line x1="40" y1="100" x2="580" y2="100" stroke="var(--warn)" strokeWidth="0.5" strokeDasharray="3,3"/>
    <text x="575" y="98" textAnchor="end" fontFamily="JetBrains Mono" fontSize="8" fill="var(--warn)">SEUIL ALERTE</text>
    <line x1="40" y1="60" x2="580" y2="60" stroke="var(--danger)" strokeWidth="0.5" strokeDasharray="3,3"/>
    <text x="575" y="58" textAnchor="end" fontFamily="JetBrains Mono" fontSize="8" fill="var(--danger)">SEUIL DANGER</text>
  </svg>
);

// ─── VRMS Trend Chart (static, maquette) ──────────────────────────────────────
const TrendChart: React.FC = () => (
  <svg className="svg-chart" viewBox="0 0 600 220" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--danger)" stopOpacity="0.4"/>
        <stop offset="100%" stopColor="var(--danger)" stopOpacity="0"/>
      </linearGradient>
    </defs>
    <rect x="40" y="20"  width="540" height="40"  fill="rgba(239,68,68,0.06)"/>
    <rect x="40" y="60"  width="540" height="50"  fill="rgba(245,158,11,0.06)"/>
    <rect x="40" y="110" width="540" height="50"  fill="rgba(132,204,22,0.06)"/>
    <rect x="40" y="160" width="540" height="40"  fill="rgba(16,185,129,0.06)"/>
    <g fontFamily="JetBrains Mono" fontSize="9">
      <text x="575" y="40"  textAnchor="end" fill="var(--danger)">D &gt; 7.0</text>
      <text x="575" y="85"  textAnchor="end" fill="var(--warn)">C 4.5–7.0</text>
      <text x="575" y="135" textAnchor="end" fill="#84cc16">B 1.8–4.5</text>
      <text x="575" y="180" textAnchor="end" fill="#10b981">A &lt; 1.8</text>
    </g>
    <g className="d-svg-grid" strokeWidth="0.5">
      <line x1="40" y1="60"  x2="580" y2="60"/>
      <line x1="40" y1="110" x2="580" y2="110"/>
      <line x1="40" y1="160" x2="580" y2="160"/>
    </g>
    <line x1="40" y1="200" x2="580" y2="200" className="d-svg-axis" strokeWidth="0.5"/>
    <path d="M40 175 L80 172 L120 170 L160 168 L200 165 L240 158 L280 145 L320 130 L360 110 L400 90 L440 70 L480 55 L520 45 L560 38" stroke="var(--danger)" strokeWidth="2.5" fill="none"/>
    <path d="M40 175 L80 172 L120 170 L160 168 L200 165 L240 158 L280 145 L320 130 L360 110 L400 90 L440 70 L480 55 L520 45 L560 38 L560 200 L40 200 Z" fill="url(#trendGrad)"/>
    <g fill="var(--danger)">
      {[{x:40,y:175,r:2},{x:80,y:172,r:2},{x:120,y:170,r:2},{x:160,y:168,r:2},{x:200,y:165,r:2},{x:240,y:158,r:2},{x:280,y:145,r:2},{x:320,y:130,r:2},{x:360,y:110,r:2},{x:400,y:90,r:2.5},{x:440,y:70,r:2.5},{x:560,y:38,r:4}].map((p,i)=>(
        <circle key={i} cx={p.x} cy={p.y} r={p.r}/>
      ))}
    </g>
    <line x1="280" y1="20" x2="280" y2="200" stroke="var(--warn)" strokeWidth="1" strokeDasharray="4,4"/>
    <text x="280" y="16" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="var(--warn)">DÉTECTION ML</text>
    <line x1="560" y1="20" x2="560" y2="200" className="d-svg-faint" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5"/>
    <text x="560" y="16" textAnchor="middle" className="d-svg-faint" fontSize="9">AUJOURD'HUI</text>
    <path d="M560 38 L580 28" stroke="var(--danger)" strokeWidth="2" strokeDasharray="4,3"/>
    <circle cx="580" cy="28" r="3" fill="none" stroke="var(--danger)" strokeWidth="1.5" strokeDasharray="2,2"/>
    <g className="d-svg-faint" fontFamily="JetBrains Mono" fontSize="9">
      <text x="40" y="215">J-90</text><text x="200" y="215">J-60</text>
      <text x="360" y="215">J-30</text><text x="560" y="215">J</text>
    </g>
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusClass(m: MachineRow): string {
  const z = m.zone ?? "";
  if (z === "D") return "status-danger";
  if (z === "C") return "status-warn";
  return "status-ok";
}

function vrmsColor(vrms: number | null): string {
  if (!vrms) return "var(--text-dim)";
  if (vrms >= 7) return "var(--danger)";
  if (vrms >= 4.5) return "var(--warn)";
  return "var(--accent)";
}

function drbfColor(d: number | null): string {
  if (d == null) return "var(--text-dim)";
  if (d <= 14) return "var(--danger)";
  if (d <= 45) return "var(--warn)";
  return "#10b981";
}

function alertRowClass(niveau: string): string {
  if (niveau === "danger" || niveau === "critique") return "danger";
  if (niveau === "info" || niveau === "information") return "info";
  return "";
}

function alertIcon(niveau: string): string {
  if (niveau === "danger" || niveau === "critique") return "⚠";
  if (niveau === "info" || niveau === "information") return "ⓘ";
  return "⚡";
}

function formatTime(ts: string): string {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 60) return `${diff} min`;
    if (diff < 1440) return `${Math.floor(diff / 60)} h ${diff % 60}`;
    return `${Math.floor(diff / 1440)} j`;
  } catch { return "—"; }
}

// ─── Main Component ───────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
  const [hero, setHero]         = useState<HeroKpis | null>(null);
  const [machines, setMachines]   = useState<MachineRow[]>([]);
  const [alertes, setAlertes]     = useState<AlerteRow[]>([]);
  const [kpiCats, setKpiCats]     = useState<KpiCats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [h, m, a, cats] = await Promise.all([
        fetch(`${API}/api/dashboard/hero`).then(r => r.json()),
        fetch(`${API}/api/dashboard/machines`).then(r => r.json()),
        fetch(`${API}/api/dashboard/alertes`).then(r => r.json()),
        fetch(`${API}/api/dashboard/categories`).then(r => r.json()),
      ]);
      setHero(h); setMachines(Array.isArray(m) ? m : []); setAlertes(Array.isArray(a) ? a : []);
      setKpiCats(cats);
    } catch (e: any) {
      setError(e?.message ?? "Erreur connexion API");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const disp      = hero?.disponibilite_7j ?? null;
  const eco       = hero?.economies_ytd_k  ?? null;
  const alertCnt  = hero?.machines_en_alerte ?? null;
  const critiques = hero?.machines_critiques ?? null;
  const total     = hero?.machines_total ?? null;
  const taux      = hero?.taux_detection_pct ?? null;
  const fp        = hero?.faux_positifs_pct ?? null;
  const lt        = hero?.lead_time_jours != null ? (hero.lead_time_jours / 7).toFixed(1) : null;

  // Health grid: build 50 cells from machines data
  const healthCells: string[] = Array(50).fill("");
  machines.slice(0, 50).forEach((m, i) => {
    if (m.zone === "D") healthCells[i] = "danger";
    else if (m.zone === "C") healthCells[i] = "warn";
  });
  if (machines.length < 50) {
    // add one offline at index 44 if no data
    healthCells[44] = "offline";
    if (!healthCells[11]) healthCells[11] = "danger";
    if (!healthCells[25]) healthCells[25] = "danger";
    if (!healthCells[37]) healthCells[37] = "danger";
    if (!healthCells[4])  healthCells[4]  = "warn";
    if (!healthCells[16]) healthCells[16] = "warn";
    if (!healthCells[29]) healthCells[29] = "warn";
    if (!healthCells[33]) healthCells[33] = "warn";
  }

  return (
    <AppLayout title="Tableau de bord" subtitle="Vue d'ensemble" notifCount={alertCnt != null && alertCnt > 0 ? alertCnt : undefined}>
      <div className="dashboard-main">

        {/* ─── Topbar ─────────────────────────────────────────── */}
        <div className="topbar">
          <div className="topbar-left">
            <h1>Bonjour, <em>Admin</em> — vue d'ensemble du parc</h1>
            <div className="breadcrumb">
              DASHBOARD / GLOBAL VIEW · USINE CASABLANCA-A · {total ?? "—"} MACHINES SURVEILLÉES
            </div>
          </div>
          <div className="topbar-right">
            <div className="live-pulse"><span className="live-dot" />LIVE · 1.2s</div>
            <div className="search-box">
              <Search size={13} />
              <input placeholder="Rechercher une machine…" />
            </div>
            <button className="btn" onClick={load}><RefreshCw size={13} /> Actualiser</button>
            <button className="btn primary"><Plus size={13} /> Nouveau rapport</button>
          </div>
        </div>

        {error && (
          <div className="dash-error">
            <strong>API indisponible</strong>
            Données de démonstration affichées · <code>{error}</code>
          </div>
        )}

        {/* ─── Hero Stats ─────────────────────────────────────── */}
        <div className="hero-stats">
          {/* Disponibilité */}
          <div className="hero-card">
            <div className="hero-card-head">
              <div><div className="hero-card-label">Disponibilité globale</div></div>
              <div className="hero-card-icon"><Activity size={17} /></div>
            </div>
            <div className="hero-card-value">{disp != null ? disp.toFixed(1) : "—"}<em>{disp != null ? "%" : ""}</em></div>
            <div className="hero-card-trend trend-up">▲ +2.3% vs mois dernier · Cible &gt; 95%</div>
            <div className="hero-card-bar">
              <div className="hero-card-bar-fill" style={{width:`${disp != null ? Math.min(disp, 100) : 0}%`}} />
            </div>
          </div>

          {/* Économies */}
          <div className="hero-card info">
            <div className="hero-card-head">
              <div><div className="hero-card-label">Économies cumulées YTD</div></div>
              <div className="hero-card-icon"><DollarSign size={17} /></div>
            </div>
            <div className="hero-card-value">{eco != null ? <>{Math.round(eco)}k<em>€</em></> : "—"}</div>
            <div className="hero-card-trend trend-up">▲ +18.7% · ROI prédictif : 312%</div>
            <div className="hero-card-bar">
              <div className="hero-card-bar-fill" style={{width:"78%"}} />
            </div>
          </div>

          {/* Machines en alerte */}
          <div className="hero-card warn">
            <div className="hero-card-head">
              <div><div className="hero-card-label">Machines en alerte</div></div>
              <div className="hero-card-icon"><AlertTriangle size={17} /></div>
            </div>
            <div className="hero-card-value">{alertCnt ?? "—"}<em>{total != null ? ` / ${total}` : ""}</em></div>
            <div className="hero-card-trend trend-down">{critiques ?? "—"} critiques · {alertCnt != null && critiques != null ? alertCnt - critiques : "—"} en surveillance</div>
            <div className="hero-card-bar">
              <div className="hero-card-bar-fill" style={{width:`${alertCnt != null && total != null ? Math.round(alertCnt / total * 100) : 0}%`}} />
            </div>
          </div>

          {/* Taux détection */}
          <div className="hero-card purple">
            <div className="hero-card-head">
              <div><div className="hero-card-label">Taux de détection prédictif</div></div>
              <div className="hero-card-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
            </div>
            <div className="hero-card-value">{taux != null ? taux.toFixed(1) : "—"}<em>{taux != null ? "%" : ""}</em></div>
            <div className="hero-card-trend trend-up">▲ Faux positifs : {fp != null ? fp.toFixed(1) : "—"}% · Lead time : {lt ?? "—"} sem</div>
            <div className="hero-card-bar">
              <div className="hero-card-bar-fill" style={{width:`${taux != null ? Math.min(taux, 100) : 0}%`}} />
            </div>
          </div>
        </div>

        {/* ─── Flower ─────────────────────────────────────────── */}
        <div className="flower-section">
          <div className="flower-info">
            <h3>Les 9 piliers de la <em>maintenance prédictive</em></h3>
            <p>Chaque pétale agrège un domaine de bénéfices opérationnels et stratégiques. Survolez ou cliquez pour explorer les KPIs spécifiques. Au centre : la maintenance prédictive comme moteur unifié de la performance industrielle.</p>
            <div className="flower-legend">
              {[
                { label:"Revenue Recovery",  color:"#10b981" },
                { label:"Smart Replacement", color:"#8b5cf6" },
                { label:"Planned Mtnce ↓",   color:"#3b82f6" },
                { label:"Internet of Things",color:"#06b6d4" },
                { label:"Service Loss ↓",    color:"#ec4899" },
                { label:"Risk Reduction",    color:"#ef4444" },
                { label:"Workforce ↑",       color:"#f59e0b" },
                { label:"Asset Availability",color:"#84cc16" },
              ].map(l => (
                <div className="legend-item" key={l.label}>
                  <span className="legend-dot" style={{background:l.color}} />{l.label}
                </div>
              ))}
            </div>
          </div>
          <FlowerSVG onPetalClick={scrollToSection} />
        </div>

        {/* ─── 1. Revenue Recovery ──────────────────────────── */}
        <div className="section-title" id="kpi-revenue">
          <h2>① Revenue <em>Recovery</em></h2>
          <span className="section-title-meta">RÉCUPÉRATION DE REVENUS · 4 KPIs</span>
        </div>
        <div className="kpi-section cat-revenue">
          <div className="kpi-section-head">
            <div className="kpi-section-title">
              <div className="kpi-section-icon">€</div>
              <div>
                <div className="kpi-section-name">Indicateurs financiers de la prédiction</div>
                <em>Mesure l'argent récupéré grâce aux pannes évitées</em>
              </div>
            </div>
            <span className="chart-tag">+18.7% YTD</span>
          </div>
          <div className="kpi-grid">
            <div className="kpi-cell">
              <div className="kpi-cell-label">Revenus protégés</div>
              <div className="kpi-cell-value">{eco != null ? <>{Math.round(eco)}k<em> €</em></> : "—"}</div>
              <div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}} />YTD</span><span>▲ +18.7%</span></div>
            </div>
            <div className="kpi-cell">
              <div className="kpi-cell-label">ROI prédictif</div>
              <div className="kpi-cell-value">{kpiCats?.revenue_recovery?.roi_pct ?? "—"}<em>{kpiCats?.revenue_recovery?.roi_pct != null ? "%" : ""}</em></div>
              <div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}} />cible &gt; 200%</span><span>▲</span></div>
            </div>
            <div className="kpi-cell">
              <div className="kpi-cell-label">Économies vs correctif</div>
              <div className="kpi-cell-value">—</div>
              <div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}} />moy.</span><span>▲ +12%</span></div>
            </div>
            <div className="kpi-cell">
              <div className="kpi-cell-label">Production sauvegardée</div>
              <div className="kpi-cell-value">—</div>
              <div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}} />tonnes</span><span>▲</span></div>
            </div>
          </div>
        </div>

        {/* ─── 2. Smart Replacement ─────────────────────────── */}
        <div className="section-title" id="kpi-smart">
          <h2>② Smart <em>Replacement</em></h2>
          <span className="section-title-meta">REMPLACEMENT INTELLIGENT · 4 KPIs</span>
        </div>
        <div className="kpi-section cat-smart">
          <div className="kpi-section-head">
            <div className="kpi-section-title">
              <div className="kpi-section-icon">⟲</div>
              <div>
                <div className="kpi-section-name">Optimisation du remplacement des pièces</div>
                <em>Ni trop tôt, ni trop tard — au moment optimal</em>
              </div>
            </div>
            <span className="chart-tag" style={{background:"rgba(139,92,246,.15)",color:"var(--purple)",borderColor:"var(--purple)"}}>DRBF actif</span>
          </div>
          <div className="kpi-grid">
            <div className="kpi-cell"><div className="kpi-cell-label">Précision DRBF</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &gt; 85%</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Just-in-Time Rate</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>fenêtre opt.</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Pièces remplacées tôt</div><div className="kpi-cell-value">{kpiCats?.smart_replacement?.pm_supprimees ?? "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--warn)"}}/>cette année</span><span>▼</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Coût pièces évité</div><div className="kpi-cell-value">{kpiCats?.smart_replacement?.economies_remplacement_k != null ? <>{kpiCats.smart_replacement.economies_remplacement_k}k<em> €</em></> : "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>YTD</span><span>▲</span></div></div>
          </div>
        </div>

        {/* ─── 3. Planned Maintenance Reduction ────────────── */}
        <div className="section-title" id="kpi-planned">
          <h2>③ Planned Maintenance <em>Reduction</em></h2>
          <span className="section-title-meta">RÉDUCTION DE LA MAINTENANCE PLANIFIÉE · 4 KPIs</span>
        </div>
        <div className="kpi-section cat-planned">
          <div className="kpi-section-head">
            <div className="kpi-section-title">
              <div className="kpi-section-icon">↓</div>
              <div>
                <div className="kpi-section-name">Conditionnel vs. Systématique</div>
                <em>Du temps-based vers le condition-based monitoring</em>
              </div>
            </div>
            <span className="chart-tag" style={{background:"rgba(59,130,246,.15)",color:"var(--info)",borderColor:"var(--info)"}}>CBM 73%</span>
          </div>
          <div className="kpi-grid">
            <div className="kpi-cell"><div className="kpi-cell-label">Ratio CBM / TBM</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &gt; 70%</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Heures préventives ↓</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>vs N-1</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">PM inutiles détectés</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &lt; 20%</span><span>▼</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Économie main-d'œuvre</div><div className="kpi-cell-value">96k<em> €</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>YTD</span><span>▲</span></div></div>
          </div>
        </div>

        {/* ─── 4. Internet of Things ────────────────────────── */}
        <div className="section-title" id="kpi-iot">
          <h2>④ Internet of <em>Things</em></h2>
          <span className="section-title-meta">RÉSEAU DE CAPTEURS · 8 KPIs · 312 SENSORS</span>
        </div>
        <div className="kpi-section cat-iot">
          <div className="kpi-section-head">
            <div className="kpi-section-title">
              <div className="kpi-section-icon">⚡</div>
              <div>
                <div className="kpi-section-name">Performance du réseau IoT</div>
                <em>312 capteurs · 47 passerelles · données temps réel</em>
              </div>
            </div>
            <span className="chart-tag" style={{background:"rgba(6,182,212,.15)",color:"#06b6d4",borderColor:"#06b6d4"}}>98.2% UPTIME</span>
          </div>
          <div className="kpi-grid">
            <div className="kpi-cell"><div className="kpi-cell-label">Couverture parc V</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>vitales</span><span>OK</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Disponibilité capteurs</div><div className="kpi-cell-value">{kpiCats?.iot_network ? Math.round(kpiCats.iot_network.capteurs_actifs / kpiCats.iot_network.total_capteurs * 100) : "—"}<em>%</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &gt; 98%</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Qualité données</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>valides</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Latence moyenne</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>capteur→UI</span><span>OK</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Volume traité</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>FFT inclus</span><span>—</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Capteurs HS</div><div className="kpi-cell-value">{kpiCats?.iot_network?.en_panne ?? "—"}<em> / {kpiCats?.iot_network?.total_capteurs ?? "—"}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--warn)"}}/>1.3%</span><span>maint.</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">MTBF capteurs</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>fiabilité</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Passerelles actives</div><div className="kpi-cell-value">{kpiCats?.iot_network?.passerelles_actives ?? "—"}<em> / {kpiCats?.iot_network?.passerelles_actives ?? "—"}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>tous OK</span><span>100%</span></div></div>
          </div>
        </div>

        {/* ─── 5. Service Loss Reduction ────────────────────── */}
        <div className="section-title" id="kpi-loss">
          <h2>⑤ Service Loss <em>Reduction</em></h2>
          <span className="section-title-meta">RÉDUCTION DES PERTES DE SERVICE · 6 KPIs</span>
        </div>
        <div className="kpi-section cat-loss">
          <div className="kpi-section-head">
            <div className="kpi-section-title">
              <div className="kpi-section-icon">⏵</div>
              <div>
                <div className="kpi-section-name">Continuité de production</div>
                <em>MTBF, pannes évitées, disponibilité opérationnelle</em>
              </div>
            </div>
            <span className="chart-tag" style={{background:"rgba(236,72,153,.15)",color:"#ec4899",borderColor:"#ec4899"}}>-58% ARRÊTS</span>
          </div>
          <div className="kpi-grid">
            <div className="kpi-cell"><div className="kpi-cell-label">MTBF</div><div className="kpi-cell-value">{kpiCats?.asset_availability?.mtbf_moy ?? "—"}<em>{kpiCats?.asset_availability?.mtbf_moy != null ? " h" : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>moy. parc</span><span>▲ +12%</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">MTTR</div><div className="kpi-cell-value">{kpiCats?.asset_availability?.mttr_moy ?? "—"}<em>{kpiCats?.asset_availability?.mttr_moy != null ? " h" : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>moy.</span><span>▼ -8%</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Arrêts non planifiés</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>vs N-1</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Pannes évitées</div><div className="kpi-cell-value">{kpiCats?.revenue_recovery?.pannes_evitees ?? "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>YTD</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Heures arrêt évitées</div><div className="kpi-cell-value">{kpiCats?.service_loss?.total_arret_h != null ? <>{kpiCats.service_loss.total_arret_h}<em> h</em></> : "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cumul</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Pannes catastrophiques</div><div className="kpi-cell-value">{kpiCats?.service_loss?.nb_pannes_historique != null ? 0 : "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible : 0</span><span>OK</span></div></div>
          </div>
        </div>

        {/* ─── 6. Risk Reduction ────────────────────────────── */}
        <div className="section-title" id="kpi-risk">
          <h2>⑥ Risk <em>Reduction</em></h2>
          <span className="section-title-meta">RÉDUCTION DES RISQUES · 6 KPIs</span>
        </div>
        <div className="kpi-section cat-risk">
          <div className="kpi-section-head">
            <div className="kpi-section-title">
              <div className="kpi-section-icon">⚠</div>
              <div>
                <div className="kpi-section-name">Sécurité et conformité</div>
                <em>Personnes, biens, environnement, réglementation</em>
              </div>
            </div>
            <span className="chart-tag" style={{background:"rgba(239,68,68,.15)",color:"var(--danger)",borderColor:"var(--danger)"}}>3 EN ZONE D</span>
          </div>
          <div className="kpi-grid">
            <div className="kpi-cell"><div className="kpi-cell-label">TRIR maintenance</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &lt; 1.0</span><span>▼</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Machines zone D ISO</div><div className="kpi-cell-value">{critiques ?? "—"}<em>{total != null ? ` / ${total}` : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--danger)"}}/>critique</span><span>action</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Quasi-accidents évités</div><div className="kpi-cell-value">{kpiCats?.risk_reduction?.incidents_ytd ?? "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>YTD</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Tps réaction critique</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>moy.</span><span>OK</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Conformité régl.</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>insp. à jour</span><span>OK</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Score risque parc</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>faible</span><span>▼</span></div></div>
          </div>
        </div>

        {/* ─── 7. Workforce Improvement ─────────────────────── */}
        <div className="section-title" id="kpi-workforce">
          <h2>⑦ Workforce <em>Improvement</em></h2>
          <span className="section-title-meta">AMÉLIORATION DES ÉQUIPES · 8 KPIs</span>
        </div>
        <div className="kpi-section cat-workforce">
          <div className="kpi-section-head">
            <div className="kpi-section-title">
              <div className="kpi-section-icon">⚙</div>
              <div>
                <div className="kpi-section-name">Productivité et compétences</div>
                <em>Wrench time, fix rate, certifications, planification</em>
              </div>
            </div>
            <span className="chart-tag" style={{background:"rgba(245,158,11,.15)",color:"var(--warn)",borderColor:"var(--warn)"}}>FTF 91%</span>
          </div>
          <div className="kpi-grid">
            <div className="kpi-cell"><div className="kpi-cell-label">Wrench Time</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &gt; 50%</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">First-Time Fix Rate</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &gt; 90%</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Interventions planifiées</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>vs urgences</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Productivité tech.</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>interv./tech.</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Tps diagnostic moy.</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>vs 45 avant</span><span>▼</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Certifiés ISO 18436</div><div className="kpi-cell-value">{kpiCats?.workforce?.nb_certifications ?? "—"}<em> / {kpiCats?.workforce?.nb_techniciens ?? "—"}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--warn)"}}/>67%</span><span>↑ 2 plan.</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Réduction urgences</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>vs N-1</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Backlog</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible 2-4</span><span>OK</span></div></div>
          </div>
        </div>

        {/* ─── 8. Asset Availability ────────────────────────── */}
        <div className="section-title" id="kpi-availability">
          <h2>⑧ Asset <em>Availability</em></h2>
          <span className="section-title-meta">DISPONIBILITÉ DES ACTIFS · 8 KPIs</span>
        </div>
        <div className="kpi-section cat-availability">
          <div className="kpi-section-head">
            <div className="kpi-section-title">
              <div className="kpi-section-icon">⏱</div>
              <div>
                <div className="kpi-section-name">Le KPI roi : disponibilité opérationnelle</div>
                <em>Combien de temps les actifs produisent réellement</em>
              </div>
            </div>
            <span className="chart-tag" style={{background:"rgba(132,204,22,.15)",color:"#84cc16",borderColor:"#84cc16"}}>OEE 87.4%</span>
          </div>
          <div className="kpi-grid">
            <div className="kpi-cell"><div className="kpi-cell-label">Disponibilité globale</div><div className="kpi-cell-value">{disp != null ? disp.toFixed(1) : "—"}<em>{disp != null ? "%" : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &gt; 95%</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">TRS / OEE</div><div className="kpi-cell-value">{kpiCats?.asset_availability?.oee_moy ?? "—"}<em>{kpiCats?.asset_availability?.oee_moy != null ? "%" : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>world-class</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Performance</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>vitesse réelle</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Qualité</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>conforme</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Asset Health Index</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>parc moy.</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Utilisation actifs</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>tps prod./dispo</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">PM Compliance</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &gt; 95%</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">%RAV</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>world-class</span><span>OK</span></div></div>
          </div>
        </div>

        {/* ─── 9. Predictive Maintenance Core ───────────────── */}
        <div className="section-title" id="kpi-predictive">
          <h2>⑨ Predictive Maintenance <em>Core</em></h2>
          <span className="section-title-meta">CŒUR PRÉDICTIF · 8 KPIs VIBRATOIRES</span>
        </div>
        <div className="kpi-section cat-predictive">
          <div className="kpi-section-head">
            <div className="kpi-section-title">
              <div className="kpi-section-icon">∿</div>
              <div>
                <div className="kpi-section-name">Performance du programme vibratoire</div>
                <em>Détection, diagnostic, pronostic — la mécanique du système</em>
              </div>
            </div>
            <span className="chart-tag" style={{background:"rgba(249,115,22,.15)",color:"var(--accent)",borderColor:"var(--accent)"}}>DÉTECTION {taux != null ? taux.toFixed(0) : "—"}%</span>
          </div>
          <div className="kpi-grid">
            <div className="kpi-cell"><div className="kpi-cell-label">Taux détection</div><div className="kpi-cell-value">{taux != null ? taux.toFixed(1) : "—"}<em>{taux != null ? "%" : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &gt; 80%</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Faux positifs</div><div className="kpi-cell-value">{fp != null ? fp.toFixed(1) : "—"}<em>{fp != null ? "%" : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &lt; 15%</span><span>▼</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Précision diagnostic</div><div className="kpi-cell-value">{kpiCats?.predictive_power?.confiance_moy_pct ?? "—"}<em>{kpiCats?.predictive_power?.confiance_moy_pct != null ? "%" : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>diag. corrects</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Lead Time moyen</div><div className="kpi-cell-value">{lt ?? "—"}<em>{lt != null ? " sem." : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>préavis</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">DRBF moyen actif</div><div className="kpi-cell-value">{kpiCats?.risk_reduction?.drbf_min_parc != null ? <>{kpiCats.risk_reduction.drbf_min_parc}<em> j</em></> : "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--warn)"}}/>7 alertes</span><span>—</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Couverture vibratoire</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>critiques</span><span>OK</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">V<sub>RMS</sub> moyen parc</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>zone B ISO</span><span>OK</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Alarmes actives</div><div className="kpi-cell-value">{kpiCats?.predictive_power?.defauts_actifs ?? "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--warn)"}}/>3 zone D</span><span>action</span></div></div>
          </div>
        </div>

        {/* ─── Vue Opérationnelle ──────────────────────────── */}
        <div className="section-title">
          <h2>Vue <em>opérationnelle</em></h2>
          <span className="section-title-meta">DÉTAIL TEMPS RÉEL · MACHINES SOUS SURVEILLANCE</span>
        </div>
        <div className="dual-grid">
          {/* Machines */}
          <div className="chart-card">
            <div className="chart-head">
              <div>
                <div className="chart-title">Top machines à risque</div>
                <div className="chart-subtitle">TRIÉ PAR DRBF CROISSANT · CLIQUER POUR DÉTAIL</div>
              </div>
              <span className="chart-tag" style={{background:"var(--danger-glow)",color:"var(--danger)",borderColor:"var(--danger)"}}>
                {critiques ?? "—"} CRITIQUES
              </span>
            </div>
            <div className="machine-list">
              {loading && [1,2,3,4].map(i => (
                <div key={i} className="dash-skeleton" style={{height:56,borderRadius:8}} />
              ))}
              {!loading && machines.length === 0 && (
                <>
                  {[
                    {name:"Pompe centrifuge P-204", id:"CLASSE V · ATELIER B · BPFI détecté", vrms:9.8, drbf:4, zone:"D"},
                    {name:"Compresseur C-118", id:"CLASSE V · UTILITÉS · Désalignement 2×fr", vrms:11.4, drbf:8, zone:"D"},
                    {name:"Réducteur R-077", id:"CLASSE I · LIGNE 3 · Bandes lat. GMF", vrms:7.2, drbf:18, zone:"C"},
                    {name:"Ventilateur V-302", id:"CLASSE I · EXTRACTION · Balourd 1×fr", vrms:5.8, drbf:32, zone:"C"},
                    {name:"Moteur M-019", id:"CLASSE I · LIGNE 1 · Pic 100Hz élec.", vrms:4.9, drbf:45, zone:"C"},
                    {name:"Pompe P-156", id:"CLASSE I · CIRCUIT EAU · Cavitation HF", vrms:3.4, drbf:60, zone:"B"},
                  ].map(m => (
                    <div className="machine-row" key={m.name}>
                      <div className={`machine-status ${m.zone==="D"?"status-danger":m.zone==="C"?"status-warn":"status-ok"}`} />
                      <div>
                        <div className="machine-info-name">{m.name}</div>
                        <div className="machine-info-id">{m.id}</div>
                      </div>
                      <div className="machine-vrms" style={{color:m.vrms>=7?"var(--danger)":m.vrms>=4.5?"var(--warn)":"var(--accent)"}}>
                        {m.vrms}<small>mm/s</small>
                      </div>
                      <div className="machine-drbf" style={{color:m.drbf<=14?"var(--danger)":m.drbf<=45?"var(--warn)":"#84cc16"}}>
                        DRBF {m.drbf} j
                      </div>
                      <span className={`zone-badge zone-${m.zone}`}>{m.zone}</span>
                    </div>
                  ))}
                </>
              )}
              {!loading && machines.slice(0, 6).map(m => (
                <div className="machine-row" key={m.id_machine}>
                  <div className={`machine-status ${statusClass(m)}`} />
                  <div>
                    <div className="machine-info-name">{m.nom_machine}</div>
                    <div className="machine-info-id">{m.type_machine} · {m.nom_atelier} · {m.type_defaut || "—"}</div>
                  </div>
                  <div className="machine-vrms" style={{color:vrmsColor(m.vrms)}}>
                    {m.vrms?.toFixed(1) ?? "—"}<small>mm/s</small>
                  </div>
                  <div className="machine-drbf" style={{color:drbfColor(m.drbf_jours)}}>
                    DRBF {m.drbf_jours ?? "—"} j
                  </div>
                  <span className={`zone-badge zone-${m.zone ?? ""}`}>{m.zone ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alertes */}
          <div className="chart-card">
            <div className="chart-head">
              <div>
                <div className="chart-title">Alertes temps réel</div>
                <div className="chart-subtitle">DERNIÈRES 24H · TRIÉ CHRONO</div>
              </div>
              <button className="btn">Tout voir →</button>
            </div>
            <div className="alert-list">
              {loading && [1,2,3].map(i=><div key={i} className="dash-skeleton" style={{height:48,borderRadius:6}} />)}
              {!loading && alertes.length === 0 && (
                <>
                  {[
                    {niveau:"danger",icon:"⚠",titre:"P-204 → Vrms dépassement zone D",meta:"9.8 mm/s · seuil 7.0 · BPFI détecté · ENVELOPPE",time:"12 min"},
                    {niveau:"danger",icon:"⚠",titre:"C-118 → Désalignement aggravé",meta:"2×fr passe de 4.2 à 6.8 mm/s · axial",time:"1 h 24"},
                    {niveau:"",icon:"⚡",titre:"R-077 → Cepstre : nouvelle bande lat.",meta:"Espacement = fr arbre intermédiaire · usure dent",time:"3 h 47"},
                    {niveau:"info",icon:"ⓘ",titre:"Capteur A-042 → batterie faible",meta:"12% · planifier remplacement sous 7j",time:"5 h 12"},
                    {niveau:"",icon:"⚡",titre:"V-302 → Crest Factor : 6.8 → 8.4",meta:"Probable début défaut roulement BPFO",time:"7 h 03"},
                    {niveau:"info",icon:"✓",titre:"Bon de travail #4187 fermé",meta:"M-019 — alignement laser complété · Vrms 4.9→1.8",time:"12 h 22"},
                    {niveau:"info",icon:"↻",titre:"Modèle ML recalibré",meta:"v4.2.1 · précision ▲ 87.2% · 23 défauts entrainés",time:"21 h 04"},
                  ].map((a,i) => (
                    <div className={`alert-row ${a.niveau}`} key={i}>
                      <div className="alert-icon">{a.icon}</div>
                      <div className="alert-body">
                        <div className="alert-title">{a.titre}</div>
                        <div className="alert-meta">{a.meta}</div>
                      </div>
                      <div className="alert-time">{a.time}</div>
                    </div>
                  ))}
                </>
              )}
              {!loading && alertes.map(a => (
                <div className={`alert-row ${alertRowClass(a.niveau)}`} key={a.id_alerte}>
                  <div className="alert-icon">{alertIcon(a.niveau)}</div>
                  <div className="alert-body">
                    <div className="alert-title">{a.titre}</div>
                    <div className="alert-meta">{a.code_machine} · {a.type_alerte}</div>
                  </div>
                  <div className="alert-time">{formatTime(a.timestamp_alerte)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Charts Row ──────────────────────────────────── */}
        <div className="dual-grid">
          {/* FFT Spectrum */}
          <div className="chart-card">
            <div className="chart-head">
              <div>
                <div className="chart-title">Spectre FFT — P-204 / Pompe centrifuge</div>
                <div className="chart-subtitle">ACCÉLÉRATION · BANDE 0–1000 Hz · ÉCHELLE LOG</div>
              </div>
              <div className="pill-row">
                <span className="pill active">FFT</span>
                <span className="pill">Enveloppe</span>
                <span className="pill">Cepstre</span>
              </div>
            </div>
            <FFTChart />
            <div style={{display:"flex",justifyContent:"space-between",marginTop:12,fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--text-faint)"}}>
              <span>fr = 25 Hz · BPFI calc. = 178 Hz · DIAGNOSTIC : <strong style={{color:"var(--danger)"}}>DÉFAUT BAGUE INTERNE</strong></span>
              <span>STADE 3 · DRBF 4 jours</span>
            </div>
          </div>

          {/* VRMS Trend */}
          <div className="chart-card">
            <div className="chart-head">
              <div>
                <div className="chart-title">Évolution V<sub>RMS</sub> · 90 derniers jours</div>
                <div className="chart-subtitle">P-204 · ZONE A→D · DÉTECTION 04 AVR.</div>
              </div>
              <span className="chart-tag" style={{background:"var(--danger-glow)",color:"var(--danger)",borderColor:"var(--danger)"}}>DRBF 4j</span>
            </div>
            <TrendChart />
            <div style={{display:"flex",justifyContent:"space-between",marginTop:12,fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--text-faint)"}}>
              <span>Pente actuelle : +1.8 mm/s/sem</span>
              <span>EXTRAPOLATION → seuil destruction dans <strong style={{color:"var(--danger)"}}>~4 jours</strong></span>
            </div>
          </div>
        </div>

        {/* ─── Asset Health + Heatmap ───────────────────────── */}
        <div className="dual-grid">
          {/* Health Grid */}
          <div className="chart-card">
            <div className="chart-head">
              <div>
                <div className="chart-title">Santé du parc — vue globale</div>
                <div className="chart-subtitle">{total ?? "—"} MACHINES · CHAQUE CARRÉ = 1 ÉQUIPEMENT</div>
              </div>
              <div className="pill-row">
                <span className="pill active">Toutes</span>
                <span className="pill">V</span>
                <span className="pill">I</span>
                <span className="pill">S</span>
              </div>
            </div>
            <div className="health-grid">
              {healthCells.map((cls,i) => <div key={i} className={`health-cell ${cls}`} />)}
            </div>
            <div style={{display:"flex",gap:14,marginTop:14,fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--text-faint)",alignItems:"center"}}>
              <span><span className="kpi-cell-status" style={{background:"var(--accent)"}} />OK · {total != null && alertCnt != null ? total - alertCnt - 1 : "—"}</span>
              <span><span className="kpi-cell-status" style={{background:"var(--warn)"}} />Surveillance · {alertCnt != null && critiques != null ? alertCnt - critiques : "—"}</span>
              <span><span className="kpi-cell-status" style={{background:"var(--danger)"}} />Critique · {critiques ?? "—"}</span>
              <span><span className="kpi-cell-status" style={{background:"var(--border)"}} />Hors ligne · 1</span>
            </div>
          </div>

          {/* Heatmap */}
          <div className="chart-card">
            <div className="chart-head">
              <div>
                <div className="chart-title">Heatmap des arrêts · 12 derniers mois</div>
                <div className="chart-subtitle">PAR ATELIER × MOIS · NB D'ARRÊTS NON PLANIFIÉS</div>
              </div>
              <span className="chart-tag" style={{background:"rgba(132,204,22,.15)",color:"#84cc16",borderColor:"#84cc16"}}>-58% TENDANCE</span>
            </div>
            <div className="heatmap" style={{marginTop:8}}>
              <div className="heatmap-label"></div>
              {["M","J","J","A","S","O","N","D","J","F","M","A"].map((m,i)=>(
                <div key={i} className="heatmap-label" style={{textAlign:"center",justifyContent:"center"}}>{m}</div>
              ))}
              {[
                {label:"Atelier A", cells:["h-3","h-4","h-3","h-2","h-3","h-2","h-2","h-1","h-1","h-1","h-0","h-0"]},
                {label:"Atelier B", cells:["h-2","h-3","h-3","h-3","h-2","h-3","h-1","h-1","h-2","h-1","h-1","h-2"]},
                {label:"Atelier C", cells:["h-4","h-4","h-3","h-2","h-2","h-2","h-1","h-1","h-0","h-1","h-0","h-0"]},
                {label:"Utilités", cells:["h-2","h-2","h-3","h-2","h-2","h-3","h-2","h-2","h-1","h-1","h-2","h-1"]},
                {label:"Logistique", cells:["h-1","h-2","h-2","h-1","h-1","h-1","h-0","h-1","h-0","h-0","h-0","h-0"]},
                {label:"Conditionnement", cells:["h-3","h-2","h-2","h-2","h-1","h-1","h-1","h-0","h-1","h-0","h-0","h-1"]},
              ].map(row => (
                <React.Fragment key={row.label}>
                  <div className="heatmap-label">{row.label}</div>
                  {row.cells.map((c,i)=><div key={i} className={`heatmap-cell ${c}`} />)}
                </React.Fragment>
              ))}
            </div>
            <div style={{display:"flex",gap:6,marginTop:14,alignItems:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--text-faint)"}}>
              <span>Moins ←</span>
              {["h-0","h-1","h-2","h-3","h-4"].map(c=>(
                <div key={c} className={`heatmap-cell ${c}`} style={{height:14,width:14}} />
              ))}
              <span>→ Plus d'arrêts</span>
            </div>
          </div>
        </div>

        {/* ─── Footer ─────────────────────────────────────── */}
        <div className="dashboard-footer">
          <span>PREDICTIVEOPS™ V4.2.1 · DASHBOARD MAINTENANCE PRÉDICTIVE · DERNIÈRE MAJ 1.2 SEC</span>
          <span>312 CAPTEURS · 47 PASSERELLES · {total ?? "—"} MACHINES · ISO 10816 / 18436 COMPLIANT</span>
        </div>

      </div>
    </AppLayout>
  );
};

export default DashboardPage;
