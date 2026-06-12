// src/pages/Donnees/components/DocsTechniques.tsx
// Bibliothèque de documents techniques PDF extraits
// Nécessite d'avoir lancé : python extract_docs.py

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, BookOpen, ChevronDown, ChevronRight,
  ChevronUp, ExternalLink, FileText, Image as ImageIcon,
  Loader2, Search, Table, Terminal, X,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DocIndex {
  id: string;
  title: string;
  source: string;
  theme: string;
  n_pages: number;
}

interface DocBlock {
  type: 'heading' | 'text' | 'image' | 'table';
  level?: number;
  text?: string;
  src?: string;
  caption?: string;
  headers?: string[];
  rows?: string[][];
}

interface DocPage {
  pageNumber: number;
  blocks: DocBlock[];
}

interface DocContent {
  id: string;
  title: string;
  source: string;
  theme: string;
  pages: DocPage[];
}

interface TocEntry {
  id: string;
  text: string;
  level: number;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const THEME_META: Record<string, { label: string; color: string; icon: string }> = {
  'analyse-vibratoire':       { label: 'Analyse vibratoire',        color: '#7c3aed', icon: '〜' },
  'roulements':               { label: 'Roulements & Défauts',      color: '#dc2626', icon: 'R' },
  'defauts-machines':         { label: 'Défauts machines',          color: '#f97316', icon: 'D' },
  'normes-surveillance':      { label: 'Normes & Surveillance',     color: '#0891b2', icon: 'N' },
  'maintenance-conditionnelle': { label: 'Maintenance conditionnelle', color: '#16a34a', icon: 'M' },
  'organisation-maintenance': { label: 'Organisation maintenance',  color: '#b45309', icon: 'O' },
  'general':                  { label: 'Général',                   color: 'var(--theme-text-muted)', icon: 'G' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const headingId = (text: string, level: number, idx: number): string =>
  `h${level}-${idx}-${text.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)}`;

const scrollToHeading = (id: string): void => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ── Blocs individuels ─────────────────────────────────────────────────────────

const HeadingBlock: React.FC<{ block: DocBlock; id: string }> = ({ block, id }) => {
  const Tag = (`h${Math.min(block.level ?? 2, 6)}`) as keyof JSX.IntrinsicElements;
  return (
    <Tag id={id} className={`dt-heading dt-h${block.level ?? 2}`}>
      {block.text}
    </Tag>
  );
};

const TextBlock: React.FC<{ block: DocBlock }> = ({ block }) => (
  <p className="dt-paragraph">{block.text}</p>
);

const ImageBlock: React.FC<{ block: DocBlock }> = ({ block }) => {
  const [error, setError] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  if (!block.src) return null;
  return (
    <>
      <figure className="dt-figure">
        {error ? (
          <div className="dt-img-error">
            <ImageIcon size={24} color="#9ca3af" />
            <span>Image non disponible</span>
          </div>
        ) : (
          <img
            src={block.src}
            alt={block.caption || ''}
            className="dt-img"
            loading="lazy"
            onError={() => setError(true)}
            onClick={() => setLightbox(true)}
            title="Cliquer pour agrandir"
          />
        )}
        {block.caption && <figcaption className="dt-caption">{block.caption}</figcaption>}
      </figure>

      {lightbox && (
        <div className="dt-lightbox" onClick={() => setLightbox(false)}>
          <button className="dt-lightbox-close" onClick={() => setLightbox(false)}>
            <X size={20} />
          </button>
          <img src={block.src} alt={block.caption || ''} />
        </div>
      )}
    </>
  );
};

const TableBlock: React.FC<{ block: DocBlock }> = ({ block }) => {
  if (!block.headers?.length) return null;
  return (
    <div className="dt-table-wrap">
      <table className="dt-table">
        <thead>
          <tr>{block.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {(block.rows ?? []).map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const BlockRenderer: React.FC<{ block: DocBlock; hIdx: number }> = ({ block, hIdx }) => {
  switch (block.type) {
    case 'heading': return <HeadingBlock block={block} id={headingId(block.text!, block.level!, hIdx)} />;
    case 'text':    return <TextBlock block={block} />;
    case 'image':   return <ImageBlock block={block} />;
    case 'table':   return <TableBlock block={block} />;
    default:        return null;
  }
};

// ── DocsTechniques ────────────────────────────────────────────────────────────

const DocsTechniques: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [index, setIndex] = useState<DocIndex[]>([]);
  const [indexLoading, setIndexLoading] = useState(true);
  const [indexError, setIndexError] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [doc, setDoc] = useState<DocContent | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState('');

  const [search, setSearch] = useState('');
  const [openThemes, setOpenThemes] = useState<Set<string>>(new Set(Object.keys(THEME_META)));
  const [activeTocId, setActiveTocId] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // ── Charger l'index
  useEffect(() => {
    setIndexLoading(true);
    fetch('/docs/data/index.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: DocIndex[]) => {
        setIndex(data);
        // Ouvrir automatiquement le premier thème
        if (data.length > 0) {
          const themes = [...new Set(data.map(d => d.theme))];
          setOpenThemes(new Set(themes));
        }
      })
      .catch(() => setIndexError('index.json introuvable — lancer python extract_docs.py'))
      .finally(() => setIndexLoading(false));
  }, []);

  // ── Charger le document sélectionné
  const loadDoc = useCallback((id: string) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setDoc(null);
    setDocError('');
    setDocLoading(true);
    setActiveTocId('');
    fetch(`/docs/data/${id}.json`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: DocContent) => setDoc(data))
      .catch(() => setDocError('Document non disponible. Relancer extract_docs.py.'))
      .finally(() => setDocLoading(false));
    if (contentRef.current) contentRef.current.scrollTop = 0;
    setShowMobileSidebar(false);
  }, [selectedId]);

  useEffect(() => {
    if (index.length === 0) return;
    const docId = searchParams.get('docId');
    if (docId && index.some(d => d.id === docId)) {
      loadDoc(docId);
    }
  }, [index, searchParams, loadDoc]);

  // ── Table des matières — extraire tous les headings du document chargé
  const toc = useMemo<TocEntry[]>(() => {
    if (!doc) return [];
    const entries: TocEntry[] = [];
    let hIdx = 0;
    for (const page of doc.pages) {
      for (const block of page.blocks) {
        if (block.type === 'heading' && block.text) {
          entries.push({
            id:    headingId(block.text, block.level!, hIdx),
            text:  block.text,
            level: block.level!,
          });
          hIdx++;
        }
      }
    }
    return entries;
  }, [doc]);

  // ── Grouper l'index par thème (filtré par recherche)
  const groupedByTheme = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = index.filter(d =>
      !q || d.title.toLowerCase().includes(q) || d.source.toLowerCase().includes(q)
    );
    const groups: Record<string, DocIndex[]> = {};
    for (const d of filtered) {
      (groups[d.theme] ??= []).push(d);
    }
    return groups;
  }, [index, search]);

  // ── Suivi du titre actif au scroll
  useEffect(() => {
    if (!toc.length) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) setActiveTocId(visible[0].target.id);
      },
      { threshold: 0.4, rootMargin: '-80px 0px 0px 0px' }
    );
    toc.forEach(t => {
      const el = document.getElementById(t.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc]);

  // ── Rendu des pages du document (hIdx global pour les IDs uniques)
  const renderPages = () => {
    if (!doc) return null;
    let hIdx = 0;
    return doc.pages.map(page => (
      <div key={page.pageNumber} className="dt-page">
        <div className="dt-page-sep">
          <span>— page {page.pageNumber} —</span>
        </div>
        {page.blocks.map((block, bi) => {
          const rendered = <BlockRenderer key={bi} block={block} hIdx={hIdx} />;
          if (block.type === 'heading') hIdx++;
          return rendered;
        })}
      </div>
    ));
  };

  // ── État : extraction pas encore effectuée
  if (!indexLoading && indexError) {
    return (
      <div className="dt-root">
        <div className="dt-empty-state">
          <Terminal size={48} color="#f97316" />
          <h3>Extraction PDF requise</h3>
          <p>Le fichier <code>public/docs/data/index.json</code> est introuvable.</p>
          <div className="dt-cmd-block">
            <code>python extract_docs.py</code>
          </div>
          <p className="dt-hint">
            Le script extrait automatiquement tous les PDFs de <code>documentation/</code><br />
            et génère les fichiers JSON + images dans <code>public/docs/</code>.
          </p>
          <div className="dt-deps-block">
            <span>Dépendances requises :</span>
            <code>pip install pymupdf pdfplumber Pillow</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dt-root">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className={`dt-sidebar${showMobileSidebar ? ' dt-sidebar--open' : ''}`}>

        {/* Header sidebar */}
        <div className="dt-sidebar-header">
          <BookOpen size={16} color="#f97316" />
          <span>Bibliothèque technique</span>
          <button className="dt-mobile-close" onClick={() => setShowMobileSidebar(false)}>
            <X size={16} />
          </button>
        </div>

        {/* Recherche */}
        <div className="dt-search-wrap">
          <Search size={13} className="dt-search-icon" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un document…"
            className="dt-search"
          />
          {search && (
            <button className="dt-search-clear" onClick={() => setSearch('')}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Index par thèmes */}
        <nav className="dt-nav">
          {indexLoading ? (
            <div className="dt-sidebar-loading">
              <Loader2 size={16} className="spin" /> Chargement…
            </div>
          ) : Object.keys(groupedByTheme).length === 0 ? (
            <div className="dt-sidebar-empty">Aucun résultat</div>
          ) : (
            Object.entries(groupedByTheme).map(([theme, docs]) => {
              const meta = THEME_META[theme] || THEME_META.general;
              const isOpen = openThemes.has(theme);
              return (
                <div key={theme} className="dt-theme-group">
                  <button
                    className="dt-theme-header"
                    onClick={() => setOpenThemes(prev => {
                      const next = new Set(prev);
                      isOpen ? next.delete(theme) : next.add(theme);
                      return next;
                    })}
                    style={{ borderLeftColor: meta.color }}
                  >
                    <span className="dt-theme-icon">{meta.icon}</span>
                    <span className="dt-theme-label">{meta.label}</span>
                    <span className="dt-theme-count">{docs.length}</span>
                    {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {isOpen && (
                    <ul className="dt-doc-list">
                      {docs.map(d => (
                        <li key={d.id}>
                          <button
                            className={`dt-doc-item${selectedId === d.id ? ' dt-doc-item--active' : ''}`}
                            onClick={() => loadDoc(d.id)}
                          >
                            <FileText size={12} className="dt-doc-icon" />
                            <span className="dt-doc-title">{d.title}</span>
                            <span className="dt-doc-pages">{d.n_pages}p</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </nav>

        {/* Footer sidebar */}
        {index.length > 0 && (
          <div className="dt-sidebar-footer">
            {index.length} document{index.length > 1 ? 's' : ''}
          </div>
        )}
      </aside>

      {/* ── Contenu principal ──────────────────────────────────────────────── */}
      <div className="dt-main">

        {/* Bouton mobile */}
        <button
          className="dt-mobile-menu"
          onClick={() => setShowMobileSidebar(true)}
        >
          <BookOpen size={14} /> Bibliothèque
        </button>

        {/* Pas de document sélectionné */}
        {!selectedId && !docLoading && (
          <div className="dt-welcome">
            <BookOpen size={56} color="#f97316" strokeWidth={1.2} />
            <h2>Bibliothèque de documents techniques</h2>
            <p>
              {index.length > 0
                ? `${index.length} documents extraits depuis vos PDFs. Sélectionnez un document dans la sidebar.`
                : 'Lancez extract_docs.py pour indexer vos PDFs.'}
            </p>
            {index.length > 0 && (
              <div className="dt-welcome-grid">
                {index.slice(0, 6).map(d => {
                  const meta = THEME_META[d.theme] || THEME_META.general;
                  return (
                    <button
                      key={d.id}
                      className="dt-welcome-card"
                      onClick={() => loadDoc(d.id)}
                      style={{ borderTopColor: meta.color }}
                    >
                      <span className="dt-welcome-card-icon">{meta.icon}</span>
                      <span className="dt-welcome-card-title">{d.title}</span>
                      <span className="dt-welcome-card-pages">{d.n_pages} pages</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Chargement document */}
        {docLoading && (
          <div className="dt-doc-loading">
            <Loader2 size={24} className="spin" color="#f97316" />
            <span>Chargement du document…</span>
          </div>
        )}

        {/* Erreur document */}
        {docError && !docLoading && (
          <div className="dt-doc-error">
            <AlertTriangle size={20} color="#dc2626" />
            <span>{docError}</span>
          </div>
        )}

        {/* Document chargé */}
        {doc && !docLoading && (
          <div className="dt-content-layout">

            {/* Zone de lecture */}
            <div className="dt-content" ref={contentRef}>

              {/* En-tête document */}
              <div className="dt-doc-header">
                <div className="dt-doc-header-meta">
                  <span
                    className="dt-doc-theme-badge"
                    style={{ background: (THEME_META[doc.theme] || THEME_META.general).color + '20',
                             color: (THEME_META[doc.theme] || THEME_META.general).color }}
                  >
                    {(THEME_META[doc.theme] || THEME_META.general).label}
                  </span>
                  <span className="dt-doc-pages-badge">{doc.pages.length} pages</span>
                </div>
                <h1 className="dt-doc-title-main">{doc.title}</h1>
                <div className="dt-doc-source">
                  <ExternalLink size={12} />
                  <span>Source : {doc.source}</span>
                </div>
              </div>

              {/* Corps du document */}
              <div className="dt-body">
                {renderPages()}
              </div>
            </div>

            {/* Table des matières flottante */}
            {toc.length > 0 && (
              <aside className="dt-toc">
                <div className="dt-toc-header">Table des matières</div>
                <ul className="dt-toc-list">
                  {toc.map(entry => (
                    <li key={entry.id}>
                      <button
                        className={`dt-toc-item dt-toc-h${entry.level}${activeTocId === entry.id ? ' dt-toc-item--active' : ''}`}
                        onClick={() => scrollToHeading(entry.id)}
                      >
                        <ChevronRight size={10} className="dt-toc-arrow" />
                        {entry.text.length > 55
                          ? entry.text.slice(0, 52) + '…'
                          : entry.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocsTechniques;
