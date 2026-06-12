// src/pages/Donnees/components/DocumentationPage.tsx
// Documentation intégrée — pipeline, indicateurs, formules, normes, seuils utilisés.

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BookOpen, Activity, Calculator, Database, Filter, Gauge,
  GitBranch, Info, Layers, Shield, Workflow,
  CheckCircle2, AlertTriangle, BarChart3, ChevronRight
} from 'lucide-react';

/* ─── Sommaire ───────────────────────────────────────────── */
type SectionId =
  | 'overview' | 'workflow' | 'pipeline-eda' | 'indicators-vib' | 'bearing-freqs'
  | 'iso-10816' | 'defect-detection' | 'quality-score'
  | 'glossary' | 'limits';

interface SectionDef {
  id: SectionId;
  label: string;
  icon: React.ElementType;
}

const SECTIONS: SectionDef[] = [
  { id: 'overview',           label: 'Vue d\'ensemble',                  icon: Info        },
  { id: 'workflow',           label: 'Démarche ISO 13374',               icon: Workflow    },
  { id: 'pipeline-eda',       label: 'Pipeline EDA',                     icon: GitBranch   },
  { id: 'indicators-vib',     label: 'Indicateurs vibratoires',          icon: Activity    },
  { id: 'bearing-freqs',      label: 'Fréquences de roulements',         icon: Calculator  },
  { id: 'iso-10816',          label: 'Norme ISO 10816 / 20816',          icon: Gauge       },
  { id: 'defect-detection',   label: 'Détection automatique de défauts', icon: AlertTriangle },
  { id: 'quality-score',      label: 'Score de qualité dataset',         icon: Shield      },
  { id: 'glossary',           label: 'Glossaire',                        icon: BookOpen    },
  { id: 'limits',             label: 'Limites du système',               icon: Filter      },
];

/* ─── Sous-composants utilitaires ────────────────────────── */
const Formula: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="doc-formula">{children}</div>
);

const Note: React.FC<{ type?: 'info' | 'warn' | 'success'; children: React.ReactNode }> = ({ type = 'info', children }) => (
  <div className={`doc-note doc-note-${type}`}>
    {type === 'info' && <Info size={14} />}
    {type === 'warn' && <AlertTriangle size={14} />}
    {type === 'success' && <CheckCircle2 size={14} />}
    <div>{children}</div>
  </div>
);

const KeyVal: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="doc-keyval">
    <span className="doc-keyval-label">{label}</span>
    <span className="doc-keyval-value">{value}</span>
  </div>
);

/* ─── Composant principal ────────────────────────────────── */
const DocumentationPage: React.FC = () => {
  const [active, setActive] = useState<SectionId>('overview');
  const [search, setSearch] = useState('');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Filtre des sections par recherche
  const filteredSections = useMemo(() => {
    if (!search.trim()) return SECTIONS;
    const q = search.toLowerCase();
    return SECTIONS.filter(s => s.label.toLowerCase().includes(q));
  }, [search]);

  // Scroll vers la section active
  useEffect(() => {
    const el = sectionRefs.current[active];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [active]);

  return (
    <div className="doc-layout">
      {/* ── SOMMAIRE LATÉRAL ── */}
      <aside className="doc-sidebar">
        <div className="doc-sidebar-header">
          <BookOpen size={16} />
          <span>Documentation</span>
        </div>

        <input
          type="text"
          className="doc-search"
          placeholder="Rechercher une section…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <nav className="doc-toc">
          {filteredSections.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                className={`doc-toc-item${active === s.id ? ' active' : ''}`}
                onClick={() => setActive(s.id)}
              >
                <Icon size={13} />
                <span>{s.label}</span>
                {active === s.id && <ChevronRight size={12} />}
              </button>
            );
          })}
        </nav>

        <div className="doc-sidebar-footer">
          <span className="doc-version-tag">v1.0 · Mai 2026</span>
        </div>
      </aside>

      {/* ── CONTENU ── */}
      <main className="doc-content">

        {/* ───────────── VUE D'ENSEMBLE ───────────── */}
        <section
          ref={el => { sectionRefs.current['overview'] = el; }}
          className="doc-section"
          id="overview"
        >
          <h1 className="doc-h1"><Info size={20} /> Vue d'ensemble</h1>
          <p className="doc-lead">
            <strong>AI Maintenance</strong> est une application de maintenance prédictive et d'analyse vibratoire
            pour les machines tournantes industrielles d'<strong>Atlas Industries Maroc</strong>. Elle s'appuie sur les
            normes internationales (ISO 10816, ISO 13374, ISO 18436) et fonctionne en mode <strong>offline,
            basé sur l'upload de fichiers</strong>.
          </p>

          <h2 className="doc-h2">Que fait l'application ?</h2>
          <ul className="doc-bullet">
            <li><strong>Acquisition différée</strong> : ingestion de fichiers CSV/Excel/ARFF préalablement collectés.</li>
            <li><strong>Analyse exploratoire (EDA)</strong> : détection automatique du type de données, statistiques,
              outliers, encodage des variables catégorielles, normalisation adaptative.</li>
            <li><strong>Analyse vibratoire</strong> : suivi V-RMS, classification ISO 10816, détection de défauts de
              roulements (BPFO/BPFI/BSF), spectre FFT, calculateur de fréquences caractéristiques.</li>
            <li><strong>Pronostic & RUL</strong> : modèles de durée de vie résiduelle.</li>
            <li><strong>KPIs maintenance</strong> : MTBF, MTTR, disponibilité, fiabilité.</li>
            <li><strong>Reporting PDF</strong> : génération automatique de rapports d'analyse.</li>
          </ul>

          <Note type="warn">
            <strong>Mode offline uniquement.</strong> L'application <em>n'est pas connectée à des capteurs temps réel</em>.
            Toutes les analyses sont réalisées sur des fichiers de mesures préalablement collectés et chargés via la
            sous-page <em>Chargement</em>.
          </Note>

          <h2 className="doc-h2">Pour qui ?</h2>
          <div className="doc-grid-2">
            <div className="doc-profile-card">
              <Gauge size={18} />
              <h3>Analyste vibration</h3>
              <p>Diagnostic approfondi : spectre FFT, fréquences de roulement, classification ISO,
              détection d'anomalies (BPFO/BPFI/BSF, kurtosis, crest factor).</p>
            </div>
            <div className="doc-profile-card">
              <Database size={18} />
              <h3>Data scientist</h3>
              <p>Pipeline EDA traçable, score qualité, transformations exposées (imputation, scaling adaptatif,
              encoding), export CSV propre prêt pour ML.</p>
            </div>
          </div>
        </section>

        {/* ───────────── DÉMARCHE ISO 13374 ───────────── */}
        <section
          ref={el => { sectionRefs.current['workflow'] = el; }}
          className="doc-section"
          id="workflow"
        >
          <h1 className="doc-h1"><Workflow size={20} /> Démarche normative ISO 13374</h1>
          <p>
            Le flux de surveillance et de diagnostic suit la norme <strong>ISO 13374</strong>, référence
            internationale en surveillance d'état des machines. Le pipeline est structuré en
            <strong> 4 étapes successives</strong> :
          </p>

          <div className="doc-workflow-steps">
            <div className="doc-step-card">
              <span className="doc-step-num">1</span>
              <h3>Acquisition</h3>
              <p>Collecte des données : capteurs, mesures terrain, historique GMAO. Dans notre app : upload
              de fichiers CSV/XLSX.</p>
            </div>
            <ChevronRight size={20} className="doc-step-arrow" />
            <div className="doc-step-card">
              <span className="doc-step-num">2</span>
              <h3>Traitement</h3>
              <p>Nettoyage, imputation des valeurs manquantes, encodage, scaling, calcul des indicateurs
              vibratoires, FFT, statistiques descriptives.</p>
            </div>
            <ChevronRight size={20} className="doc-step-arrow" />
            <div className="doc-step-card">
              <span className="doc-step-num">3</span>
              <h3>Détection</h3>
              <p>Comparaison aux seuils (ISO 10816, seuils internes). Classement en zones A/B/C/D.
              Identification automatique des défauts.</p>
            </div>
            <ChevronRight size={20} className="doc-step-arrow" />
            <div className="doc-step-card">
              <span className="doc-step-num">4</span>
              <h3>Diagnostic</h3>
              <p>Localisation du défaut (palier, engrenage…), nature (balourd, BPFI…), gravité,
              recommandations IA, génération de rapports PDF.</p>
            </div>
          </div>
        </section>

        {/* ───────────── PIPELINE EDA ───────────── */}
        <section
          ref={el => { sectionRefs.current['pipeline-eda'] = el; }}
          className="doc-section"
          id="pipeline-eda"
        >
          <h1 className="doc-h1"><GitBranch size={20} /> Pipeline EDA — Étapes détaillées</h1>
          <p>
            L'agent EDA (basé sur Claude Sonnet 4.6) applique <strong>6 étapes de transformation</strong>
            traçables et reproductibles. Chaque étape est journalisée et visible dans la sous-page
            <em>Chargement → Prétraitement</em>.
          </p>

          <table className="doc-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Étape</th>
                <th>Rôle</th>
                <th>Méthode</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Suppression des doublons</td>
                <td>Évite les biais statistiques</td>
                <td><code>pandas.drop_duplicates()</code></td>
              </tr>
              <tr>
                <td>2</td>
                <td>Élimination des colonnes constantes</td>
                <td>Retire les variables sans information (variance nulle)</td>
                <td><code>nunique() == 1</code></td>
              </tr>
              <tr>
                <td>3</td>
                <td>Parsing des colonnes datetime</td>
                <td>Détection automatique des formats temporels</td>
                <td><code>pd.to_datetime(errors=&apos;coerce&apos;)</code></td>
              </tr>
              <tr>
                <td>4</td>
                <td>Imputation des valeurs manquantes</td>
                <td>
                  <strong>Numérique :</strong> médiane (robuste aux outliers)<br/>
                  <strong>Catégoriel :</strong> mode (valeur la plus fréquente)
                </td>
                <td><code>fillna(median/mode)</code></td>
              </tr>
              <tr>
                <td>5</td>
                <td>Encodage des catégorielles</td>
                <td>
                  <strong>Cardinalité ≤ 10 :</strong> One-Hot Encoding<br/>
                  <strong>Cardinalité &gt; 10 :</strong> Label Encoding
                </td>
                <td><code>get_dummies / LabelEncoder</code></td>
              </tr>
              <tr>
                <td>6</td>
                <td>
                  <strong>Scaling adaptatif</strong>
                  <span className="doc-pill">unique</span>
                </td>
                <td>
                  <strong>Outliers IQR &gt; 10 % :</strong> RobustScaler — résistant aux valeurs extrêmes<br/>
                  <strong>Sinon :</strong> StandardScaler — normalisation classique (μ=0, σ=1)
                </td>
                <td>
                  <code>(x − médiane) / IQR</code><br/>
                  ou <code>(x − μ) / σ</code>
                </td>
              </tr>
            </tbody>
          </table>

          <Note type="success">
            Le <strong>scaling adaptatif</strong> est une amélioration par rapport à un pipeline ML standard.
            Il évite les distorsions liées aux outliers, fréquents en données vibratoires (chocs, événements
            transitoires).
          </Note>
        </section>

        {/* ───────────── INDICATEURS VIBRATOIRES ───────────── */}
        <section
          ref={el => { sectionRefs.current['indicators-vib'] = el; }}
          className="doc-section"
          id="indicators-vib"
        >
          <h1 className="doc-h1"><Activity size={20} /> Indicateurs vibratoires temporels</h1>
          <p>
            Les indicateurs scalaires (calculés sur le signal temporel ou les agrégats CSV) permettent une
            <strong> surveillance rapide</strong> de l'état de santé d'un équipement avant analyse spectrale.
          </p>

          {/* V-RMS */}
          <div className="doc-indicator-card">
            <h3><Gauge size={16} color="#3b82f6" /> V-RMS — Vitesse efficace de vibration</h3>
            <Formula>
              V<sub>RMS</sub> = √( (1/N) · Σ v<sub>i</sub>² )  &nbsp; [mm/s]
            </Formula>
            <p>
              Mesure l'<strong>énergie vibratoire moyenne</strong>. Indicateur de référence pour la norme ISO
              10816. Ses seuils dépendent de la classe machine.
            </p>
            <KeyVal label="Bande de fréquence typique" value="10 Hz – 1 kHz" />
            <KeyVal label="Défauts détectés" value="Balourd, désalignement, déformation rotor" />
          </div>

          {/* Crest Factor */}
          <div className="doc-indicator-card">
            <h3><Activity size={16} color="#f97316" /> Crest Factor (CF) — Facteur de crête</h3>
            <Formula>
              CF = V<sub>peak</sub> / V<sub>RMS</sub>  &nbsp; [sans unité]
            </Formula>
            <p>
              Rapport entre la valeur crête et la valeur efficace. Détecte les <strong>chocs et impulsions</strong>
              (typiques des défauts de roulements naissants).
            </p>
            <KeyVal label="Seuil normal" value="< 3 (signal sinusoïdal pur ≈ 1.41)" />
            <KeyVal label="Seuil alerte (utilisé)" value="≥ 5 (chocs détectés)" />
            <KeyVal label="Seuil critique" value="≥ 6 (défauts répétitifs sévères)" />
          </div>

          {/* Kurtosis */}
          <div className="doc-indicator-card">
            <h3><BarChart3 size={16} color="#7c3aed" /> Kurtosis — Aplatissement de la distribution</h3>
            <Formula>
              κ = (1/N · Σ (v<sub>i</sub> − μ)<sup>4</sup>) / σ<sup>4</sup>  &nbsp; [sans unité]
            </Formula>
            <p>
              Mesure la <strong>présence de chocs impulsionnels</strong>. Plus sensible que le CF pour les défauts
              naissants. Référence : κ = 3 pour un signal gaussien (sinusoïdal de bruit blanc).
            </p>
            <table className="doc-mini-table">
              <thead><tr><th>Valeur</th><th>État</th><th>Interprétation</th></tr></thead>
              <tbody>
                <tr><td>κ &lt; 3</td><td className="doc-status-ok">Normal</td><td>Distribution gaussienne — pas de chocs</td></tr>
                <tr><td>3 ≤ κ &lt; 6</td><td className="doc-status-warn">Attention</td><td>Début de dégradation</td></tr>
                <tr><td>6 ≤ κ &lt; 10</td><td className="doc-status-alert">Alerte</td><td>Défaut probable — inspection</td></tr>
                <tr><td>κ ≥ 10</td><td className="doc-status-critical">Critique</td><td>Défaut avancé — remplacement urgent</td></tr>
              </tbody>
            </table>
          </div>

          {/* Skewness */}
          <div className="doc-indicator-card">
            <h3><Layers size={16} color="#0891b2" /> Skewness — Asymétrie de la distribution</h3>
            <Formula>
              γ = (1/N · Σ (v<sub>i</sub> − μ)<sup>3</sup>) / σ<sup>3</sup>  &nbsp; [sans unité]
            </Formula>
            <p>
              Mesure l'<strong>asymétrie</strong> : positif si la distribution penche vers la droite (queue
              à droite), négatif inverse. Utilisé pour <strong>détecter des biais</strong> dans les données et
              choisir le scaler adapté.
            </p>
            <KeyVal label="|γ| < 1" value="Distribution symétrique (gaussienne)" />
            <KeyVal label="1 ≤ |γ| ≤ 2" value="Asymétrie modérée" />
            <KeyVal label="|γ| > 2" value="Distribution très asymétrique" />
          </div>

          {/* Indicateurs étendus */}
          <h2 className="doc-h2" style={{ marginTop: 24 }}>Indicateurs étendus (référence)</h2>
          <table className="doc-table">
            <thead>
              <tr><th>Indicateur</th><th>Formule</th><th>Usage</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Shape Factor</strong></td>
                <td><code>RMS / |moyenne|</code></td>
                <td>Caractérise la forme du signal</td>
              </tr>
              <tr>
                <td><strong>Impulse Factor</strong></td>
                <td><code>peak / |moyenne|</code></td>
                <td>Sensibilité accrue aux impulsions ponctuelles</td>
              </tr>
              <tr>
                <td><strong>Smax</strong> (paliers lisses)</td>
                <td><code>√(X² + Y²) max</code></td>
                <td>Déplacement crête à crête du centre du rotor</td>
              </tr>
              <tr>
                <td><strong>Accélération RMS</strong></td>
                <td><code>√(Σ a²/N)</code></td>
                <td>Énergie HF — défauts de roulement</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ───────────── FRÉQUENCES DE ROULEMENTS ───────────── */}
        <section
          ref={el => { sectionRefs.current['bearing-freqs'] = el; }}
          className="doc-section"
          id="bearing-freqs"
        >
          <h1 className="doc-h1"><Calculator size={20} /> Fréquences caractéristiques des roulements</h1>
          <p>
            Chaque type de défaut de roulement génère une <strong>fréquence de choc répétitive</strong>,
            calculable à partir de la géométrie du roulement. Ces fréquences sont les <em>signatures spectrales</em>
            permettant d'identifier la nature exacte du défaut.
          </p>

          <h2 className="doc-h2">Paramètres géométriques</h2>
          <table className="doc-table">
            <thead><tr><th>Symbole</th><th>Description</th><th>Unité</th></tr></thead>
            <tbody>
              <tr><td><code>N</code></td><td>Nombre d'éléments roulants (billes ou rouleaux)</td><td>—</td></tr>
              <tr><td><code>f<sub>r</sub></code></td><td>Fréquence de rotation (= RPM / 60)</td><td>Hz</td></tr>
              <tr><td><code>d</code></td><td>Diamètre des éléments roulants</td><td>mm</td></tr>
              <tr><td><code>D</code></td><td>Diamètre primitif (moyen de la piste)</td><td>mm</td></tr>
              <tr><td><code>α</code></td><td>Angle de contact (typiquement 0° pour roulements radiaux)</td><td>°</td></tr>
            </tbody>
          </table>

          <h2 className="doc-h2">Formules ISO 18436-3</h2>
          <div className="doc-formula-grid">
            <div className="doc-formula-card" style={{ borderColor: '#f97316' }}>
              <h4 style={{ color: '#f97316' }}>BPFO — Bague extérieure</h4>
              <Formula>BPFO = (N/2) · f<sub>r</sub> · (1 − (d/D)·cosα)</Formula>
              <p>Pic spectral lorsqu'une bille passe sur un défaut de la <strong>piste extérieure</strong>.</p>
            </div>
            <div className="doc-formula-card" style={{ borderColor: '#dc2626' }}>
              <h4 style={{ color: '#dc2626' }}>BPFI — Bague intérieure</h4>
              <Formula>BPFI = (N/2) · f<sub>r</sub> · (1 + (d/D)·cosα)</Formula>
              <p>Pic spectral lorsqu'une bille passe sur un défaut de la <strong>piste intérieure</strong>.</p>
            </div>
            <div className="doc-formula-card" style={{ borderColor: '#7c3aed' }}>
              <h4 style={{ color: '#7c3aed' }}>BSF — Défaut de bille</h4>
              <Formula>BSF = (D/2d) · f<sub>r</sub> · (1 − ((d/D)·cosα)²)</Formula>
              <p>Pic spectral lié à la <strong>rotation propre d'une bille</strong> défectueuse.</p>
            </div>
            <div className="doc-formula-card" style={{ borderColor: '#0891b2' }}>
              <h4 style={{ color: '#0891b2' }}>FTF — Cage</h4>
              <Formula>FTF = (f<sub>r</sub>/2) · (1 − (d/D)·cosα)</Formula>
              <p>Fréquence de rotation de la <strong>cage</strong>. Pic faible mais signature de défaut de cage.</p>
            </div>
          </div>

          <Note type="info">
            <strong>Calculateur intégré disponible</strong> dans la sous-page <em>Analyse vibratoire</em>.
            Saisissez la géométrie du roulement ou choisissez une référence (6205, 6306, 22218…) dans le
            mini-catalogue de roulements pour obtenir les fréquences automatiquement.
          </Note>

          <h2 className="doc-h2">Exemple numérique — Roulement SKF 6205 à 1500 rpm</h2>
          <table className="doc-table">
            <thead><tr><th>Paramètre</th><th>Valeur</th></tr></thead>
            <tbody>
              <tr><td>f<sub>r</sub> (rotation)</td><td><code>25.00 Hz</code></td></tr>
              <tr><td>BPFO</td><td><code>89.6 Hz</code> (3.58 × f<sub>r</sub>)</td></tr>
              <tr><td>BPFI</td><td><code>135.4 Hz</code> (5.42 × f<sub>r</sub>)</td></tr>
              <tr><td>BSF</td><td><code>57.6 Hz</code> (2.30 × f<sub>r</sub>)</td></tr>
              <tr><td>FTF</td><td><code>9.96 Hz</code> (0.40 × f<sub>r</sub>)</td></tr>
            </tbody>
          </table>
        </section>

        {/* ───────────── ISO 10816 / 20816 ───────────── */}
        <section
          ref={el => { sectionRefs.current['iso-10816'] = el; }}
          className="doc-section"
          id="iso-10816"
        >
          <h1 className="doc-h1"><Gauge size={20} /> Norme ISO 10816 / 20816 — Sévérité vibratoire</h1>
          <p>
            La norme <strong>ISO 10816</strong> (remplacée par <strong>ISO 20816</strong>) définit les seuils
            d'acceptabilité de la vitesse efficace V-RMS pour les machines tournantes. Les machines sont classées
            en <strong>4 catégories</strong> selon leur puissance et leur fondation.
          </p>

          <h2 className="doc-h2">Classes de machines</h2>
          <table className="doc-table">
            <thead>
              <tr>
                <th>Classe</th>
                <th>Description</th>
                <th>Exemples</th>
                <th>Zone A &lt;</th>
                <th>Zone B &lt;</th>
                <th>Zone C &lt;</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>I</strong></td>
                <td>Petites machines (&lt; 15 kW)</td>
                <td>Pompes ménagères, ventilateurs muraux</td>
                <td className="doc-iso-a"><strong>0.71</strong></td>
                <td className="doc-iso-b"><strong>1.80</strong></td>
                <td className="doc-iso-c"><strong>4.50</strong></td>
              </tr>
              <tr>
                <td><strong>II</strong></td>
                <td>Machines moyennes (15 à 75 kW)</td>
                <td>Moteurs industriels standards, pompes process</td>
                <td className="doc-iso-a"><strong>1.12</strong></td>
                <td className="doc-iso-b"><strong>2.80</strong></td>
                <td className="doc-iso-c"><strong>7.10</strong></td>
              </tr>
              <tr>
                <td><strong>III</strong></td>
                <td>Grandes machines, fondation rigide (&gt; 75 kW)</td>
                <td>Compresseurs centrifuges, alternateurs</td>
                <td className="doc-iso-a"><strong>2.30</strong></td>
                <td className="doc-iso-b"><strong>4.50</strong></td>
                <td className="doc-iso-c"><strong>7.10</strong></td>
              </tr>
              <tr>
                <td><strong>IV</strong></td>
                <td>Grandes machines, fondation souple (&gt; 75 kW)</td>
                <td>Turbines, machines à arbre flexible</td>
                <td className="doc-iso-a"><strong>2.80</strong></td>
                <td className="doc-iso-b"><strong>7.10</strong></td>
                <td className="doc-iso-c"><strong>11.20</strong></td>
              </tr>
            </tbody>
          </table>

          <h2 className="doc-h2">Zones de sévérité (V-RMS en mm/s)</h2>
          <div className="doc-zone-grid">
            <div className="doc-zone-card" style={{ background: '#dcfce7', borderColor: '#16a34a' }}>
              <strong>Zone A — Vert</strong>
              <p>Machines neuves ou récemment réceptionnées. <em>Excellent état</em>.</p>
            </div>
            <div className="doc-zone-card" style={{ background: '#fef9c3', borderColor: '#eab308' }}>
              <strong>Zone B — Jaune</strong>
              <p>Machines aptes à fonctionner sur le long terme. <em>Acceptable</em>.</p>
            </div>
            <div className="doc-zone-card" style={{ background: '#ffedd5', borderColor: '#f97316' }}>
              <strong>Zone C — Orange</strong>
              <p>Surveillance renforcée. Planifier intervention. <em>Non admissible long terme</em>.</p>
            </div>
            <div className="doc-zone-card" style={{ background: '#fee2e2', borderColor: '#dc2626' }}>
              <strong>Zone D — Rouge</strong>
              <p>Risque de dommage à court terme. <em>Arrêt immédiat recommandé</em>.</p>
            </div>
          </div>

          <Note type="info">
            <strong>Détermination automatique de la classe :</strong> à partir de la colonne <code>puissance_kw</code>
            du dataset, l'application classe automatiquement chaque machine. À défaut, un assistant interactif
            (formulaire ?) vous guide via 2 questions (puissance + type de fondation).
          </Note>
        </section>

        {/* ───────────── DÉTECTION DÉFAUTS ───────────── */}
        <section
          ref={el => { sectionRefs.current['defect-detection'] = el; }}
          className="doc-section"
          id="defect-detection"
        >
          <h1 className="doc-h1"><AlertTriangle size={20} /> Détection automatique de défauts</h1>
          <p>
            L'application implémente une <strong>grille de détection de défauts</strong> sous forme de matrice
            machines × types de défauts. Pour chaque machine, les indicateurs sont comparés à des seuils
            pré-définis qui déclenchent l'affichage d'un défaut probable.
          </p>

          <h2 className="doc-h2">Seuils utilisés dans l'application</h2>
          <table className="doc-table">
            <thead>
              <tr>
                <th>Indicateur</th>
                <th>Seuil alerte</th>
                <th>Seuil critique</th>
                <th>Défaut détecté</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Amplitude BPFO</strong></td>
                <td className="doc-status-warn">&gt; 0.10 g</td>
                <td className="doc-status-critical">&gt; 0.15 g</td>
                <td>Défaut bague externe</td>
              </tr>
              <tr>
                <td><strong>Amplitude BPFI</strong></td>
                <td className="doc-status-warn">&gt; 0.10 g</td>
                <td className="doc-status-critical">&gt; 0.15 g</td>
                <td>Défaut bague interne</td>
              </tr>
              <tr>
                <td><strong>Amplitude BSF</strong></td>
                <td className="doc-status-warn">&gt; 0.08 g</td>
                <td className="doc-status-critical">&gt; 0.12 g</td>
                <td>Défaut bille</td>
              </tr>
              <tr>
                <td><strong>V-RMS @ 1× F₀</strong></td>
                <td className="doc-status-warn">&gt; 3.0 mm/s</td>
                <td className="doc-status-critical">&gt; 4.5 mm/s</td>
                <td>Balourd / Désalignement</td>
              </tr>
              <tr>
                <td><strong>Kurtosis</strong></td>
                <td className="doc-status-warn">&gt; 6</td>
                <td className="doc-status-critical">&gt; 10</td>
                <td>Chocs impulsionnels</td>
              </tr>
              <tr>
                <td><strong>Crest Factor</strong></td>
                <td className="doc-status-warn">&gt; 5</td>
                <td className="doc-status-critical">&gt; 6</td>
                <td>Impacts répétitifs</td>
              </tr>
            </tbody>
          </table>

          <h2 className="doc-h2">Logique de classification (combinée)</h2>
          <ul className="doc-bullet">
            <li>
              Si <code>BPFI &gt; 0.15g</code> → <strong>Défaut bague interne</strong> (confiance ∝ amplitude/0.30).
            </li>
            <li>
              Si <code>BPFO &gt; 0.15g</code> → <strong>Défaut bague externe</strong> (confiance ∝ amplitude/0.30).
            </li>
            <li>
              Si <code>BSF &gt; 0.12g</code> → <strong>Défaut bille</strong> (confiance ∝ amplitude/0.25).
            </li>
            <li>
              Si <code>V-RMS &gt; 4.5 mm/s</code> ET <code>kurt &lt; 3.5</code> ET <code>CF &gt; 4</code>
              → <strong>Désalignement probable</strong> (confiance 75%).
            </li>
            <li>
              Si <code>V-RMS &gt; 3 mm/s</code> sans autres signatures → <strong>Balourd léger</strong>
              (confiance 60%).
            </li>
          </ul>

          <Note type="warn">
            Ces seuils sont des <strong>valeurs de référence indicatives</strong>, à ajuster selon le contexte
            machine. Chaque équipement peut nécessiter une adaptation spécifique en fonction de son historique
            et de ses conditions de fonctionnement.
          </Note>
        </section>

        {/* ───────────── SCORE QUALITÉ ───────────── */}
        <section
          ref={el => { sectionRefs.current['quality-score'] = el; }}
          className="doc-section"
          id="quality-score"
        >
          <h1 className="doc-h1"><Shield size={20} /> Score de qualité dataset</h1>
          <p>
            À l'issue de l'EDA, l'application calcule un <strong>score de qualité 0–100</strong> basé sur
            quatre critères pondérés. Visible dans la sous-page <em>Chargement</em> au-dessus du détail des
            colonnes.
          </p>

          <Formula>
            score = 100 − pénalité(manquants) − pénalité(doublons) − pénalité(outliers) − pénalité(asymétrie)
          </Formula>

          <table className="doc-table">
            <thead>
              <tr><th>Critère</th><th>Calcul</th><th>Pénalité max</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Valeurs manquantes</td>
                <td><code>missing_pct × 3</code></td>
                <td>30 points</td>
              </tr>
              <tr>
                <td>Doublons</td>
                <td><code>(duplicates / n_rows) × 100 × 2</code></td>
                <td>10 points</td>
              </tr>
              <tr>
                <td>Outliers IQR (moyenne sur colonnes numériques)</td>
                <td><code>moyenne(outlier_pct) × 2</code></td>
                <td>30 points</td>
              </tr>
              <tr>
                <td>Asymétrie forte (|skewness| &gt; 2)</td>
                <td><code>ratio_high_skew × 20</code></td>
                <td>10 points</td>
              </tr>
            </tbody>
          </table>

          <h2 className="doc-h2">Interprétation</h2>
          <div className="doc-score-grid">
            <div className="doc-score-card" style={{ borderColor: '#16a34a' }}>
              <span className="doc-score-num" style={{ color: '#16a34a' }}>≥ 85</span>
              <strong>Excellent</strong>
              <p>Dataset propre, prêt pour ML sans précaution particulière.</p>
            </div>
            <div className="doc-score-card" style={{ borderColor: '#65a30d' }}>
              <span className="doc-score-num" style={{ color: '#65a30d' }}>70–84</span>
              <strong>Bon</strong>
              <p>Quelques imperfections mineures. Pipeline EDA suffit.</p>
            </div>
            <div className="doc-score-card" style={{ borderColor: '#f97316' }}>
              <span className="doc-score-num" style={{ color: '#f97316' }}>50–69</span>
              <strong>Acceptable</strong>
              <p>À auditer manuellement. Outliers ou manquants non négligeables.</p>
            </div>
            <div className="doc-score-card" style={{ borderColor: '#dc2626' }}>
              <span className="doc-score-num" style={{ color: '#dc2626' }}>&lt; 50</span>
              <strong>Insuffisant</strong>
              <p>Données dégradées. Vérifier la collecte avant ML.</p>
            </div>
          </div>

          <h2 className="doc-h2">Détection des outliers (méthode IQR)</h2>
          <p>
            La méthode IQR (Interquartile Range), <strong>robuste aux extrêmes</strong>, est utilisée pour
            détecter les outliers et adapter automatiquement le scaler (StandardScaler vs RobustScaler).
          </p>
          <Formula>
            outlier  ⟺  x &lt; Q1 − 1.5·IQR  ou  x &gt; Q3 + 1.5·IQR  &nbsp; avec IQR = Q3 − Q1
          </Formula>
        </section>

        {/* ───────────── GLOSSAIRE ───────────── */}
        <section
          ref={el => { sectionRefs.current['glossary'] = el; }}
          className="doc-section"
          id="glossary"
        >
          <h1 className="doc-h1"><BookOpen size={20} /> Glossaire</h1>
          <table className="doc-table doc-glossary">
            <tbody>
              <tr><td><strong>BPFO</strong></td><td><em>Ball Pass Frequency Outer race</em> — Fréquence de passage des billes sur la bague extérieure.</td></tr>
              <tr><td><strong>BPFI</strong></td><td><em>Ball Pass Frequency Inner race</em> — Fréquence de passage des billes sur la bague intérieure.</td></tr>
              <tr><td><strong>BSF</strong></td><td><em>Ball Spin Frequency</em> — Fréquence de rotation propre d'une bille.</td></tr>
              <tr><td><strong>FTF</strong></td><td><em>Fundamental Train Frequency</em> — Fréquence de rotation de la cage du roulement.</td></tr>
              <tr><td><strong>EDA</strong></td><td><em>Exploratory Data Analysis</em> — Analyse exploratoire des données : statistiques descriptives, détection d'anomalies, transformations.</td></tr>
              <tr><td><strong>FFT</strong></td><td><em>Fast Fourier Transform</em> — Transformée rapide de Fourier, conversion d'un signal temporel en spectre fréquentiel.</td></tr>
              <tr><td><strong>IQR</strong></td><td><em>Interquartile Range</em> — Étendue interquartile (Q3 − Q1), mesure de dispersion robuste.</td></tr>
              <tr><td><strong>ISO 10816 / 20816</strong></td><td>Norme internationale de mesure et d'évaluation de la sévérité vibratoire des machines tournantes.</td></tr>
              <tr><td><strong>ISO 13374</strong></td><td>Norme définissant le flux de surveillance et de diagnostic en 4 étapes (acquisition, traitement, détection, diagnostic).</td></tr>
              <tr><td><strong>ISO 18436</strong></td><td>Norme de qualification des analystes vibration et formules de calcul des fréquences caractéristiques de roulement.</td></tr>
              <tr><td><strong>RMS</strong></td><td><em>Root Mean Square</em> — Valeur efficace, racine carrée de la moyenne des carrés.</td></tr>
              <tr><td><strong>RobustScaler</strong></td><td>Normalisation robuste : (x − médiane) / IQR, insensible aux outliers.</td></tr>
              <tr><td><strong>RUL</strong></td><td><em>Remaining Useful Life</em> — Durée de vie résiduelle estimée d'un équipement.</td></tr>
              <tr><td><strong>StandardScaler</strong></td><td>Normalisation classique : (x − μ) / σ, sensible aux outliers.</td></tr>
              <tr><td><strong>V-RMS</strong></td><td>Vitesse efficace de vibration en mm/s, indicateur de référence ISO 10816.</td></tr>
            </tbody>
          </table>
        </section>

        {/* ───────────── LIMITES ───────────── */}
        <section
          ref={el => { sectionRefs.current['limits'] = el; }}
          className="doc-section"
          id="limits"
        >
          <h1 className="doc-h1"><Filter size={20} /> Limites du système</h1>

          <Note type="warn">
            Dans le contexte de ce projet académique pour Atlas Industries Maroc, l'application est volontairement
            <strong> contrainte à un usage offline</strong>. Les limitations suivantes ne seront pas levées sur ce
            périmètre.
          </Note>

          <h2 className="doc-h2">Acquisition de données</h2>
          <ul className="doc-bullet">
            <li>Pas de connexion à des capteurs IoT temps réel.</li>
            <li>Pas d'intégration avec des collecteurs portables ou systèmes online (MVX, MVP, EAGLE…).</li>
            <li>Pas d'OPC client/serveur, pas de SCADA, pas de GMAO direct.</li>
            <li>Toutes les données proviennent de fichiers CSV/Excel/ARFF chargés manuellement.</li>
          </ul>

          <h2 className="doc-h2">Analyse vibratoire</h2>
          <ul className="doc-bullet">
            <li>Le spectre FFT est <strong>simulé</strong> à partir des amplitudes BPFO/BPFI/BSF présentes dans le
              dataset (pas de calcul depuis un signal temporel échantillonné).</li>
            <li>Pas d'analyse d'enveloppe (Hilbert) — nécessiterait des signaux bruts à haute fréquence
              d'échantillonnage (≥ 20 kHz).</li>
            <li>Pas de cascade waterfall 3D ni de Bode/Nyquist (analyse transitoire absente).</li>
            <li>Pas de mesure de phase (pas de top tour).</li>
            <li>Pas d'analyse électrique (ESA — courant moteur).</li>
          </ul>

          <h2 className="doc-h2">Recommandations IA</h2>
          <ul className="doc-bullet">
            <li>Nécessite une <strong>clé API Claude</strong> valide (variable <code>ANTHROPIC_API_KEY</code>
              dans le fichier <code>.env</code>).</li>
            <li>En cas d'absence de la clé, l'application fonctionne mais sans narratifs IA.</li>
          </ul>

          <h2 className="doc-h2">Périmètre de surveillance</h2>
          <ul className="doc-bullet">
            <li>Focus sur les machines tournantes courantes (pompes, ventilateurs, compresseurs, moteurs).</li>
            <li>Pas de spécialisation pour paliers lisses (orbite, Smax dynamique).</li>
            <li>Pas de surveillance des engrenages avancée (cepstre, GMF complets).</li>
          </ul>
        </section>

        {/* ── Footer ── */}
        <footer className="doc-footer">
          <p>
            <em>Documentation AI Maintenance — Atlas Industries Maroc — Mai 2026</em>
          </p>
          <p>
            Références normatives : ISO 10816, ISO 13374, ISO 18436-3.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default DocumentationPage;
