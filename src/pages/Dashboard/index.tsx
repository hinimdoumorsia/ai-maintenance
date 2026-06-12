import React, { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { useAuth } from "../../contexts/AuthContext";
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
      <g className="flower-petal" onClick={() => onPetalClick("kpi-smart")} style={{cursor:"pointer"}}>
        <circle cx="0" cy="-115" r="48" fill="rgba(139,92,246,0.18)" stroke="#a855f7" strokeWidth="1.5"/>
        <text x="0" y="-118" textAnchor="middle" className="d-svg-text" fontSize="10" fontWeight="600">Smart</text>
        <text x="0" y="-105" textAnchor="middle" className="d-svg-text" fontSize="10" fontWeight="600">Replacement</text>
      </g>
      <g className="flower-petal" onClick={() => onPetalClick("kpi-planned")} style={{cursor:"pointer"}}>
        <circle cx="81" cy="-81" r="48" fill="rgba(61,142,255,0.18)" stroke="#3d8eff" strokeWidth="1.5"/>
        <text x="81" y="-84" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="600">Planned</text>
        <text x="81" y="-72" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="600">Mtnce ↓</text>
      </g>
      <g className="flower-petal" onClick={() => onPetalClick("kpi-iot")} style={{cursor:"pointer"}}>
        <circle cx="115" cy="0" r="48" fill="rgba(6,182,212,0.18)" stroke="#06b6d4" strokeWidth="1.5"/>
        <text x="115" y="-3" textAnchor="middle" className="d-svg-text" fontSize="10" fontWeight="600">IoT</text>
        <text x="115" y="9"  textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="500">Network</text>
      </g>
      <g className="flower-petal" onClick={() => onPetalClick("kpi-loss")} style={{cursor:"pointer"}}>
        <circle cx="81" cy="81" r="48" fill="rgba(236,72,153,0.18)" stroke="#ec4899" strokeWidth="1.5"/>
        <text x="81" y="78" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="600">Service</text>
        <text x="81" y="90" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="600">Loss ↓</text>
      </g>
      <g className="flower-petal" onClick={() => onPetalClick("kpi-risk")} style={{cursor:"pointer"}}>
        <circle cx="0" cy="115" r="48" fill="rgba(239,68,68,0.18)" stroke="#ef4444" strokeWidth="1.5"/>
        <text x="0" y="112" textAnchor="middle" className="d-svg-text" fontSize="10" fontWeight="600">Risk</text>
        <text x="0" y="124" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="500">Reduction</text>
      </g>
      <g className="flower-petal" onClick={() => onPetalClick("kpi-workforce")} style={{cursor:"pointer"}}>
        <circle cx="-81" cy="81" r="48" fill="rgba(245,158,11,0.18)" stroke="#f59e0b" strokeWidth="1.5"/>
        <text x="-81" y="78" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="600">Workforce</text>
        <text x="-81" y="90" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="500">↑ Improve</text>
      </g>
      <g className="flower-petal" onClick={() => onPetalClick("kpi-availability")} style={{cursor:"pointer"}}>
        <circle cx="-115" cy="0" r="48" fill="rgba(132,204,22,0.18)" stroke="#84cc16" strokeWidth="1.5"/>
        <text x="-115" y="-3" textAnchor="middle" className="d-svg-text" fontSize="10" fontWeight="600">Asset</text>
        <text x="-115" y="9"  textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="500">Availability</text>
      </g>
      <g className="flower-petal" onClick={() => onPetalClick("kpi-revenue")} style={{cursor:"pointer"}}>
        <circle cx="-81" cy="-81" r="48" fill="rgba(16,185,129,0.18)" stroke="#10b981" strokeWidth="1.5"/>
        <text x="-81" y="-84" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="600">Revenue</text>
        <text x="-81" y="-72" textAnchor="middle" className="d-svg-text" fontSize="9" fontWeight="500">Recovery</text>
      </g>
      <circle cx="0" cy="0" r="65" fill="url(#centerGrad)" stroke="#00d9a3" strokeWidth="2"/>
      <text x="0" y="-6" textAnchor="middle" style={{fill:"var(--accent)"}} fontSize="11" fontWeight="700" letterSpacing="1" fontFamily="Space Grotesk">PREDICTIVE</text>
      <text x="0" y="9"  textAnchor="middle" style={{fill:"var(--accent)"}} fontSize="11" fontWeight="700" letterSpacing="1" fontFamily="Space Grotesk">MAINTENANCE</text>
      <text x="0" y="26" textAnchor="middle" className="d-svg-faint" fontSize="9">CORE ENGINE</text>
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
  if (niveau === "danger" || niveau === "critique") return "!";
  if (niveau === "info" || niveau === "information") return "ⓘ";
  return "*";
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
function formatLastUpdate(ts: string | null | undefined, hasData: boolean): string {
  if (!hasData || !ts) return 'Aucune donnée intégrée';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return 'Aucune donnée intégrée';
    return `Dernière MAJ : ${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch { return 'Aucune donnée intégrée'; }
}

// ─── Main Component ───────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [hero, setHero]           = useState<HeroKpis | null>(null);
  const [machines, setMachines]   = useState<MachineRow[]>([]);
  const [alertes, setAlertes]     = useState<AlerteRow[]>([]);
  const [kpiCats, setKpiCats]     = useState<KpiCats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<{ derniere_maj: string | null; has_data: boolean } | null>(null);
  const [nomEntreprise, setNomEntreprise] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => setExpandedSections(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const userId = user?.id;
      if (!userId) { setLoading(false); return; }
      const [h, m, a, cats, lu, ent] = await Promise.all([
        fetch(`${API}/api/dashboard/hero?user_id=${userId}`).then(r => r.json()),
        fetch(`${API}/api/dashboard/machines?user_id=${userId}`).then(r => r.json()),
        fetch(`${API}/api/dashboard/alertes?user_id=${userId}`).then(r => r.json()),
        fetch(`${API}/api/dashboard/categories?user_id=${userId}`).then(r => r.json()),
        fetch(`${API}/api/dashboard/last-update`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/admin/entreprise?user_id=${userId}`).then(r => r.json()).catch(() => null),
      ]);
      setHero(h);
      setMachines(Array.isArray(m) ? m : []);
      setAlertes(Array.isArray(a) ? a : []);
      setKpiCats(cats);
      setLastUpdate(lu);
      setNomEntreprise(ent?.nom_entreprise ?? null);
    } catch {
      setHero(null); setMachines([]); setAlertes([]); setKpiCats(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.id]);

  const disp      = hero?.disponibilite_7j ?? null;
  const eco       = hero?.economies_ytd_k  ?? null;
  const alertCnt  = hero?.machines_en_alerte ?? null;
  const critiques = hero?.machines_critiques ?? null;
  const total     = hero?.machines_total ?? null;
  const taux      = hero?.taux_detection_pct ?? null;
  const fp        = hero?.faux_positifs_pct ?? null;
  const lt        = hero?.lead_time_jours != null ? (hero.lead_time_jours / 7).toFixed(1) : null;
  const dispTrend = hero?.disponibilite_7j_prev != null && disp != null
    ? `${disp >= hero.disponibilite_7j_prev ? '▲' : '▼'} ${Math.abs(disp - hero.disponibilite_7j_prev).toFixed(1)}% vs mois dernier · Cible > 95%`
    : 'Cible > 95%';
  const roi      = kpiCats?.revenue_recovery?.roi_pct ?? null;
  const iotTotal = kpiCats?.iot_network?.total_capteurs ?? null;
  const iotGates = kpiCats?.iot_network?.passerelles_actives ?? null;
  const iotUptime = kpiCats?.iot_network
    ? Math.round(kpiCats.iot_network.capteurs_actifs / kpiCats.iot_network.total_capteurs * 100)
    : null;

  const healthCells: string[] = Array(50).fill("");
  machines.slice(0, 50).forEach((m, i) => {
    if (m.zone === "D") healthCells[i] = "danger";
    else if (m.zone === "C") healthCells[i] = "warn";
  });

  const zoneDCount  = machines.filter(m => m.zone === "D").length;
  const zoneCCount  = machines.filter(m => m.zone === "C").length;
  const zoneOKCount = total != null ? total - zoneDCount - zoneCCount : null;
  const drbfCritCount = machines.filter(m => m.drbf_jours != null && m.drbf_jours <= 14).length;

  return (
    <AppLayout title="Tableau de bord" subtitle="Vue d'ensemble" notifCount={alertCnt != null && alertCnt > 0 ? alertCnt : undefined}>
      <div className="dashboard-main">

        {/* ─── Topbar ──────────────────────────────────────────── */}
        <div className="topbar">
          <div className="topbar-left">
            <h1>Bonjour, <em>{user?.prenom ?? "—"}</em> — vue d'ensemble du parc</h1>
            <div className="breadcrumb">
              DASHBOARD / GLOBAL VIEW · {nomEntreprise ?? "—"} · {total ?? "—"} MACHINES SURVEILLÉES
            </div>
          </div>
          <div className="topbar-right">
            <div className="live-pulse" style={{ fontSize: '11px', letterSpacing: '0.03em' }}>
              {formatLastUpdate(lastUpdate?.derniere_maj, lastUpdate?.has_data ?? false)}
            </div>
            <div className="search-box">
              <Search size={13} />
              <input placeholder="Rechercher une machine…" />
            </div>
            <button className="btn" onClick={load}><RefreshCw size={13} /> Actualiser</button>
            <button className="btn primary"><Plus size={13} /> Nouveau rapport</button>
          </div>
        </div>

        {/* ─── Bande d'urgence ─────────────────────────────────── */}
        {!loading && (zoneDCount > 0 || drbfCritCount > 0) && (
          <div className="urgency-banner">
            <span className="urgency-dot" />
            {zoneDCount > 0 && (
              <strong>{zoneDCount} machine{zoneDCount > 1 ? 's' : ''} en ZONE D — vibration critique ISO 10816</strong>
            )}
            {drbfCritCount > 0 && (
              <span className="urgency-machines">
                {zoneDCount > 0 ? ' · ' : ''}{drbfCritCount} machine{drbfCritCount > 1 ? 's' : ''} avec DRBF ≤ 14 j
              </span>
            )}
            <span className="urgency-action"
              onClick={() => document.getElementById('vue-operationnelle')?.scrollIntoView({behavior:'smooth'})}>
              → Voir machines critiques
            </span>
          </div>
        )}

        {error && (
          <div className="dash-error">
            <strong>API indisponible</strong>
            Données de démonstration affichées · <code>{error}</code>
          </div>
        )}

        {/* ─── Hero Stats ──────────────────────────────────────── */}
        <div className="hero-stats">
          <div className="hero-card">
            <div className="hero-card-head">
              <div><div className="hero-card-label">Disponibilité globale</div></div>
              <div className="hero-card-icon"><Activity size={17} /></div>
            </div>
            <div className="hero-card-value">{disp != null ? disp.toFixed(1) : "—"}<em>{disp != null ? "%" : ""}</em></div>
            <div className="hero-card-trend trend-up">{dispTrend}</div>
            <div className="hero-card-bar">
              <div className="hero-card-bar-fill" style={{width:`${disp != null ? Math.min(disp, 100) : 0}%`}} />
            </div>
          </div>

          <div className="hero-card info">
            <div className="hero-card-head">
              <div><div className="hero-card-label">Économies cumulées YTD</div></div>
              <div className="hero-card-icon"><DollarSign size={17} /></div>
            </div>
            <div className="hero-card-value">{eco != null ? <>{Math.round(eco)}k<em>€</em></> : "—"}</div>
            <div className="hero-card-trend trend-up">ROI prédictif : {roi != null ? `${roi}%` : '—'}</div>
            <div className="hero-card-bar">
              <div className="hero-card-bar-fill" style={{width:`${eco != null ? Math.min(Math.round(eco / 500 * 100), 100) : 0}%`}} />
            </div>
          </div>

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

        {/* ─── Centre : Machines + Alertes (gauche) · Fleur + Santé (droite) ── */}
        <div className="dash-center-grid" id="vue-operationnelle">

          {/* GAUCHE — Machines à risque + Alertes */}
          <div className="dash-center-left">
            <div className="chart-card">
              <div className="chart-head">
                <div>
                  <div className="chart-title">Machines à risque</div>
                  <div className="chart-subtitle">TRIÉ PAR GRAVITÉ · DRBF CROISSANT</div>
                </div>
                <span className="chart-tag" style={{background:"var(--danger-glow)",color:"var(--danger)",borderColor:"var(--danger)"}}>
                  {zoneDCount} ZONE D
                </span>
              </div>
              <div className="machine-list">
                {loading && [1,2,3,4,5].map(i => (
                  <div key={i} className="dash-skeleton" style={{height:56,borderRadius:8}} />
                ))}
                {!loading && machines.length === 0 && (
                  <div className="alert-empty"><span>Aucune machine à risque détectée</span></div>
                )}
                {!loading && machines.slice(0, 10).map(m => (
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

            <div className="chart-card">
              <div className="chart-head">
                <div>
                  <div className="chart-title">Alertes temps réel</div>
                  <div className="chart-subtitle">DERNIÈRES 24H · TRIÉ CHRONO</div>
                </div>
                <button className="btn">Tout voir →</button>
              </div>
              <div className="alert-list">
                {loading && [1,2,3].map(i => <div key={i} className="dash-skeleton" style={{height:48,borderRadius:6}} />)}
                {!loading && alertes.length === 0 && (
                  <div className="alert-empty"><span>Aucune alerte dans les dernières 24h</span></div>
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

          {/* DROITE — Fleur + Santé du parc */}
          <div className="dash-center-right">
            <div className="chart-card dash-flower-card">
              <div className="chart-head">
                <div>
                  <div className="chart-title">9 piliers · <em style={{fontFamily:"'Instrument Serif',serif",fontStyle:"italic",fontWeight:400}}>Maintenance Prédictive</em></div>
                  <div className="chart-subtitle">CLIQUER UN PÉTALE → KPI DÉTAILLÉ</div>
                </div>
              </div>
              <FlowerSVG onPetalClick={scrollToSection} />
              <div className="flower-legend-compact">
                {[
                  {label:"Revenue Recovery", color:"#10b981"},
                  {label:"Smart Replacement", color:"#8b5cf6"},
                  {label:"Planned Mtnce ↓", color:"#3d8eff"},
                  {label:"IoT Network", color:"#06b6d4"},
                  {label:"Service Loss ↓", color:"#ec4899"},
                  {label:"Risk Reduction", color:"#ef4444"},
                  {label:"Workforce ↑", color:"#f59e0b"},
                  {label:"Asset Availability", color:"#84cc16"},
                ].map(l => (
                  <div className="legend-item" key={l.label}>
                    <span className="legend-dot" style={{background:l.color}} />{l.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-head">
                <div>
                  <div className="chart-title">Santé du parc</div>
                  <div className="chart-subtitle">{total ?? "—"} MACHINES · CHAQUE CARRÉ = 1 ÉQUIPEMENT</div>
                </div>
              </div>
              <div className="health-grid">
                {healthCells.map((cls, i) => <div key={i} className={`health-cell ${cls}`} />)}
              </div>
              <div style={{display:"flex",gap:14,marginTop:14,fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--text-faint)",alignItems:"center"}}>
                <span><span className="kpi-cell-status" style={{background:"var(--accent)"}} />OK · {zoneOKCount ?? "—"}</span>
                <span><span className="kpi-cell-status" style={{background:"var(--warn)"}} />Surveillance · {zoneCCount}</span>
                <span><span className="kpi-cell-status" style={{background:"var(--danger)"}} />Critique · {zoneDCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            9 PILIERS KPI — chaque section : 2 cellules primaires
            + accordéon pour les cellules supplémentaires
            ═══════════════════════════════════════════════════════ */}
        <div className="section-title" style={{marginTop:32}}>
          <h2>Les 9 piliers · <em>vue détaillée</em></h2>
          <span className="section-title-meta">CLIQUER ↓ POUR DÉVELOPPER CHAQUE SECTION</span>
        </div>

        {/* ─── ① Revenue Recovery ──────────────────────────────── */}
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
            <span className="chart-tag">{roi != null ? `ROI ${roi}%` : 'YTD'}</span>
          </div>
          <div className="kpi-grid" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
            <div className="kpi-cell">
              <div className="kpi-cell-label">Revenus protégés</div>
              <div className="kpi-cell-value">{eco != null ? <>{Math.round(eco)}k<em> €</em></> : "—"}</div>
              <div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}} />YTD</span><span>—</span></div>
            </div>
            <div className="kpi-cell">
              <div className="kpi-cell-label">ROI prédictif</div>
              <div className="kpi-cell-value">{kpiCats?.revenue_recovery?.roi_pct ?? "—"}<em>{kpiCats?.revenue_recovery?.roi_pct != null ? "%" : ""}</em></div>
              <div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}} />cible &gt; 200%</span><span>▲</span></div>
            </div>
          </div>
          {expandedSections.has('revenue') && (
            <div className="kpi-grid kpi-grid-secondary" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
              <div className="kpi-cell"><div className="kpi-cell-label">Économies vs correctif</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}} />moy.</span><span>—</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Production sauvegardée</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}} />tonnes</span><span>—</span></div></div>
            </div>
          )}
          <button className="kpi-expand-btn" onClick={() => toggleSection('revenue')}>
            {expandedSections.has('revenue') ? '↑ Réduire' : '↓ 2 KPIs supplémentaires'}
          </button>
        </div>

        {/* ─── ② Smart Replacement ─────────────────────────────── */}
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
          <div className="kpi-grid" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
            <div className="kpi-cell"><div className="kpi-cell-label">Pièces remplacées tôt</div><div className="kpi-cell-value">{kpiCats?.smart_replacement?.pm_supprimees ?? "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--warn)"}}/>cette année</span><span>▼</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Coût pièces évité</div><div className="kpi-cell-value">{kpiCats?.smart_replacement?.economies_remplacement_k != null ? <>{kpiCats.smart_replacement.economies_remplacement_k}k<em> €</em></> : "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>YTD</span><span>▲</span></div></div>
          </div>
          {expandedSections.has('smart') && (
            <div className="kpi-grid kpi-grid-secondary" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
              <div className="kpi-cell"><div className="kpi-cell-label">Précision DRBF</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &gt; 85%</span><span>▲</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Just-in-Time Rate</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>fenêtre opt.</span><span>▲</span></div></div>
            </div>
          )}
          <button className="kpi-expand-btn" onClick={() => toggleSection('smart')}>
            {expandedSections.has('smart') ? '↑ Réduire' : '↓ 2 KPIs supplémentaires'}
          </button>
        </div>

        {/* ─── ③ Planned Maintenance Reduction ─────────────────── */}
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
            <span className="chart-tag" style={{background:"rgba(59,130,246,.15)",color:"var(--info)",borderColor:"var(--info)"}}>CBM</span>
          </div>
          <div className="kpi-grid" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
            <div className="kpi-cell"><div className="kpi-cell-label">Ratio CBM / TBM</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &gt; 70%</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">PM inutiles détectés</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &lt; 20%</span><span>▼</span></div></div>
          </div>
          {expandedSections.has('planned') && (
            <div className="kpi-grid kpi-grid-secondary" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
              <div className="kpi-cell"><div className="kpi-cell-label">Heures préventives ↓</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>vs N-1</span><span>▲</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Économie main-d'œuvre</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>YTD</span><span>—</span></div></div>
            </div>
          )}
          <button className="kpi-expand-btn" onClick={() => toggleSection('planned')}>
            {expandedSections.has('planned') ? '↑ Réduire' : '↓ 2 KPIs supplémentaires'}
          </button>
        </div>

        {/* ─── ④ Internet of Things ────────────────────────────── */}
        <div className="section-title" id="kpi-iot">
          <h2>④ Internet of <em>Things</em></h2>
          <span className="section-title-meta">RÉSEAU DE CAPTEURS · 8 KPIs · {iotTotal ?? "—"} SENSORS</span>
        </div>
        <div className="kpi-section cat-iot">
          <div className="kpi-section-head">
            <div className="kpi-section-title">
              <div className="kpi-section-icon">IOT</div>
              <div>
                <div className="kpi-section-name">Performance du réseau IoT</div>
                <em>{iotTotal ?? "—"} capteurs · {iotGates ?? "—"} passerelles</em>
              </div>
            </div>
            <span className="chart-tag" style={{background:"rgba(6,182,212,.15)",color:"#06b6d4",borderColor:"#06b6d4"}}>{iotUptime != null ? `${iotUptime}% UPTIME` : 'UPTIME'}</span>
          </div>
          <div className="kpi-grid" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
            <div className="kpi-cell"><div className="kpi-cell-label">Disponibilité capteurs</div><div className="kpi-cell-value">{kpiCats?.iot_network ? Math.round(kpiCats.iot_network.capteurs_actifs / kpiCats.iot_network.total_capteurs * 100) : "—"}<em>%</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &gt; 98%</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Capteurs HS</div><div className="kpi-cell-value">{kpiCats?.iot_network?.en_panne ?? "—"}<em> / {kpiCats?.iot_network?.total_capteurs ?? "—"}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--warn)"}}/>{kpiCats?.iot_network != null && kpiCats.iot_network.total_capteurs > 0 ? (kpiCats.iot_network.en_panne / kpiCats.iot_network.total_capteurs * 100).toFixed(1) + '%' : '—'}</span><span>maint.</span></div></div>
          </div>
          {expandedSections.has('iot') && (
            <div className="kpi-grid kpi-grid-secondary" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
              <div className="kpi-cell"><div className="kpi-cell-label">Couverture parc V</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>vitales</span><span>—</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Passerelles actives</div><div className="kpi-cell-value">{kpiCats?.iot_network?.passerelles_actives ?? "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>actives</span><span>—</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Qualité données</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>valides</span><span>—</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Latence moyenne</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>capteur→UI</span><span>—</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Volume traité</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>pts/j</span><span>—</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">MTBF capteurs</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>fiabilité</span><span>—</span></div></div>
            </div>
          )}
          <button className="kpi-expand-btn" onClick={() => toggleSection('iot')}>
            {expandedSections.has('iot') ? '↑ Réduire' : '↓ 6 KPIs supplémentaires'}
          </button>
        </div>

        {/* ─── ⑤ Service Loss Reduction ────────────────────────── */}
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
          </div>
          <div className="kpi-grid" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
            <div className="kpi-cell"><div className="kpi-cell-label">MTBF</div><div className="kpi-cell-value">{kpiCats?.asset_availability?.mtbf_moy ?? "—"}<em>{kpiCats?.asset_availability?.mtbf_moy != null ? " h" : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>moy. parc</span><span>—</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Pannes évitées</div><div className="kpi-cell-value">{kpiCats?.revenue_recovery?.pannes_evitees ?? "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>YTD</span><span>▲</span></div></div>
          </div>
          {expandedSections.has('loss') && (
            <div className="kpi-grid kpi-grid-secondary" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
              <div className="kpi-cell"><div className="kpi-cell-label">MTTR</div><div className="kpi-cell-value">{kpiCats?.asset_availability?.mttr_moy ?? "—"}<em>{kpiCats?.asset_availability?.mttr_moy != null ? " h" : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>moy.</span><span>—</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Arrêts non planifiés</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>vs N-1</span><span>—</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Total heures d'arrêt</div><div className="kpi-cell-value">{kpiCats?.service_loss?.total_arret_h != null ? <>{kpiCats.service_loss.total_arret_h}<em> h</em></> : "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cumul</span><span>▲</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Pannes historique</div><div className="kpi-cell-value">{kpiCats?.service_loss?.nb_pannes_historique ?? "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>total BD</span><span>—</span></div></div>
            </div>
          )}
          <button className="kpi-expand-btn" onClick={() => toggleSection('loss')}>
            {expandedSections.has('loss') ? '↑ Réduire' : '↓ 4 KPIs supplémentaires'}
          </button>
        </div>

        {/* ─── ⑥ Risk Reduction ────────────────────────────────── */}
        <div className="section-title" id="kpi-risk">
          <h2>⑥ Risk <em>Reduction</em></h2>
          <span className="section-title-meta">RÉDUCTION DES RISQUES · 6 KPIs</span>
        </div>
        <div className="kpi-section cat-risk">
          <div className="kpi-section-head">
            <div className="kpi-section-title">
              <div className="kpi-section-icon">RISK</div>
              <div>
                <div className="kpi-section-name">Sécurité et conformité</div>
                <em>Personnes, biens, environnement, réglementation</em>
              </div>
            </div>
            <span className="chart-tag" style={{background:"rgba(239,68,68,.15)",color:"var(--danger)",borderColor:"var(--danger)"}}>{zoneDCount} EN ZONE D</span>
          </div>
          <div className="kpi-grid" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
            <div className="kpi-cell"><div className="kpi-cell-label">Machines zone D ISO</div><div className="kpi-cell-value">{zoneDCount}<em>{total != null ? ` / ${total}` : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--danger)"}}/>critique</span><span>action</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Quasi-accidents évités</div><div className="kpi-cell-value">{kpiCats?.risk_reduction?.incidents_ytd ?? "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>YTD</span><span>▲</span></div></div>
          </div>
          {expandedSections.has('risk') && (
            <div className="kpi-grid kpi-grid-secondary" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
              <div className="kpi-cell"><div className="kpi-cell-label">TRIR maintenance</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &lt; 1.0</span><span>—</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Tps réaction critique</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>moy.</span><span>—</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Conformité régl.</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>insp. à jour</span><span>—</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Score risque parc</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>—</span><span>—</span></div></div>
            </div>
          )}
          <button className="kpi-expand-btn" onClick={() => toggleSection('risk')}>
            {expandedSections.has('risk') ? '↑ Réduire' : '↓ 4 KPIs supplémentaires'}
          </button>
        </div>

        {/* ─── ⑦ Workforce Improvement ─────────────────────────── */}
        <div className="section-title" id="kpi-workforce">
          <h2>⑦ Workforce <em>Improvement</em></h2>
          <span className="section-title-meta">AMÉLIORATION DES ÉQUIPES · 8 KPIs</span>
        </div>
        <div className="kpi-section cat-workforce">
          <div className="kpi-section-head">
            <div className="kpi-section-title">
              <div className="kpi-section-icon">OPS</div>
              <div>
                <div className="kpi-section-name">Productivité et compétences</div>
                <em>Wrench time, fix rate, certifications, planification</em>
              </div>
            </div>
            <span className="chart-tag" style={{background:"rgba(245,158,11,.15)",color:"var(--warn)",borderColor:"var(--warn)"}}>WORKFORCE</span>
          </div>
          <div className="kpi-grid" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
            <div className="kpi-cell"><div className="kpi-cell-label">Certifiés ISO 18436</div><div className="kpi-cell-value">{kpiCats?.workforce?.nb_certifications ?? "—"}<em> / {kpiCats?.workforce?.nb_techniciens ?? "—"}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--warn)"}}/>certifications</span><span>—</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Équipe active</div><div className="kpi-cell-value">{kpiCats?.workforce?.equipe_active ?? "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>techniciens</span><span>—</span></div></div>
          </div>
          {expandedSections.has('workforce') && (
            <div className="kpi-grid kpi-grid-secondary" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
              <div className="kpi-cell"><div className="kpi-cell-label">Wrench Time</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &gt; 50%</span><span>▲</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">First-Time Fix Rate</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &gt; 90%</span><span>▲</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Interventions planifiées</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>vs urgences</span><span>▲</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Productivité tech.</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>interv./tech.</span><span>▲</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Tps diagnostic moy.</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>vs 45 avant</span><span>▼</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Réduction urgences</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>vs N-1</span><span>▲</span></div></div>
            </div>
          )}
          <button className="kpi-expand-btn" onClick={() => toggleSection('workforce')}>
            {expandedSections.has('workforce') ? '↑ Réduire' : '↓ 6 KPIs supplémentaires'}
          </button>
        </div>

        {/* ─── ⑧ Asset Availability ────────────────────────────── */}
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
            <span className="chart-tag" style={{background:"rgba(132,204,22,.15)",color:"#84cc16",borderColor:"#84cc16"}}>{kpiCats?.asset_availability?.oee_moy != null ? `OEE ${kpiCats.asset_availability.oee_moy}%` : 'OEE'}</span>
          </div>
          <div className="kpi-grid" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
            <div className="kpi-cell"><div className="kpi-cell-label">Disponibilité globale</div><div className="kpi-cell-value">{disp != null ? disp.toFixed(1) : "—"}<em>{disp != null ? "%" : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &gt; 95%</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">TRS / OEE</div><div className="kpi-cell-value">{kpiCats?.asset_availability?.oee_moy ?? "—"}<em>{kpiCats?.asset_availability?.oee_moy != null ? "%" : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>world-class</span><span>▲</span></div></div>
          </div>
          {expandedSections.has('availability') && (
            <div className="kpi-grid kpi-grid-secondary" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
              <div className="kpi-cell"><div className="kpi-cell-label">Performance</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>vitesse réelle</span><span>▲</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Qualité</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>conforme</span><span>▲</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Asset Health Index</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>parc moy.</span><span>▲</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Utilisation actifs</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>tps prod./dispo</span><span>▲</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">PM Compliance</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &gt; 95%</span><span>▲</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">%RAV</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>world-class</span><span>OK</span></div></div>
            </div>
          )}
          <button className="kpi-expand-btn" onClick={() => toggleSection('availability')}>
            {expandedSections.has('availability') ? '↑ Réduire' : '↓ 6 KPIs supplémentaires'}
          </button>
        </div>

        {/* ─── ⑨ Predictive Maintenance Core ───────────────────── */}
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
          <div className="kpi-grid" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
            <div className="kpi-cell"><div className="kpi-cell-label">Taux détection</div><div className="kpi-cell-value">{taux != null ? taux.toFixed(1) : "—"}<em>{taux != null ? "%" : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &gt; 80%</span><span>▲</span></div></div>
            <div className="kpi-cell"><div className="kpi-cell-label">Alarmes actives</div><div className="kpi-cell-value">{kpiCats?.predictive_power?.defauts_actifs ?? "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--warn)"}}/>{zoneDCount} zone D</span><span>action</span></div></div>
          </div>
          {expandedSections.has('predictive') && (
            <div className="kpi-grid kpi-grid-secondary" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
              <div className="kpi-cell"><div className="kpi-cell-label">Faux positifs</div><div className="kpi-cell-value">{fp != null ? fp.toFixed(1) : "—"}<em>{fp != null ? "%" : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>cible &lt; 15%</span><span>▼</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Précision diagnostic</div><div className="kpi-cell-value">{kpiCats?.predictive_power?.confiance_moy_pct ?? "—"}<em>{kpiCats?.predictive_power?.confiance_moy_pct != null ? "%" : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>diag. corrects</span><span>▲</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Lead Time moyen</div><div className="kpi-cell-value">{lt ?? "—"}<em>{lt != null ? " sem." : ""}</em></div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>préavis</span><span>▲</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">DRBF min parc</div><div className="kpi-cell-value">{kpiCats?.risk_reduction?.drbf_min_parc != null ? <>{kpiCats.risk_reduction.drbf_min_parc}<em> j</em></> : "—"}</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--warn)"}}/>{alertCnt ?? "—"} défauts actifs</span><span>—</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">Couverture vibratoire</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>critiques</span><span>OK</span></div></div>
              <div className="kpi-cell"><div className="kpi-cell-label">V<sub>RMS</sub> moyen parc</div><div className="kpi-cell-value">—</div><div className="kpi-cell-meta"><span><span className="kpi-cell-status" style={{background:"var(--accent)"}}/>zone B ISO</span><span>OK</span></div></div>
            </div>
          )}
          <button className="kpi-expand-btn" onClick={() => toggleSection('predictive')}>
            {expandedSections.has('predictive') ? '↑ Réduire' : '↓ 6 KPIs supplémentaires'}
          </button>
        </div>

        {/* ─── Footer ──────────────────────────────────────────── */}
        <div className="dashboard-footer">
          <span>DASHBOARD MAINTENANCE PRÉDICTIVE · {formatLastUpdate(lastUpdate?.derniere_maj, lastUpdate?.has_data ?? false).toUpperCase()}</span>
          <span>{iotTotal ?? "—"} CAPTEURS · {iotGates ?? "—"} PASSERELLES · {total ?? "—"} MACHINES · ISO 10816 / 18436 COMPLIANT</span>
        </div>

      </div>
    </AppLayout>
  );
};

export default DashboardPage;
