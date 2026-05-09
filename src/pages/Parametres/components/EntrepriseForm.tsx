// src/pages/Parametres/components/EntrepriseForm.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Building2, Upload, Save, CheckCircle, X } from 'lucide-react';

const DOMAINES = [
  { value: '', label: 'Sélectionner un domaine...' },
  { value: 'petrochimie', label: 'Pétrochimie' },
  { value: 'agroalimentaire', label: 'Agroalimentaire' },
  { value: 'ciment', label: 'Ciment' },
  { value: 'siderurgie', label: 'Sidérurgie' },
  { value: 'automobile', label: 'Automobile' },
  { value: 'pharmaceutique', label: 'Pharmaceutique' },
  { value: 'papeterie', label: 'Papeterie' },
  { value: 'energie', label: 'Énergie' },
  { value: 'textile', label: 'Textile' },
  { value: 'autre', label: 'Autre' },
];

interface EntrepriseData {
  nom: string;
  telephone: string;
  email: string;
  adresse: string;
  domaineIndustriel: string;
  descriptif: string;
  descriptifDocumentName: string;
  logo: string | null;
  logoName: string;
  siteWeb: string;
}

const DEFAULT: EntrepriseData = {
  nom: '',
  telephone: '',
  email: '',
  adresse: '',
  domaineIndustriel: '',
  descriptif: '',
  descriptifDocumentName: '',
  logo: null,
  logoName: '',
  siteWeb: '',
};

const EntrepriseForm: React.FC = () => {
  const [data, setData] = useState<EntrepriseData>(DEFAULT);
  const [saved, setSaved] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const docRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem('aim_entreprise');
    if (raw) {
      try { setData(JSON.parse(raw)); } catch {}
    }
  }, []);

  const set = (key: keyof EntrepriseData, val: string | null) =>
    setData(d => ({ ...d, [key]: val }));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      set('logo', ev.target?.result as string);
      set('logoName', file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) set('descriptifDocumentName', file.name);
  };

  const handleSave = () => {
    localStorage.setItem('aim_entreprise', JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="param-card">
      {/* Header */}
      <div className="param-card-header">
        <div className="param-card-title">
          <div className="param-card-icon">
            <Building2 size={18} />
          </div>
          <div>
            <h2>Informations Entreprise</h2>
            <p>Profil et coordonnées de votre organisation</p>
          </div>
        </div>
        {saved && (
          <div className="param-toast">
            <CheckCircle size={14} />
            Enregistré avec succès
          </div>
        )}
      </div>

      {/* Logo */}
      <div style={{ marginBottom: 20 }}>
        <label className="param-label" style={{ display: 'block', marginBottom: 8 }}>
          Logo de l'entreprise
        </label>
        <div className="logo-upload-wrap">
          <div className="logo-preview" onClick={() => logoRef.current?.click()}>
            {data.logo
              ? <img src={data.logo} alt="logo entreprise" />
              : <Upload size={22} color="#d1d5db" />
            }
          </div>
          <div className="logo-upload-info">
            <button
              className="param-btn-secondary"
              onClick={() => logoRef.current?.click()}
            >
              <Upload size={13} />
              {data.logoName || 'Choisir un fichier image'}
            </button>
            <p>PNG, JPG, SVG — max 2 Mo</p>
            {data.logo && (
              <button
                style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                onClick={() => { set('logo', null); set('logoName', ''); }}
              >
                Supprimer le logo
              </button>
            )}
          </div>
          <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
        </div>
      </div>

      {/* Form fields */}
      <div className="param-form-grid">

        <div className="param-field param-field-full">
          <label className="param-label">Nom de l'entreprise *</label>
          <input
            className="param-input"
            placeholder="Ex : Atlas Industries Maroc"
            value={data.nom}
            onChange={e => set('nom', e.target.value)}
          />
        </div>

        <div className="param-field">
          <label className="param-label">Contact — Téléphone</label>
          <input
            className="param-input"
            placeholder="+212 5XX XXX XXX"
            value={data.telephone}
            onChange={e => set('telephone', e.target.value)}
          />
        </div>

        <div className="param-field">
          <label className="param-label">Contact — E-Mail</label>
          <input
            className="param-input"
            type="email"
            placeholder="contact@entreprise.ma"
            value={data.email}
            onChange={e => set('email', e.target.value)}
          />
        </div>

        <div className="param-field param-field-full">
          <label className="param-label">Adresse de l'usine</label>
          <input
            className="param-input"
            placeholder="Zone industrielle, Ville, Pays"
            value={data.adresse}
            onChange={e => set('adresse', e.target.value)}
          />
        </div>

        <div className="param-field">
          <label className="param-label">Domaine industriel (activité)</label>
          <select
            className="param-select"
            value={data.domaineIndustriel}
            onChange={e => set('domaineIndustriel', e.target.value)}
          >
            {DOMAINES.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div className="param-field">
          <label className="param-label">Site internet</label>
          <input
            className="param-input"
            placeholder="https://www.entreprise.ma"
            value={data.siteWeb}
            onChange={e => set('siteWeb', e.target.value)}
          />
        </div>

        <div className="param-field param-field-full">
          <label className="param-label">
            Descriptif de l'usine
            <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>
              (production, machines impliquées, procédés...)
            </span>
          </label>
          <textarea
            className="param-textarea"
            placeholder="Décrivez ici la production exacte, les types de machines, les procédés industriels, les zones de l'usine..."
            value={data.descriptif}
            onChange={e => set('descriptif', e.target.value)}
            style={{ minHeight: 110 }}
          />
        </div>

        <div className="param-field param-field-full">
          <label className="param-label">
            Document descriptif
            <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>(optionnel)</span>
          </label>
          <label className="file-upload-zone">
            <Upload size={16} color="#9ca3af" />
            <div style={{ flex: 1 }}>
              {data.descriptifDocumentName
                ? <span className="file-name">{data.descriptifDocumentName}</span>
                : <p>Glisser ou cliquer pour importer un PDF, Word, Excel...</p>
              }
            </div>
            {data.descriptifDocumentName && (
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2, display: 'flex' }}
                onClick={e => { e.preventDefault(); set('descriptifDocumentName', ''); }}
              >
                <X size={14} />
              </button>
            )}
            <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleDocChange} />
          </label>
        </div>

      </div>

      <div className="param-form-actions">
        <button className="param-btn-secondary" onClick={() => setData(DEFAULT)}>
          Réinitialiser
        </button>
        <button className="param-btn-primary" onClick={handleSave}>
          <Save size={14} />
          Enregistrer
        </button>
      </div>
    </div>
  );
};

export default EntrepriseForm;
