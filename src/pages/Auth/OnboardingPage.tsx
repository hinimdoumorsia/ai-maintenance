// src/pages/Auth/OnboardingPage.tsx
// Wizard d'onboarding — configuration entreprise + machines après inscription

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Cpu, ChevronLeft, ChevronRight, Check, Plus, X, Upload } from 'lucide-react';
import './auth.css';

const API = 'http://localhost:8000';

const DOMAINES = [
  { value: 'petrochimie', label: 'Pétrochimie' },
  { value: 'agroalimentaire', label: 'Agroalimentaire' },
  { value: 'ciment', label: 'Cimenterie' },
  { value: 'siderurgie', label: 'Sidérurgie' },
  { value: 'automobile', label: 'Automobile' },
  { value: 'pharmaceutique', label: 'Pharmaceutique' },
  { value: 'papeterie', label: 'Papeterie' },
  { value: 'energie', label: 'Énergie' },
  { value: 'textile', label: 'Textile' },
  { value: 'autre', label: 'Autre' },
];

const TYPES_MACHINE = [
  'pompe_centrifuge','compresseur','ventilateur','moteur_electrique',
  'reducteur','turbine','broyeur','agitateur','autre',
];

const TYPES_CAPTEUR = [
  'accelerometre','sonde_proximite','velocimetre','thermique','ultrason','courant',
];

interface MachineForm {
  nom: string;
  type: string;
  role: string;
  puissance_kw: string;
  vitesse_rpm: string;
  capteurs: { type: string; position: string; mesure: string }[];
}

const emptyMachine = (): MachineForm => ({
  nom: '', type: 'pompe_centrifuge', role: '', puissance_kw: '', vitesse_rpm: '',
  capteurs: [{ type: 'accelerometre', position: '', mesure: 'mm/s' }],
});

const STEPS = [
  { num: 1, label: 'Entreprise' },
  { num: 2, label: 'Activité' },
  { num: 3, label: 'Machines' },
  { num: 4, label: 'Récapitulatif' },
];

const OnboardingPage: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 — Entreprise
  const [entreprise, setEntreprise] = useState({
    nom: '', telephone: '', email: '', adresse: '', ville: '', pays: 'Maroc', code_postal: '', site_web: '',
  });

  // Step 2 — Activité
  const [activite, setActivite] = useState({
    domaine: 'agroalimentaire', descriptif: '', production: '',
  });

  // Step 3 — Machines
  const [machines, setMachines] = useState<MachineForm[]>([emptyMachine()]);

  const updateEntreprise = (k: string, v: string) => setEntreprise(p => ({ ...p, [k]: v }));
  const updateActivite = (k: string, v: string) => setActivite(p => ({ ...p, [k]: v }));

  const updateMachine = (i: number, k: string, v: string) => {
    setMachines(prev => prev.map((m, idx) => idx === i ? { ...m, [k]: v } : m));
  };

  const addMachine = () => setMachines(prev => [...prev, emptyMachine()]);

  const removeMachine = (i: number) => {
    if (machines.length > 1) setMachines(prev => prev.filter((_, idx) => idx !== i));
  };

  const addCapteur = (mi: number) => {
    setMachines(prev => prev.map((m, i) =>
      i === mi ? { ...m, capteurs: [...m.capteurs, { type: 'accelerometre', position: '', mesure: 'mm/s' }] } : m
    ));
  };

  const removeCapteur = (mi: number, ci: number) => {
    setMachines(prev => prev.map((m, i) =>
      i === mi ? { ...m, capteurs: m.capteurs.filter((_, j) => j !== ci) } : m
    ));
  };

  const updateCapteur = (mi: number, ci: number, k: string, v: string) => {
    setMachines(prev => prev.map((m, i) =>
      i === mi ? { ...m, capteurs: m.capteurs.map((c, j) => j === ci ? { ...c, [k]: v } : c) } : m
    ));
  };

  const canNext = () => {
    if (step === 1) return entreprise.nom.trim().length > 0;
    if (step === 2) return true;
    if (step === 3) return machines.some(m => m.nom.trim().length > 0);
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/api/auth/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          entreprise: { ...entreprise, ...activite },
          machines: machines.filter(m => m.nom.trim()),
        }),
      });
    } catch { /* continue even if backend unreachable */ }
    completeOnboarding();
    setSaving(false);
  };

  return (
    <div className="onb-page">
      {/* ── Top Bar ── */}
      <div className="onb-topbar">
        <div className="onb-logo">
          <div className="onb-logo-icon"><Cpu size={18} /></div>
          <span className="onb-logo-text">AI MAINTENANCE</span>
        </div>
        <button className="onb-skip" onClick={() => { completeOnboarding(); }}>
          Passer cette étape →
        </button>
      </div>

      {/* ── Progress Steps ── */}
      <div className="onb-progress">
        <div className="onb-steps">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className={`onb-step ${step === s.num ? 'active' : ''} ${step > s.num ? 'done' : ''}`}>
                <div className="onb-step-dot">
                  {step > s.num ? <Check size={14} /> : s.num}
                </div>
                <span className="onb-step-label">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`onb-step-line ${step > s.num ? 'done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="onb-content">
        <div className="onb-card">

          {/* STEP 1 — Entreprise */}
          {step === 1 && (
            <>
              <div className="onb-card-header">
                <h2>Informations sur votre <span>entreprise</span></h2>
                <p>Ces informations nous aident à personnaliser votre expérience de maintenance prédictive.</p>
              </div>
              <div className="onb-form">
                <div className="onb-field full">
                  <label>Nom de l'entreprise <span className="required">*</span></label>
                  <input className="onb-input" placeholder="Ex: Atlas Industries Maroc" value={entreprise.nom} onChange={e => updateEntreprise('nom', e.target.value)} />
                </div>
                <div className="onb-row">
                  <div className="onb-field">
                    <label>Contact téléphone</label>
                    <input className="onb-input" placeholder="+212 5XX XXX XXX" value={entreprise.telephone} onChange={e => updateEntreprise('telephone', e.target.value)} />
                  </div>
                  <div className="onb-field">
                    <label>Contact email</label>
                    <input className="onb-input" type="email" placeholder="contact@entreprise.com" value={entreprise.email} onChange={e => updateEntreprise('email', e.target.value)} />
                  </div>
                </div>
                <div className="onb-field full">
                  <label>Adresse de l'usine</label>
                  <input className="onb-input" placeholder="Zone Industrielle, Lot..." value={entreprise.adresse} onChange={e => updateEntreprise('adresse', e.target.value)} />
                </div>
                <div className="onb-row">
                  <div className="onb-field">
                    <label>Ville</label>
                    <input className="onb-input" placeholder="Casablanca" value={entreprise.ville} onChange={e => updateEntreprise('ville', e.target.value)} />
                  </div>
                  <div className="onb-field">
                    <label>Pays</label>
                    <input className="onb-input" placeholder="Maroc" value={entreprise.pays} onChange={e => updateEntreprise('pays', e.target.value)} />
                  </div>
                </div>
                <div className="onb-row">
                  <div className="onb-field">
                    <label>Code postal</label>
                    <input className="onb-input" placeholder="20000" value={entreprise.code_postal} onChange={e => updateEntreprise('code_postal', e.target.value)} />
                  </div>
                  <div className="onb-field">
                    <label>Site internet</label>
                    <input className="onb-input" placeholder="https://www.entreprise.com" value={entreprise.site_web} onChange={e => updateEntreprise('site_web', e.target.value)} />
                  </div>
                </div>
                <div className="onb-field full">
                  <label>Logo de l'entreprise</label>
                  <div className="onb-upload">
                    <div className="onb-upload-icon"><Upload size={20} /></div>
                    <div className="onb-upload-text">
                      <strong>Cliquer pour uploader</strong> ou glisser-déposer<br />
                      PNG, JPG, SVG (max 2 MB)
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 2 — Activité */}
          {step === 2 && (
            <>
              <div className="onb-card-header">
                <h2>Domaine d'<span>activité</span></h2>
                <p>Décrivez votre activité industrielle pour adapter nos algorithmes de détection et nos normes ISO.</p>
              </div>
              <div className="onb-form">
                <div className="onb-field full">
                  <label>Domaine industriel <span className="required">*</span></label>
                  <select className="onb-input" value={activite.domaine} onChange={e => updateActivite('domaine', e.target.value)}>
                    {DOMAINES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div className="onb-field full">
                  <label>Descriptif du travail de l'usine</label>
                  <textarea className="onb-input" placeholder="Production exacte, machines principales, processus industriel..." value={activite.descriptif} onChange={e => updateActivite('descriptif', e.target.value)} rows={4} />
                </div>
                <div className="onb-field full">
                  <label>Production principale</label>
                  <input className="onb-input" placeholder="Ex: Farines, semoules, huiles végétales..." value={activite.production} onChange={e => updateActivite('production', e.target.value)} />
                </div>
                <div className="onb-field full">
                  <label>Document descriptif (fiche technique usine)</label>
                  <div className="onb-upload">
                    <div className="onb-upload-icon"><Upload size={20} /></div>
                    <div className="onb-upload-text">
                      <strong>Uploader un document</strong> décrivant l'usine<br />
                      PDF, DOCX, TXT (max 10 MB)
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 3 — Machines */}
          {step === 3 && (
            <>
              <div className="onb-card-header">
                <h2>Parc <span>machines</span></h2>
                <p>Listez les machines à surveiller. Pour chaque machine, ajoutez les capteurs et ce qu'ils mesurent.</p>
              </div>
              <div className="onb-form">
                <div className="onb-machines-list">
                  {machines.map((m, mi) => (
                    <div className="onb-machine-card" key={mi}>
                      <div className="onb-machine-header">
                        <span className="onb-machine-num">Machine #{mi + 1}</span>
                        {machines.length > 1 && (
                          <button className="onb-machine-remove" onClick={() => removeMachine(mi)} title="Supprimer"><X size={14} /></button>
                        )}
                      </div>
                      <div className="onb-machine-grid">
                        <div className="onb-field">
                          <label>Nom machine <span className="required">*</span></label>
                          <input className="onb-input" placeholder="Ex: Pompe P-204" value={m.nom} onChange={e => updateMachine(mi, 'nom', e.target.value)} />
                        </div>
                        <div className="onb-field">
                          <label>Type</label>
                          <select className="onb-input" value={m.type} onChange={e => updateMachine(mi, 'type', e.target.value)}>
                            {TYPES_MACHINE.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                          </select>
                        </div>
                        <div className="onb-field">
                          <label>Rôle de la machine</label>
                          <input className="onb-input" placeholder="Ex: Alimentation broyeur" value={m.role} onChange={e => updateMachine(mi, 'role', e.target.value)} />
                        </div>
                        <div className="onb-field">
                          <label>Puissance (kW)</label>
                          <input className="onb-input" type="number" placeholder="37" value={m.puissance_kw} onChange={e => updateMachine(mi, 'puissance_kw', e.target.value)} />
                        </div>
                      </div>

                      {/* Capteurs */}
                      <div className="onb-sensors">
                        <div className="onb-sensors-title">Capteurs ({m.capteurs.length})</div>
                        {m.capteurs.map((c, ci) => (
                          <div className="onb-sensor-row" key={ci}>
                            <div className="onb-field">
                              <label>Type</label>
                              <select className="onb-input" value={c.type} onChange={e => updateCapteur(mi, ci, 'type', e.target.value)}>
                                {TYPES_CAPTEUR.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div className="onb-field">
                              <label>Position</label>
                              <input className="onb-input" placeholder="Palier DE" value={c.position} onChange={e => updateCapteur(mi, ci, 'position', e.target.value)} />
                            </div>
                            <div className="onb-field">
                              <label>Mesure</label>
                              <input className="onb-input" placeholder="mm/s" value={c.mesure} onChange={e => updateCapteur(mi, ci, 'mesure', e.target.value)} />
                            </div>
                            <button className="onb-machine-remove" onClick={() => removeCapteur(mi, ci)} title="Supprimer" style={{marginTop:22}}>
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <button className="onb-add-btn" onClick={() => addCapteur(mi)} style={{marginTop:4}}>
                          <Plus size={14} /> Ajouter un capteur
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="onb-add-btn" onClick={addMachine}>
                  <Plus size={14} /> Ajouter une machine
                </button>
              </div>
            </>
          )}

          {/* STEP 4 — Récapitulatif */}
          {step === 4 && (
            <>
              <div className="onb-card-header">
                <h2>Récapitulatif de votre <span>configuration</span></h2>
                <p>Vérifiez les informations avant de finaliser. Vous pourrez les modifier dans Paramètres.</p>
              </div>
              <div className="onb-summary">
                <div className="onb-summary-card">
                  <h4>👤 Administrateur</h4>
                  <div className="onb-summary-item"><span className="label">Nom</span><span className="value">{user?.prenom} {user?.nom}</span></div>
                  <div className="onb-summary-item"><span className="label">Email</span><span className="value">{user?.email}</span></div>
                </div>
                <div className="onb-summary-card">
                  <h4>🏢 Entreprise</h4>
                  <div className="onb-summary-item"><span className="label">Nom</span><span className="value">{entreprise.nom || '—'}</span></div>
                  <div className="onb-summary-item"><span className="label">Ville</span><span className="value">{entreprise.ville || '—'}</span></div>
                  <div className="onb-summary-item"><span className="label">Téléphone</span><span className="value">{entreprise.telephone || '—'}</span></div>
                </div>
                <div className="onb-summary-card">
                  <h4>🏭 Activité</h4>
                  <div className="onb-summary-item"><span className="label">Domaine</span><span className="value">{DOMAINES.find(d => d.value === activite.domaine)?.label}</span></div>
                  <div className="onb-summary-item"><span className="label">Production</span><span className="value">{activite.production || '—'}</span></div>
                </div>
                <div className="onb-summary-card">
                  <h4>⚙️ Parc machines</h4>
                  <div className="onb-summary-item"><span className="label">Machines</span><span className="value">{machines.filter(m => m.nom.trim()).length}</span></div>
                  <div className="onb-summary-item"><span className="label">Capteurs</span><span className="value">{machines.reduce((a, m) => a + m.capteurs.length, 0)}</span></div>
                  {machines.filter(m => m.nom.trim()).map((m, i) => (
                    <div className="onb-summary-item" key={i}>
                      <span className="label">#{i+1}</span>
                      <span className="value">{m.nom} ({m.capteurs.length} capteurs)</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Navigation ── */}
          <div className="onb-nav">
            {step > 1 ? (
              <button className="onb-btn onb-btn-prev" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft size={16} /> Précédent
              </button>
            ) : <div />}
            {step < 4 ? (
              <button className="onb-btn onb-btn-next" disabled={!canNext()} onClick={() => setStep(s => s + 1)}>
                Suivant <ChevronRight size={16} />
              </button>
            ) : (
              <button className="onb-btn onb-btn-next" onClick={handleFinish} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Terminer et accéder au dashboard'} <Check size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
