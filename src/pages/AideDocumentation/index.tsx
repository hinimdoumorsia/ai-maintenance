import React, { useState } from 'react';
import { BookOpen, FileText, Library, Compass, Sparkles } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import DocumentationPage from '../Donnees/components/DocumentationPage';
import DocsTechniques from '../Donnees/components/DocsTechniques';
import '../Donnees/donnees.css';
import './aide-documentation.css';

type TabId = 'documentation' | 'docs-tech' | 'guide';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'documentation', label: 'Documentation', icon: FileText },
  { id: 'docs-tech', label: 'Docs techniques PDF', icon: Library },
  { id: 'guide', label: "Guide d'utilisation", icon: Compass },
];

const AideDocumentationPage: React.FC = () => {
  const [tab, setTab] = useState<TabId>('guide');

  return (
    <AppLayout
      title="Aide & Documentation"
      subtitle="Centre de documentation et guide d'utilisation de l'application"
      icon={BookOpen}
    >
      <div className="helpdoc-root">
        <nav className="helpdoc-tabs">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`helpdoc-tab${active ? ' active' : ''}`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="helpdoc-content">
          {tab === 'documentation' && <DocumentationPage />}
          {tab === 'docs-tech' && <DocsTechniques />}

          {tab === 'guide' && (
            <div className="helpdoc-block">
              <h2>Guide complet de l'application</h2>
              <p>
                Vue fonctionnelle de chaque page pour comprendre l'objectif produit, même lorsque certaines
                parties backend ne sont pas finalisées.
              </p>
              <div className="helpdoc-grid">
                <div className="helpdoc-card">
                  <h3>Centre d'aide</h3>
                  <p>
                    Cette page centralise l'aide utilisateur pour toute l'application. Elle couvre les modules
                    déjà connectés au backend et ceux encore orientés frontend/prototype.
                  </p>
                </div>
                <div className="helpdoc-card">
                  <h3>Par où commencer</h3>
                  <ol>
                    <li>Aller dans Données puis ouvrir Chargement.</li>
                    <li>Uploader un dataset CSV/XLSX/ARFF.</li>
                    <li>Attendre la fin du traitement EDA puis lire Synthèse, Prétraitement et Graphiques.</li>
                    <li>Télécharger le rapport PDF et les exports (CSV/JSON/trace).</li>
                  </ol>
                </div>
                <div className="helpdoc-card">
                  <h3>Cas d'usage principal</h3>
                  <p>
                    L'objectif actuel est l'analyse offline de maintenance prédictive et vibratoire, à partir
                    de fichiers chargés manuellement. Le système ne dépend pas de capteurs temps réel.
                  </p>
                </div>
                <div className="helpdoc-card">
                  <h3>Normes et repères</h3>
                  <ul>
                    <li>ISO 10816 / 20816 pour les zones vibratoires.</li>
                    <li>ISO 13374 pour le workflow de surveillance.</li>
                    <li>ISO 13306 / EN 15341 pour les KPI maintenance.</li>
                  </ul>
                </div>
              </div>
              <div className="helpdoc-pages">
                <article>
                  <h3>Tableau de bord</h3>
                  <p>Supervision globale: KPIs, alertes, état du parc et indicateurs synthétiques.</p>
                </article>
                <article>
                  <h3>Données</h3>
                  <p>
                    Cœur du flux actuel: chargement de datasets, EDA, qualité des données, pipeline, analyses
                    vibratoires, documentation métier, export de résultats.
                  </p>
                </article>
                <article>
                  <h3>Prédictions</h3>
                  <p>
                    Objectif frontend: visualiser les prédictions de panne/RUL, comparer scénarios et prioriser
                    les actions maintenance. Certaines briques restent en évolution côté backend.
                  </p>
                </article>
                <article>
                  <h3>Entraînement</h3>
                  <p>
                    Objectif frontend: configurer les jeux de données, lancer les entraînements, suivre les
                    métriques modèles et comparer les runs.
                  </p>
                </article>
                <article>
                  <h3>Modèles</h3>
                  <p>Registre des modèles, versions, performances et statut de déploiement.</p>
                </article>
                <article>
                  <h3>Outils</h3>
                  <p>Boîte à outils opérationnelle: utilitaires data/maintenance et assistants techniques.</p>
                </article>
                <article>
                  <h3>Agents</h3>
                  <p>Orchestration d'agents IA spécialisés pour analyse, diagnostic et recommandations.</p>
                </article>
                <article>
                  <h3>Maintenance</h3>
                  <p>Pilotage des interventions, priorisation des équipements critiques et suivi d'actions.</p>
                </article>
                <article>
                  <h3>Paramètres</h3>
                  <p>Configuration entreprise, parc machines, préférences système et contexte utilisateur.</p>
                </article>
              </div>
              <div className="helpdoc-note">
                <Sparkles size={14} />
                <span>
                  Ce guide décrit la vision fonctionnelle cible, en s'appuyant sur ce qui est visible dans le
                  frontend aujourd'hui.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AideDocumentationPage;
