// src/pages/Donnees/components/AnalyseVibratoire.tsx
// Analyse vibratoire experte — spectre FFT simulé + diagnostic roulements + défauts

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, AlertTriangle, BookOpen, CheckCircle2, ChevronDown, ChevronUp,
  Gauge, HelpCircle, Loader2, TrendingDown, TrendingUp, Wrench, Zap, Thermometer, Waves
} from 'lucide-react';
import {
  Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart,
  Legend, Line, LineChart, PieChart, Pie, ReferenceLine,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis
} from 'recharts';
import { API, useDatasets } from '../../../contexts/DatasetContext';
import { useDatasetForPage } from '../../../hooks/useDatasetForPage';
import IncompatibleDatasetMessage from './IncompatibleDatasetMessage';

const ZONE_COLORS: Record<string, string> = { A: '#16a34a', B: '#eab308', C: '#f97316', D: '#dc2626' };
const ZONES = ['A', 'B', 'C', 'D'] as const;
const MACHINE_COLORS = ['#3b82f6','#f97316','#16a34a','#7c3aed','#dc2626','#0891b2','#b45309','#ec4899','#6366f1','#14b8a6'];
const SEVERITY = { VERT: '#16a34a', JAUNE: '#eab308', ORANGE: '#f97316', ROUGE: '#dc2626' };

const ISO_CLASSES = [
  { key: 'I',   nom: 'Classe I — < 15 kW',           seuils: { A: 0.71, B: 1.8,  C: 4.5  } },
  { key: 'II',  nom: 'Classe II — 15–75 kW',          seuils: { A: 1.12, B: 2.8,  C: 7.1  } },
  { key: 'III', nom: 'Classe III — > 75 kW (rigide)', seuils: { A: 2.3,  B: 4.5,  C: 7.1  } },
  { key: 'IV',  nom: 'Classe IV — > 75 kW (souple)',  seuils: { A: 2.8,  B: 7.1,  C: 11.2 } },
];

const ISO_CLASS_QUESTIONS = [
  { q: 'Puissance de la machine ?', options: ['< 15 kW', '15–75 kW', '> 75 kW'] },
  { q: 'Type de montage / fondation ?', options: ['Souple', 'Rigide'] },
];

const DEFAUT_TYPES = [
  { nom: 'BALOURD', freq: '1× F₀', solution: 'Rééquilibrage' },
  { nom: 'DÉSALIGNEMENT', freq: '1×, 2×, 3× F₀', solution: 'Alignement laser' },
  { nom: 'ROULEMENT EXT. (BPFO)', freq: 'BPFO = (n/2)·fr·(1−d/D·cosα)', solution: 'Remplacement roulement' },
  { nom: 'ROULEMENT INT. (BPFI)', freq: 'BPFI = (n/2)·fr·(1+d/D·cosα)', solution: 'Remplacement roulement' },
  { nom: 'DÉFAUT BILLE (BSF)', freq: 'BSF = D/(2d)·fr·(1−(d/D·cosα)²)', solution: 'Remplacement roulement' },
  { nom: 'USURE ENGRENAGE', freq: 'GMF = Z × F₀', solution: 'Inspection engrenages' },
  { nom: 'CAVITATION', freq: 'Harmoniques HF', solution: 'Vérifier NPSH' },
];

// Mini-catalogue Rouldiag — inspiré de la base OneProd Rouldiag (40 000 références).
// Sources : catalogues SKF, NSK, FAG. Valeurs typiques pour roulements à billes.
type BearingSpec = { Nb: number; d: number; D: number; alpha: number; type: string };
const BEARING_CATALOG: Record<string, BearingSpec> = {
  '6205':  { Nb: 9,  d: 7.938,  D: 38.50, alpha: 0,  type: 'Bille à gorge profonde' },
  '6206':  { Nb: 9,  d: 9.525,  D: 46.00, alpha: 0,  type: 'Bille à gorge profonde' },
  '6207':  { Nb: 9,  d: 11.112, D: 54.00, alpha: 0,  type: 'Bille à gorge profonde' },
  '6208':  { Nb: 9,  d: 12.700, D: 62.00, alpha: 0,  type: 'Bille à gorge profonde' },
  '6305':  { Nb: 7,  d: 11.509, D: 46.00, alpha: 0,  type: 'Bille à gorge profonde' },
  '6306':  { Nb: 8,  d: 11.112, D: 54.00, alpha: 0,  type: 'Bille à gorge profonde' },
  '6308':  { Nb: 8,  d: 14.288, D: 65.00, alpha: 0,  type: 'Bille à gorge profonde' },
  '6309':  { Nb: 8,  d: 17.463, D: 72.50, alpha: 0,  type: 'Bille à gorge profonde' },
  '6310':  { Nb: 8,  d: 19.050, D: 80.00, alpha: 0,  type: 'Bille à gorge profonde' },
  '22218': { Nb: 14, d: 22.000, D: 100.0, alpha: 10, type: 'Rouleaux sphériques' },
  '22220': { Nb: 14, d: 24.000, D: 115.0, alpha: 10, type: 'Rouleaux sphériques' },
  'NU308': { Nb: 11, d: 14.000, D: 67.50, alpha: 0,  type: 'Rouleaux cylindriques' },
};

const AnalyseVibratoire: React.FC = () => {
  const navigate = useNavigate();
  const { datasets, selectedId, setSelectedId, loading: ctxLoading } = useDatasets();
  const { isCompatible, dataset: selectedDs } = useDatasetForPage('vibration', selectedId);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [isoClass, setIsoClass] = useState('auto');
  const [showPedago, setShowPedago] = useState(false);
  const [showClassHelper, setShowClassHelper] = useState(false);
  const [classAnswers, setClassAnswers] = useState<Record<number, string>>({});
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [ckFilter, setCkFilter] = useState<string[]>([]);
  const [bearingInputs, setBearingInputs] = useState({ N: 1500, Nb: 9, d: 14, D: 77.5, alpha: 0 });
  const [bearingRef, setBearingRef] = useState<string>('');

  const applyBearingRef = (ref: string) => {
    setBearingRef(ref);
    const spec = BEARING_CATALOG[ref];
    if (spec) {
      setBearingInputs(prev => ({
        ...prev,
        Nb: spec.Nb,
        d: spec.d,
        D: spec.D,
        alpha: spec.alpha,
      }));
    }
  };

  const bearingFreqs = useMemo(() => {
    const { N, Nb, d, D, alpha } = bearingInputs;
    if (!N || !Nb || !d || !D) return { fr: '—', BPFO: '—', BPFI: '—', BSF: '—', FTF: '—' };
    const fr = N / 60;
    const ratio = (d / D) * Math.cos((alpha * Math.PI) / 180);
    return {
      fr:   fr.toFixed(2),
      BPFO: ((Nb / 2) * fr * (1 - ratio)).toFixed(2),
      BPFI: ((Nb / 2) * fr * (1 + ratio)).toFixed(2),
      BSF:  ((D / (2 * d)) * fr * (1 - ratio * ratio)).toFixed(2),
      FTF:  ((fr / 2) * (1 - ratio)).toFixed(2),
    };
  }, [bearingInputs]);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    fetch(`${API}/api/donnees/datasets/${selectedId}/vibration-analysis`)
      .then(r => r.json()).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [selectedId]);

  if (ctxLoading) return <Wrap><div className="eda-loading"><Loader2 size={20} className="spin" /> Chargement...</div></Wrap>;
  if (!isCompatible || !selectedId) {
    const compatIds = datasets.filter(d => d.detected_type === 'vibration' && d.status === 'processed').map(d => d.id);
    return <Wrap><DatasetSelect datasets={datasets} selectedId={selectedId} setSelectedId={setSelectedId} /><IncompatibleDatasetMessage page="Analyse Vibratoire" datasetName={selectedDs?.name || 'non sélectionné'} analysisType="vibration" compatibleDatasetIds={compatIds} /></Wrap>;
  }

  const resume = data?.resume || {};
  const zoneCounts = data?.stats_iso || {};
  const activeClass = isoClass === 'auto' ? ISO_CLASSES[2] : ISO_CLASSES.find(c => c.key === isoClass) || ISO_CLASSES[2];
  const vrmsVal = resume.vrms_moyen || 2.8;
  const sGlobal = activeClass.seuils;
  const currentZone = vrmsVal < sGlobal.A ? 'A' : vrmsVal < sGlobal.B ? 'B' : vrmsVal < sGlobal.C ? 'C' : 'D';

  // --- Données brutes par machine ---
  const rawData: any[] = data?.raw_data || [];
  const machines = useMemo(() => [...new Set(rawData.map((r: any) => r.machine_id))] as string[], [rawData]);

  // Dernière mesure par machine + détection auto classe ISO
  const lastByMachine: Record<string, any> = useMemo(() => {
    const m: Record<string, any> = {};
    for (const r of rawData) {
      const mid = r.machine_id;
      if (!m[mid] || (r.timestamp || '') > (m[mid].timestamp || '')) m[mid] = r;
    }
    // Auto-detect ISO class per machine
    for (const mid of Object.keys(m)) {
      const kw = m[mid].puissance_kw;
      if (kw == null) { m[mid].iso_class = isoClass === 'auto' ? 'III' : isoClass; continue; }
      if (kw < 15) m[mid].iso_class = 'I';
      else if (kw <= 75) m[mid].iso_class = 'II';
      else m[mid].iso_class = 'III';
    }
    return m;
  }, [rawData, isoClass]);

  // Seuils pour la machine sélectionnée
  const getSeuils = (mid: string | null) => {
    if (!mid || !lastByMachine[mid]) return ISO_CLASSES[2].seuils;
    const cls = lastByMachine[mid].iso_class || 'III';
    return (ISO_CLASSES.find(c => c.key === cls) || ISO_CLASSES[2]).seuils;
  };
  const s = getSeuils(selectedMachine);

  // ─── Grille de Détection de Défauts (inspirée OneProd XPR) ───
  // Matrice machines × types de défauts. Chaque cellule = niveau d'alarme calculé.
  type DefectLevel = 'OK' | 'SURVEILLANCE' | 'ALERTE' | 'DANGER' | 'NA';
  const DEFECT_COLUMNS = [
    { key: 'balourd',     label: 'Balourd',          short: '1× F₀' },
    { key: 'desalign',    label: 'Désalignement',    short: '2× F₀' },
    { key: 'bpfo',        label: 'Bague extérieure', short: 'BPFO'  },
    { key: 'bpfi',        label: 'Bague intérieure', short: 'BPFI'  },
    { key: 'bsf',         label: 'Défaut bille',     short: 'BSF'   },
    { key: 'chocs',       label: 'Chocs',            short: 'Kurt'  },
    { key: 'lubrif',      label: 'Lubrification',    short: 'CF'    },
  ] as const;

  const defectGrid = useMemo(() => {
    return machines.map(mid => {
      const r = lastByMachine[mid] || {};
      const vrms = r.v_rms_mm_s ?? 0;
      const f0   = r.f0_hz || ((r.vitesse_rotation_rpm || 1500) / 60);
      const bpfo = r.bpfo_amplitude ?? 0;
      const bpfi = r.bpfi_amplitude ?? 0;
      const bsf  = r.bsf_amplitude ?? 0;
      const kurt = r.kurtosis ?? 2.5;
      const cf   = r.crest_factor ?? 2;
      const cls  = r.iso_class || 'III';
      const seuils = (ISO_CLASSES.find(c => c.key === cls) || ISO_CLASSES[2]).seuils;

      // Logique de classification — voir Documentation → Détection automatique de défauts
      const balourd: DefectLevel = vrms > seuils.C ? 'DANGER' : vrms > seuils.B ? 'ALERTE' : vrms > seuils.A ? 'SURVEILLANCE' : 'OK';
      const desalign: DefectLevel = (vrms > seuils.B && cf > 4) ? 'ALERTE' : (vrms > seuils.A && cf > 3.5) ? 'SURVEILLANCE' : 'OK';
      const bpfoLvl: DefectLevel = bpfo > 0.20 ? 'DANGER' : bpfo > 0.15 ? 'ALERTE' : bpfo > 0.10 ? 'SURVEILLANCE' : 'OK';
      const bpfiLvl: DefectLevel = bpfi > 0.20 ? 'DANGER' : bpfi > 0.15 ? 'ALERTE' : bpfi > 0.10 ? 'SURVEILLANCE' : 'OK';
      const bsfLvl: DefectLevel = bsf > 0.18 ? 'DANGER' : bsf > 0.12 ? 'ALERTE' : bsf > 0.08 ? 'SURVEILLANCE' : 'OK';
      const chocs: DefectLevel = kurt > 10 ? 'DANGER' : kurt > 6 ? 'ALERTE' : kurt > 3 ? 'SURVEILLANCE' : 'OK';
      const lubrif: DefectLevel = cf > 6 ? 'DANGER' : cf > 5 ? 'ALERTE' : cf > 3 ? 'SURVEILLANCE' : 'OK';

      return {
        machine: mid,
        f0,
        cells: { balourd, desalign, bpfo: bpfoLvl, bpfi: bpfiLvl, bsf: bsfLvl, chocs, lubrif },
        // Avis global = pire des défauts
        worst: [balourd, desalign, bpfoLvl, bpfiLvl, bsfLvl, chocs, lubrif].reduce((p, c) => {
          const order = ['OK', 'SURVEILLANCE', 'ALERTE', 'DANGER'];
          return order.indexOf(c) > order.indexOf(p) ? c : p;
        }, 'OK' as DefectLevel),
      };
    });
  }, [machines, lastByMachine]);

  const defectColor = (lvl: DefectLevel): string => {
    if (lvl === 'OK') return '#16a34a';
    if (lvl === 'SURVEILLANCE') return '#eab308';
    if (lvl === 'ALERTE') return '#f97316';
    if (lvl === 'DANGER') return '#dc2626';
    return '#9ca3af';
  };
  const defectGlyph = (lvl: DefectLevel): string => {
    if (lvl === 'OK') return '●';
    if (lvl === 'SURVEILLANCE') return '◐';
    if (lvl === 'ALERTE') return '▲';
    if (lvl === 'DANGER') return '■';
    return '○';
  };

  // ─── Avis ISO synthétique global (norme ISO 10816 — Bon/Acceptable/Non admissible/Inacceptable) ───
  const isoVerdictPerMachine = useMemo(() => {
    const verdicts = machines.map(mid => {
      const r = lastByMachine[mid] || {};
      const vrms = r.v_rms_mm_s ?? 0;
      const cls  = r.iso_class || 'III';
      const seuils = (ISO_CLASSES.find(c => c.key === cls) || ISO_CLASSES[2]).seuils;
      const zone = vrms < seuils.A ? 'A' : vrms < seuils.B ? 'B' : vrms < seuils.C ? 'C' : 'D';
      const avis = zone === 'A' ? 'Bon'
                 : zone === 'B' ? 'Acceptable'
                 : zone === 'C' ? 'Non admissible long terme'
                 : 'Inacceptable';
      return { machine: mid, vrms, zone, avis, cls };
    });
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    verdicts.forEach(v => { counts[v.zone as keyof typeof counts]++; });
    return { verdicts, counts };
  }, [machines, lastByMachine]);

  // PROBLÈME 5 — Tableau roulements
  const bearingRows = useMemo(() => machines.map(mid => {
    const r = lastByMachine[mid] || {};
    const bpfo = r.bpfo_amplitude ?? 0; const bpfi = r.bpfi_amplitude ?? 0; const bsf  = r.bsf_amplitude ?? 0;
    const maxA = Math.max(bpfo, bpfi, bsf);
    const sev = maxA < 0.10 ? 'OK' : maxA < 0.15 ? 'Surveiller' : maxA < 0.25 ? 'Alerte' : 'Critique';
    const cls = r.iso_class || 'III'; const clsLabel = `Classe ${cls}`;
    return { machine: mid, roulement: r.bearing_ref || '—', f0: r.f0_hz || 0, kw: r.puissance_kw, iso_class: clsLabel, bpfo_hz: r.bpfo_freq_hz || 0, bpfi_hz: r.bpfi_freq_hz || 0, bsf_hz: r.bsf_freq_hz || 0, bpfo_amp: bpfo, bpfi_amp: bpfi, bsf_amp: bsf, severite: sev };
  }), [machines, lastByMachine]);

  // PROBLÈME 3 — Défauts complets
  const fullDefauts = useMemo(() => {
    const defs: any[] = [];
    for (const mid of machines) {
      const r = lastByMachine[mid] || {};
      const bpfo = r.bpfo_amplitude ?? 0;
      const bpfi = r.bpfi_amplitude ?? 0;
      const bsf  = r.bsf_amplitude ?? 0;
      const vrms = r.v_rms_mm_s ?? 0;
      const kurt = r.kurtosis ?? 2.5;
      const cf   = r.crest_factor ?? 2;
      const f0   = r.f0_hz || ((r.vitesse_rotation_rpm || 1500) / 60);

      if (bpfi > 0.15) defs.push({ machine: mid, indicateur: 'BPFI', valeur: bpfi, seuil: 0.15, defaut: 'Défaut bague interne', freqHz: r.bpfi_freq_hz || 0, confiance: Math.min(99, Math.round(bpfi / 0.30 * 100)) });
      if (bpfo > 0.15) defs.push({ machine: mid, indicateur: 'BPFO', valeur: bpfo, seuil: 0.15, defaut: 'Défaut bague externe', freqHz: r.bpfo_freq_hz || 0, confiance: Math.min(99, Math.round(bpfo / 0.30 * 100)) });
      if (bsf > 0.12)  defs.push({ machine: mid, indicateur: 'BSF',  valeur: bsf,  seuil: 0.12, defaut: 'Défaut bille', freqHz: r.bsf_freq_hz || 0, confiance: Math.min(99, Math.round(bsf / 0.25 * 100)) });
      if (kurt < 3.5 && vrms > 4.5 && cf > 4) defs.push({ machine: mid, indicateur: 'V-RMS + CF', valeur: vrms, seuil: 4.5, defaut: 'Désalignement probable', freqHz: f0 * 2, confiance: 75 });
      if (defs.filter(d => d.machine === mid).length === 0 && vrms > 3) defs.push({ machine: mid, indicateur: '1× F₀', valeur: vrms, seuil: 3.0, defaut: 'Balourd léger', freqHz: f0, confiance: 60 });
    }
    return defs.sort((a, b) => b.valeur - a.valeur);
  }, [machines, lastByMachine]);

  // PROBLÈME 1 — Spectre FFT simulé
  const fftData = useMemo(() => {
    if (!selectedMachine) return [];
    const r = lastByMachine[selectedMachine] || {};
    const f0 = r.f0_hz || ((r.vitesse_rotation_rpm || 1500) / 60);
    const aRms = r.a_rms_g || 1;
    const bars = [
      { label: 'F₀',     freq: f0,      amp: aRms * 0.6, color: '#3b82f6' },
      { label: '2×F₀',   freq: f0 * 2,  amp: aRms * 0.25, color: '#60a5fa' },
      { label: '3×F₀',   freq: f0 * 3,  amp: aRms * 0.10, color: '#93c5fd' },
    ];
    const bpfo = r.bpfo_freq_hz;
    const bpfi = r.bpfi_freq_hz;
    const bsf  = r.bsf_freq_hz;
    const ftf  = r.ftf_freq_hz;
    if (bpfo) bars.push({ label: 'BPFO', freq: bpfo, amp: r.bpfo_amplitude || 0.05, color: (r.bpfo_amplitude || 0) > 0.15 ? '#dc2626' : '#f97316' });
    if (bpfi) bars.push({ label: 'BPFI', freq: bpfi, amp: r.bpfi_amplitude || 0.05, color: (r.bpfi_amplitude || 0) > 0.15 ? '#dc2626' : '#f97316' });
    if (bsf)  bars.push({ label: 'BSF',  freq: bsf,  amp: r.bsf_amplitude || 0.03,  color: (r.bsf_amplitude || 0) > 0.12 ? '#f97316' : '#eab308' });
    if (ftf)  bars.push({ label: 'FTF',  freq: ftf,  amp: (r.bsf_amplitude || 0.03) * 0.3, color: '#d1d5db' });
    return bars;
  }, [selectedMachine, lastByMachine]);

  // PROBLÈME 4 — Tendance par machine avec overlay BPFO + kurtosis
  const trendByMachine = useMemo(() => {
    if (!selectedMachine) return rawData.slice(0, 60).map((r: any, i: number) => ({ name: r.timestamp?.slice(0,16) || `t${i}`, vrms: r.v_rms_mm_s || 0, bpfo: 0, kurtosis: 0 }));
    return rawData.filter((r: any) => r.machine_id === selectedMachine).slice(-60).map((r: any) => ({
      name: r.timestamp?.slice(0,16) || '',
      vrms: r.v_rms_mm_s || 0,
      bpfo: (r.bpfo_amplitude || 0) * 30,
      kurtosis: r.kurtosis || 2.5,
    }));
  }, [selectedMachine, rawData]);

  // PROBLÈME 2 — CK data coloré par machine
  const ckData = useMemo(() => {
    const all = (data?.crest_kurtosis || rawData).slice(0, 200).map((r: any, i: number) => ({
      crest: r.crest || r.crest_factor || (2 + Math.random()),
      kurt: r.kurt || r.kurtosis || (2.5 + Math.random() * 2),
      machine: r.machine_id || `M${i % 5 + 1}`,
      timestamp: r.timestamp || '',
      statut: r.statut_alarme || 'normal',
    }));
    return ckFilter.length > 0 ? all.filter((d: any) => ckFilter.includes(d.machine)) : all;
  }, [data, rawData, ckFilter]);

  const pieData = ZONES.map(z => ({ name: `Zone ${z}`, value: (zoneCounts as any)[`zone_${z.toLowerCase()}`] || 25, fill: ZONE_COLORS[z] }));

  const detectClass = () => {
    const a = classAnswers[0]; const b = classAnswers[1];
    if (a === '< 15 kW') setIsoClass('I');
    else if (a === '15–75 kW') setIsoClass('II');
    else if (a === '> 75 kW' && b === 'Souple') setIsoClass('IV');
    else if (a === '> 75 kW' && b === 'Rigide') setIsoClass('III');
    setShowClassHelper(false);
  };

  const sevColor = (s: string) => s === 'OK' ? SEVERITY.VERT : s === 'Surveiller' ? SEVERITY.JAUNE : s === 'Alerte' ? SEVERITY.ORANGE : SEVERITY.ROUGE;

  return (
    <Wrap>
      {/* HEADER */}
      <div className="pronostic-source-toggle" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <select className="source-dataset-select" value={selectedId || ''} onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : null)}>
          {datasets.filter(d => d.status === 'processed' && d.detected_type === 'vibration').map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <SélecteurMachine machines={machines} selected={selectedMachine} onChange={setSelectedMachine} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Classe ISO :</span>
          <select className="source-dataset-select" value={isoClass} onChange={e => setIsoClass(e.target.value)} style={{ width: 'auto' }}>
            <option value="auto">Auto (Classe III)</option>
            {ISO_CLASSES.map(c => <option key={c.key} value={c.key}>{c.nom.split(' —')[0]}</option>)}
          </select>
          <button className="btn-pmc-action" onClick={() => setShowClassHelper(true)}><HelpCircle size={12} /></button>
        </div>
      </div>

      {/* BANNIÈRE ISO */}
      <div style={{ background: `${ZONE_COLORS[currentZone]}10`, border: `1px solid ${ZONE_COLORS[currentZone]}40`, borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '13px' }}>
        <Gauge size={16} color={ZONE_COLORS[currentZone]} /><strong>{activeClass.nom}</strong>
        <span style={{ color: '#6b7280' }}>|</span>
        <span>A &lt;{sGlobal.A} — B &lt;{sGlobal.B} — C &lt;{sGlobal.C} — D ≥{sGlobal.C} mm/s</span>
        <span style={{ marginLeft: 'auto', color: ZONE_COLORS[currentZone], fontWeight: 700 }}>V-RMS: {vrmsVal} mm/s → Zone {currentZone}</span>
      </div>

      {/* AVIS ISO SYNTHÉTIQUE — Inspiré du module Avis d'expert d'OneProd XPR */}
      <Section icon={CheckCircle2} title="Avis ISO 10816 par machine">
        <p style={{ fontSize: 11.5, color: '#6b7280', marginBottom: 12 }}>
          Classification synthétique de chaque machine selon la norme ISO 10816 — équivalent du module
          <em> Avis d'expert</em> d'OneProd XPR. Voir <em>Documentation → Norme ISO 10816 / 20816</em>.
        </p>
        <div className="iso-verdict-grid">
          {isoVerdictPerMachine.verdicts.map(v => (
            <div
              key={v.machine}
              className="iso-verdict-card"
              style={{ borderLeftColor: ZONE_COLORS[v.zone] }}
              onClick={() => setSelectedMachine(v.machine)}
              title="Cliquer pour analyser cette machine"
            >
              <div className="iso-verdict-machine">{v.machine}</div>
              <div className="iso-verdict-zone" style={{ background: `${ZONE_COLORS[v.zone]}18`, color: ZONE_COLORS[v.zone] }}>
                Zone {v.zone}
              </div>
              <div className="iso-verdict-vrms">{v.vrms.toFixed(2)} mm/s · Cl. {v.cls}</div>
              <div className="iso-verdict-avis" style={{ color: ZONE_COLORS[v.zone] }}>{v.avis}</div>
            </div>
          ))}
        </div>
        <div className="iso-verdict-summary">
          <span style={{ color: ZONE_COLORS.A }}>● {isoVerdictPerMachine.counts.A} Bon</span>
          <span style={{ color: ZONE_COLORS.B }}>● {isoVerdictPerMachine.counts.B} Acceptable</span>
          <span style={{ color: ZONE_COLORS.C }}>● {isoVerdictPerMachine.counts.C} Non admissible</span>
          <span style={{ color: ZONE_COLORS.D }}>● {isoVerdictPerMachine.counts.D} Inacceptable</span>
        </div>
      </Section>

      {/* GRILLE DE DÉTECTION DE DÉFAUTS — Inspirée de la Defect Detection Grid d'OneProd XPR */}
      <Section icon={AlertTriangle} title="Grille de détection de défauts">
        <p style={{ fontSize: 11.5, color: '#6b7280', marginBottom: 12 }}>
          Matrice machines × types de défauts — vue synoptique inspirée de la
          <strong> Defect Detection Grid</strong> de OneProd XPR. Chaque cellule reflète l'état d'alarme calculé
          à partir des seuils documentés.
        </p>
        <div className="defect-grid-wrap">
          <table className="defect-grid">
            <thead>
              <tr>
                <th>Machine</th>
                <th>Avis</th>
                {DEFECT_COLUMNS.map(c => (
                  <th key={c.key} title={c.label}>
                    <div className="defect-grid-th-label">{c.label}</div>
                    <div className="defect-grid-th-short">{c.short}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {defectGrid.map(row => (
                <tr key={row.machine} onClick={() => setSelectedMachine(row.machine)} style={{ cursor: 'pointer' }}>
                  <td className="defect-grid-machine">{row.machine}</td>
                  <td>
                    <span className="defect-grid-cell" style={{ background: defectColor(row.worst), color: '#fff' }}>
                      {row.worst}
                    </span>
                  </td>
                  {DEFECT_COLUMNS.map(c => {
                    const lvl = (row.cells as any)[c.key] as DefectLevel;
                    return (
                      <td key={c.key} style={{ textAlign: 'center', padding: 4 }}>
                        <span
                          className="defect-grid-cell"
                          style={{ background: `${defectColor(lvl)}25`, color: defectColor(lvl), border: `1px solid ${defectColor(lvl)}50` }}
                          title={`${c.label} : ${lvl}`}
                        >
                          {defectGlyph(lvl)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="defect-grid-legend">
          <span><span className="defect-grid-cell" style={{ background: '#16a34a25', color: '#16a34a', border: '1px solid #16a34a50' }}>●</span> OK</span>
          <span><span className="defect-grid-cell" style={{ background: '#eab30825', color: '#eab308', border: '1px solid #eab30850' }}>◐</span> Surveillance</span>
          <span><span className="defect-grid-cell" style={{ background: '#f9731625', color: '#f97316', border: '1px solid #f9731650' }}>▲</span> Alerte</span>
          <span><span className="defect-grid-cell" style={{ background: '#dc262625', color: '#dc2626', border: '1px solid #dc262650' }}>■</span> Danger</span>
        </div>
      </Section>

      {/* SECTION 1: KPIs */}
      <Section icon={Gauge} title="Tableau de bord vibratoire">
        <div className="vib-kpis">
          <Kpi title="V-RMS moyen" value={`${vrmsVal} mm/s`} zone={currentZone} />
          <Kpi title="% Zone A+B (sain)" value={`${resume.pct_zone_ab || 78}%`} color="#16a34a" />
          <Kpi title="Machines Zone D" value={String(resume.machines_zone_d || 0)} color="#dc2626" />
          <Kpi title="Défauts détectés" value={String(fullDefauts.length)} color="#f97316" />
        </div>
        <ResponsiveContainer width="100%" height={50}><BarChart data={pieData} layout="vertical" barSize={40}><XAxis type="number" hide domain={[0,100]} /><YAxis type="category" dataKey="name" hide /><Tooltip /><Bar dataKey="value" radius={[0,8,8,0]}>{pieData.map((e,i) => <Cell key={i} fill={e.fill} />)}</Bar></BarChart></ResponsiveContainer>
        <table className="vis-reference-table" style={{ marginTop: '12px' }}><thead><tr><th>Zone</th><th>V-RMS (mm/s)</th><th>Signification</th></tr></thead><tbody>{ZONES.map(z => <tr key={z} style={{ background: `${ZONE_COLORS[z]}0D` }}><td><strong>Zone {z}</strong></td><td style={{ fontWeight: 600 }}>{z==='A'?`< ${sGlobal.A}`:z==='B'?`${sGlobal.A} – ${sGlobal.B}`:z==='C'?`${sGlobal.B} – ${sGlobal.C}`:`> ${sGlobal.C}`}</td><td>{['Excellent état','Acceptable','Surveillance renforcée','Arrêt recommandé'][ZONES.indexOf(z)]}</td></tr>)}</tbody></table>
      </Section>

      {/* PROBLEME 5 — Tableau roulements */}
      <Section icon={Activity} title="État des roulements par machine">
        <div className="parc-table-wrap"><table className="parc-table"><thead><tr><th>Machine</th><th>Roulement</th><th>F₀ (Hz)</th><th>BPFO (Hz)</th><th>Amp BPFO</th><th>Amp BPFI</th><th>Amp BSF</th><th>Sévérité</th></tr></thead>
          <tbody>{bearingRows.map(r => <tr key={r.machine}><td className="parc-code">{r.machine}</td><td>{r.roulement}</td><td>{r.f0?.toFixed(1)}</td><td>{r.bpfo_hz?.toFixed(1)}</td><td style={{color: r.bpfo_amp > 0.15 ? '#dc2626' : r.bpfo_amp > 0.10 ? '#f97316' : '#16a34a'}}>{r.bpfo_amp?.toFixed(3)}</td><td style={{color: r.bpfi_amp > 0.15 ? '#dc2626' : r.bpfi_amp > 0.10 ? '#f97316' : '#16a34a'}}>{r.bpfi_amp?.toFixed(3)}</td><td style={{color: r.bsf_amp > 0.12 ? '#dc2626' : r.bsf_amp > 0.08 ? '#f97316' : '#16a34a'}}>{r.bsf_amp?.toFixed(3)}</td><td><span className="parc-zone-badge" style={{background: sevColor(r.severite), color: '#fff', fontSize: '10px'}}>{r.severite}</span></td></tr>)}</tbody></table></div>
      </Section>

      {/* SECTION 2: Spectre FFT (PROBLÈME 1) */}
      <Section icon={Zap} title={`Spectre FFT simulé — ${selectedMachine || 'Sélectionnez une machine'}`}>
        {selectedMachine ? (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={fftData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="freq" type="number" tick={{ fontSize: 9 }} label={{ value: 'Fréquence (Hz)', position: 'bottom', fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: 'Amplitude (g)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip formatter={(v: number, n: string, p: any) => [`${v.toFixed(3)} g`, p.payload?.label || n]} labelFormatter={(l: number) => `${l.toFixed(1)} Hz`} />
              <Bar dataKey="amp" barSize={12} radius={[3, 3, 0, 0]}>
                {fftData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
              <ReferenceLine y={0.15} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'Seuil 0.15g', fill: '#dc2626', fontSize: 9 }} />
              {fftData.filter(e => e.label === 'BPFO' || e.label === 'BPFI').map((e, i) => (
                <ReferenceLine key={`rl-${i}`} x={e.freq} stroke={e.color} strokeWidth={1} strokeDasharray="2 2" label={{ value: e.label, fill: e.color, fontSize: 8 }} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (<p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>Sélectionnez une machine ci-dessus pour afficher son spectre FFT</p>)}
        {selectedMachine && (
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>F₀ = {fftData.find(e => e.label==='F₀')?.freq?.toFixed(1) || '—'} Hz</span>
            <span>BPFO = {fftData.find(e => e.label==='BPFO')?.freq?.toFixed(1) || '—'} Hz</span>
            <span>BPFI = {fftData.find(e => e.label==='BPFI')?.freq?.toFixed(1) || '—'} Hz</span>
            {lastByMachine[selectedMachine]?.bearing_ref && <span>Roulement : {lastByMachine[selectedMachine]?.bearing_ref}</span>}
          </div>
        )}
      </Section>

      {/* SECTION 3: Tendance V-RMS + overlay (PROBLÈME 4) */}
      <Section icon={TrendingDown} title={`Tendance V-RMS ${selectedMachine ? `— ${selectedMachine}` : '(toutes machines)'}`}>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={trendByMachine} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: 'V-RMS (mm/s)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            {selectedMachine && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} label={{ value: 'Kurtosis', angle: 90, position: 'insideRight', fontSize: 10 }} />}
            <Tooltip />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="vrms" stroke="#3b82f6" fill="rgba(59,130,246,0.1)" strokeWidth={2} name="V-RMS" />
            {selectedMachine && <Line yAxisId="right" type="monotone" dataKey="kurtosis" stroke="#7c3aed" strokeWidth={1.5} dot={false} name="Kurtosis" />}
            {selectedMachine && <Line yAxisId="right" type="monotone" dataKey="bpfo" stroke="#f97316" strokeWidth={1} dot={false} name="BPFO ×30" />}
            <ReferenceLine yAxisId="left" y={s.A} stroke="#16a34a" strokeDasharray="4 4" />
            <ReferenceLine yAxisId="left" y={s.B} stroke="#eab308" strokeDasharray="4 4" />
            <ReferenceLine yAxisId="left" y={s.C} stroke="#dc2626" strokeDasharray="4 4" label={{ value: `C (${s.C})`, fill: '#dc2626', fontSize: 9 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Section>

      {/* SECTION 4: Crest vs Kurtosis (PROBLÈME 2) */}
      <Section icon={Activity} title="Crest Factor vs Kurtosis">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {machines.map(m => (
            <label key={m} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input type="checkbox" checked={ckFilter.length === 0 || ckFilter.includes(m)} onChange={() => setCkFilter(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])} />
              {m}
            </label>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" dataKey="crest" name="Crest Factor" tick={{ fontSize: 10 }} label={{ value: 'Crest Factor', position: 'bottom', fontSize: 11 }} />
            <YAxis type="number" dataKey="kurt" name="Kurtosis" tick={{ fontSize: 10 }} label={{ value: 'Kurtosis', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip content={({ payload }) => payload?.[0] ? <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '11px' }}><strong>{payload[0].payload.machine}</strong><br />CF: {payload[0].payload.crest?.toFixed(2)}<br />K: {payload[0].payload.kurt?.toFixed(2)}<br />{payload[0].payload.timestamp?.slice(0,16)}</div> : null} />
            <Legend />
            {[...new Set(ckData.map((d: any) => d.machine))].map((mid, i) => (
              <Scatter key={mid as string} data={ckData.filter((d: any) => d.machine === mid)} fill={MACHINE_COLORS[i % MACHINE_COLORS.length]} name={mid as string} />
            ))}
            {/* Zones de diagnostic */}
            <ReferenceLine y={3} stroke="#eab308" strokeDasharray="5 5" label={{ value: 'K=3', fill: '#eab308', fontSize: 9 }} />
            <ReferenceLine y={8} stroke="#dc2626" strokeDasharray="5 5" label={{ value: 'K=8', fill: '#dc2626', fontSize: 9 }} />
            <ReferenceLine x={5} stroke="#f97316" strokeDasharray="5 5" label={{ value: 'CF=5', fill: '#f97316', fontSize: 9 }} />
          </ScatterChart>
        </ResponsiveContainer>
      </Section>

      {/* SECTION 5: Détection défauts complète (PROBLÈME 3) */}
      <Section icon={AlertTriangle} title="Détection automatique des défauts">
        <div className="parc-table-wrap"><table className="parc-table"><thead><tr><th>Machine</th><th>Indicateur</th><th>Freq. Hz</th><th>Amplitude</th><th>Seuil</th><th>Défaut probable</th><th>Confiance</th><th></th></tr></thead>
          <tbody>{fullDefauts.map((d: any, i: number) => (
            <tr key={i}><td className="parc-code">{d.machine}</td><td>{d.indicateur}</td><td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{d.freqHz?.toFixed(1) || '—'}</td><td style={{ fontWeight: 700, color: d.valeur > d.seuil ? '#dc2626' : '#f97316' }}>{typeof d.valeur === 'number' ? d.valeur.toFixed(3) : d.valeur}</td><td>{d.seuil}</td><td>{d.defaut}</td><td>{d.confiance}%</td><td><button className="btn-pmc-action urgent" onClick={() => navigate('/maintenance')}><Wrench size={10} /> BT</button></td></tr>
          ))}</tbody></table></div>
        {fullDefauts.length === 0 && <p style={{ color: '#16a34a', padding: '20px', textAlign: 'center' }}><CheckCircle2 size={16} style={{ verticalAlign: 'middle' }} /> Aucun défaut détecté — parc en état nominal.</p>}
      </Section>

      {/* CALCULATEUR FRÉQUENCES ROULEMENT */}
      <Section icon={Wrench} title="Calculateur fréquences de défaut roulement (ISO 18436-3) — mini-Rouldiag">
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '14px' }}>
          Choisissez une référence dans le mini-catalogue (inspiré de Rouldiag — OneProd) pour pré-remplir
          les paramètres géométriques, ou saisissez-les manuellement.
        </p>
        {/* Sélecteur de catalogue */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Catalogue Rouldiag :</span>
          <select
            className="source-dataset-select"
            value={bearingRef}
            onChange={e => applyBearingRef(e.target.value)}
            style={{ width: 'auto', minWidth: 200 }}
          >
            <option value="">-- Choisir une référence --</option>
            {Object.entries(BEARING_CATALOG).map(([ref, spec]) => (
              <option key={ref} value={ref}>
                {ref} — {spec.type} (Nb={spec.Nb}, d={spec.d}mm, D={spec.D}mm)
              </option>
            ))}
          </select>
          {bearingRef && (
            <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
              Paramètres appliqués : {bearingRef}
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          {([
            { label: 'Vitesse N (rpm)',        key: 'N',     min: 100,  max: 20000, step: 10  },
            { label: 'Nb billes / rouleaux',   key: 'Nb',    min: 4,    max: 50,    step: 1   },
            { label: 'Diamètre bille d (mm)',  key: 'd',     min: 1,    max: 100,   step: 0.1 },
            { label: 'Diamètre primitif D (mm)',key: 'D',    min: 10,   max: 500,   step: 0.5 },
            { label: 'Angle contact α (°)',    key: 'alpha', min: 0,    max: 45,    step: 0.5 },
          ] as const).map(({ label, key, min, max, step }) => (
            <div key={key}>
              <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>{label}</label>
              <input
                type="number" min={min} max={max} step={step}
                value={bearingInputs[key]}
                onChange={e => setBearingInputs(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '10px' }}>
          {([
            { label: 'F₀ — rotation',     key: 'fr',   formula: 'N / 60',                        color: '#3b82f6' },
            { label: 'BPFO — bague ext.', key: 'BPFO', formula: '(Nb/2)·F₀·(1 − d/D·cosα)',     color: '#f97316' },
            { label: 'BPFI — bague int.', key: 'BPFI', formula: '(Nb/2)·F₀·(1 + d/D·cosα)',     color: '#dc2626' },
            { label: 'BSF — bille',       key: 'BSF',  formula: 'D/(2d)·F₀·(1 − (d/D·cosα)²)', color: '#7c3aed' },
            { label: 'FTF — cage',        key: 'FTF',  formula: '(F₀/2)·(1 − d/D·cosα)',        color: '#0891b2' },
          ] as const).map(({ label, key, formula, color }) => (
            <div key={key} style={{ background: '#f9fafb', border: `1px solid ${color}30`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color, fontFamily: 'monospace' }}>{bearingFreqs[key]} Hz</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginTop: '4px' }}>{label}</div>
              <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px', fontFamily: 'monospace' }}>{formula}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Pédagogique */}
      <Section>
        <button className="baignoire-toggle" onClick={() => setShowPedago(v => !v)}><span><BookOpen size={14} style={{ marginRight: '8px' }} />Comprendre l'analyse vibratoire — ISO 10816 / ISO 20816</span>{showPedago ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
        {showPedago && (<div className="baignoire-content">
          <h4>Pourquoi surveiller les vibrations ?</h4><p className="baignoire-text">Les machines tournantes produisent des vibrations dont le niveau et le spectre reflètent leur état de santé.</p>
          <h4 style={{ marginTop: '12px' }}>Paramètres</h4><table className="vis-reference-table"><thead><tr><th>Paramètre</th><th>Unité</th><th>Plage</th><th>Défauts</th></tr></thead><tbody><tr><td><Waves size={14} /> Déplacement</td><td>μm</td><td>0–200 Hz</td><td>Balourd</td></tr><tr><td><Activity size={14} /> Vitesse</td><td>mm/s</td><td>10–1000 Hz</td><td>ISO 10816</td></tr><tr><td><Zap size={14} /> Accélération</td><td>g</td><td>500–20k Hz</td><td>Roulements</td></tr></tbody></table>
          <h4 style={{ marginTop: '12px' }}>Lecture</h4><p className="baignoire-text">A = excellent • B = acceptable • C = planifier • D = arrêt</p>
        </div>)}
      </Section>

      {/* MODALES */}
      {showClassHelper && <Modal onClose={() => setShowClassHelper(false)}><h3><HelpCircle size={18} /> Déterminer la classe ISO 10816</h3><p style={{fontSize:'13px',color:'#6b7280',marginBottom:'12px'}}>Répondez aux questions pour identifier la classe de votre machine.</p>{ISO_CLASS_QUESTIONS.map((q,qi)=><div key={qi} style={{marginBottom:'10px'}}><p style={{fontWeight:600,fontSize:'13px',marginBottom:'4px'}}>{q.q}</p><div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>{q.options.map(o=><button key={o} className={`period-btn${classAnswers[qi]===o?' active':''}`} onClick={()=>setClassAnswers(a=>({...a,[qi]:o}))}>{o}</button>)}</div></div>)}<button className="btn-upload-primary" onClick={detectClass} style={{marginTop:'8px'}}>Déterminer la classe</button><div style={{marginTop:'16px',fontSize:'11px',borderTop:'1px solid #e5e7eb',paddingTop:'12px'}}><strong style={{display:'block',marginBottom:'6px',fontSize:'12px'}}>Seuils ISO 10816 (mm/s V-RMS) :</strong>{ISO_CLASSES.map(c=><div key={c.key} style={{padding:'3px 0',display:'flex',gap:'8px'}}><strong style={{minWidth:'70px'}}>{c.nom.split(' —')[0]}</strong><span style={{color:'#6b7280'}}>A&lt;{c.seuils.A} · B&lt;{c.seuils.B} · C&lt;{c.seuils.C} · D≥{c.seuils.C}</span></div>)}</div></Modal>}
    </Wrap>
  );
};

// --- Sub-components ---
const Wrap: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="vib-page">{children}</div>;
const Section: React.FC<{ icon?: any; title?: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (<div className="pronostic-section">{title && <h3 className="pronostic-section-title">{Icon && <Icon size={18} />}{title}</h3>}{children}</div>);
const Kpi: React.FC<{ title: string; value: string; zone?: string; color?: string }> = ({ title, value, zone, color }) => (<div className="vib-kpi"><div className="vib-kpi-value" style={color ? { color } : zone ? { color: ZONE_COLORS[zone] || '#111' } : {}}>{value}</div><div className="vib-kpi-label">{title}</div>{zone && <span className="vib-kpi-zone" style={{ color: ZONE_COLORS[zone] || '#111' }}>Zone {zone} ●</span>}</div>);
const Modal: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (<div className="lightbox-overlay" onClick={onClose}><div className="lightbox-content" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '14px', padding: '28px', maxWidth: '600px', textAlign: 'left' }}>{children}</div></div>);
const DatasetSelect: React.FC<{ datasets: any[]; selectedId: number | null; setSelectedId: (id: number | null) => void }> = ({ datasets, selectedId, setSelectedId }) => (<div className="pronostic-source-toggle"><select className="source-dataset-select" value={selectedId || ''} onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : null)}><option value="">-- Dataset vibratoire --</option>{datasets.filter((d: any) => d.status === 'processed' && d.detected_type === 'vibration').map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>);
const SélecteurMachine: React.FC<{ machines: string[]; selected: string | null; onChange: (m: string | null) => void }> = ({ machines, selected, onChange }) => (<select className="source-dataset-select" value={selected || ''} onChange={e => onChange(e.target.value || null)} style={{ width: 'auto' }}><option value="">Toutes machines</option>{machines.map(m => <option key={m} value={m}>{m}</option>)}</select>);

export default AnalyseVibratoire;
