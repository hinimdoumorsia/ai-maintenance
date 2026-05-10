// src/pages/Parametres/components/ParcMachines.tsx
import React, { useState, useEffect } from 'react';
import { Cpu, ChevronDown, Plus, Trash2, Upload, Radio, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const API = 'http://localhost:8000';

// ─── Types ────────────────────────────────────────────────────────────────────

const MACHINE_TYPES: Record<string, string> = {
  pompe_centrifuge:  'Pompe centrifuge',
  compresseur:       'Compresseur',
  ventilateur:       'Ventilateur',
  moteur_electrique: 'Moteur électrique',
  reducteur:         'Réducteur',
  turbine:           'Turbine',
  broyeur:           'Broyeur',
  agitateur:         'Agitateur',
  autre:             'Autre',
};

const CAPTEUR_TYPES: Record<string, string> = {
  accelerometre:    'Accéléromètre',
  sonde_proximite:  'Sonde proximité',
  velocimetre:      'Vélocimètre',
  thermique:        'Thermique',
  ultrason:         'Ultrason',
  courant:          'Courant',
};

interface Capteur {
  id: string;
  type: string;
  position: string;
  acquisition: string;
}

interface Machine {
  id: string;
  code: string;
  nom: string;
  type: string;
  role: string;
  documentNom: string;
  capteurs: Capteur[];
}

const genId = () => Math.random().toString(36).slice(2, 9);

const zeroPad = (n: number) => String(n).padStart(3, '0');

// ─── Component ────────────────────────────────────────────────────────────────

const ParcMachines: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Add machine form
  const [showAdd, setShowAdd] = useState(false);
  const [newM, setNewM] = useState({ code: '', nom: '', type: 'pompe_centrifuge', role: '', documentNom: '' });

  // Add capteur form (per machine id)
  const [addCapteurFor, setAddCapteurFor] = useState<string | null>(null);
  const [newC, setNewC] = useState({ type: 'accelerometre', position: '', acquisition: '' });

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // ── Persistence
  const fetchMachines = () => {
    if (!user) return;
    fetch(`${API}/api/admin/machines?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        // Map backend format to frontend format
        const mapped = data.map((m: any) => ({
          id: m.id_machine.toString(),
          code: m.code_machine || '',
          nom: m.nom_machine || '',
          type: m.type_machine || 'autre',
          role: m.role_machine || '',
          documentNom: '',
          capteurs: (m.capteurs || []).map((c: any) => ({
            id: c.id_capteur.toString(),
            type: c.type_capteur || '',
            position: c.position_montage || '',
            acquisition: c.unite_mesure || ''
          }))
        }));
        setMachines(mapped);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMachines();
  }, [user]);

  // ── Machine CRUD
  const addMachine = async () => {
    if (!newM.nom.trim() || !user) return;
    
    try {
      const res = await fetch(`${API}/api/admin/machines?user_id=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newM)
      });
      if (res.ok) {
        fetchMachines();
        setNewM({ code: '', nom: '', type: 'pompe_centrifuge', role: '', documentNom: '' });
        setShowAdd(false);
      }
    } catch (err) { console.error(err); }
  };

  const removeMachine = async (id: string) => {
    try {
      await fetch(`${API}/api/admin/machines/${id}`, { method: 'DELETE' });
      fetchMachines();
      if (expanded === id) setExpanded(null);
    } catch (err) { console.error(err); }
  };

  const updateMachine = async (id: string, patch: Partial<Machine>) => {
    const m = machines.find(m => m.id === id);
    if (!m) return;
    try {
      await fetch(`${API}/api/admin/machines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...m, ...patch })
      });
      fetchMachines();
    } catch (err) { console.error(err); }
  };

  // ── Capteur CRUD
  const addCapteur = async (machineId: string) => {
    if (!newC.position.trim()) return;
    try {
      await fetch(`${API}/api/admin/machines/${machineId}/capteurs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newC)
      });
      fetchMachines();
      setNewC({ type: 'accelerometre', position: '', acquisition: '' });
      setAddCapteurFor(null);
    } catch (err) { console.error(err); }
  };

  const removeCapteur = async (machineId: string, capteurId: string) => {
    try {
      await fetch(`${API}/api/admin/capteurs/${capteurId}`, { method: 'DELETE' });
      fetchMachines();
    } catch (err) { console.error(err); }
  };

  // Content replaced above

  const totalCapteurs = machines.reduce((s, m) => s + m.capteurs.length, 0);

  // ── Render
  return (
    <div className="param-card">
      {/* Header */}
      <div className="param-card-header">
        <div className="param-card-title">
          <div className="param-card-icon param-card-icon-blue">
            <Cpu size={18} />
          </div>
          <div>
            <h2>Parc Machines</h2>
            <p>Configuration des équipements et capteurs associés</p>
          </div>
        </div>
      </div>

      {/* Stats + add button */}
      <div className="machines-header">
        <div className="machines-stats">
          <div className="machine-stat">
            <span className="machine-stat-value">{machines.length}</span>
            <span className="machine-stat-label">Machines</span>
          </div>
          <div className="machine-stat">
            <span className="machine-stat-value">{totalCapteurs}</span>
            <span className="machine-stat-label">Capteurs</span>
          </div>
        </div>
        <button className="param-btn-primary" onClick={() => { setShowAdd(true); setExpanded(null); }}>
          <Plus size={14} />
          Ajouter une machine
        </button>
      </div>

      {/* Add machine form */}
      {showAdd && (
        <div className="add-machine-form">
          <div className="add-form-title">Nouvelle machine</div>
          <div className="add-form-grid">
            <input
              className="param-input-sm"
              placeholder="Code machine (ex: P-201)"
              value={newM.code}
              onChange={e => setNewM(p => ({ ...p, code: e.target.value }))}
            />
            <input
              className="param-input-sm"
              placeholder="Nom de la machine *"
              value={newM.nom}
              onChange={e => setNewM(p => ({ ...p, nom: e.target.value }))}
            />
            <select
              className="param-select-sm"
              value={newM.type}
              onChange={e => setNewM(p => ({ ...p, type: e.target.value }))}
            >
              {Object.entries(MACHINE_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              className="param-input-sm"
              placeholder="Rôle dans le processus"
              value={newM.role}
              onChange={e => setNewM(p => ({ ...p, role: e.target.value }))}
            />
          </div>

          {/* Document technique */}
          <label className="file-upload-zone" style={{ cursor: 'pointer' }}>
            <Upload size={14} color="#9ca3af" />
            {newM.documentNom
              ? <span className="file-name">{newM.documentNom}</span>
              : <p>Document technique fournisseur (PDF, Word...)</p>
            }
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={e => setNewM(p => ({ ...p, documentNom: e.target.files?.[0]?.name || '' }))}
            />
          </label>

          <div className="add-form-actions">
            <button
              className="param-btn-xs btn-xs-cancel"
              onClick={() => { setShowAdd(false); setNewM({ code: '', nom: '', type: 'pompe_centrifuge', role: '', documentNom: '' }); }}
            >
              Annuler
            </button>
            <button className="param-btn-xs btn-xs-primary" onClick={addMachine}>
              <Plus size={11} /> Ajouter
            </button>
          </div>
        </div>
      )}

      {/* Machine list */}
      <div className="machines-list">
        {machines.length === 0 && !showAdd && (
          <div className="machines-empty">
            <Cpu size={36} />
            <p>Aucune machine configurée</p>
            <small>Cliquez sur "Ajouter une machine" pour commencer</small>
          </div>
        )}

        {machines.map(machine => (
          <div
            key={machine.id}
            className={`machine-row ${expanded === machine.id ? 'expanded' : ''}`}
          >
            {/* Row header */}
            <div
              className="machine-row-header"
              onClick={() => setExpanded(expanded === machine.id ? null : machine.id)}
            >
              <span className="machine-code">{machine.code}</span>

              <div className="machine-info">
                <div className="machine-name">{machine.nom}</div>
                {machine.role && <div className="machine-role">{machine.role}</div>}
              </div>

              <span className="machine-type-badge">{MACHINE_TYPES[machine.type] || machine.type}</span>

              <span className={`machine-capteur-badge ${machine.capteurs.length > 0 ? 'has-capteurs' : ''}`}>
                <Radio size={11} />
                {machine.capteurs.length} capteur{machine.capteurs.length !== 1 ? 's' : ''}
              </span>

              <div className="machine-row-actions" onClick={e => e.stopPropagation()}>
                <button
                  className="param-btn-capteur-add"
                  title="Ajouter un capteur"
                  onClick={() => { setExpanded(machine.id); setAddCapteurFor(machine.id); }}
                >
                  <Radio size={12} />
                  <Plus size={10} />
                  Capteur
                </button>
                <button
                  className="param-btn-danger"
                  title="Supprimer la machine"
                  onClick={() => removeMachine(machine.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <ChevronDown size={15} className="machine-chevron" />
            </div>

            {/* Expanded content */}
            {expanded === machine.id && (
              <div className="machine-details">
                {/* Edit basic fields */}
                <div className="machine-detail-grid">
                  <div className="param-field">
                    <label className="param-label">Code machine</label>
                    <input
                      className="param-input-sm"
                      value={machine.code}
                      onChange={e => updateMachine(machine.id, { code: e.target.value })}
                    />
                  </div>
                  <div className="param-field">
                    <label className="param-label">Type</label>
                    <select
                      className="param-select-sm"
                      value={machine.type}
                      onChange={e => updateMachine(machine.id, { type: e.target.value })}
                    >
                      {Object.entries(MACHINE_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="param-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="param-label">Rôle de la machine dans le processus</label>
                    <input
                      className="param-input-sm"
                      placeholder="Décrire le rôle précis..."
                      value={machine.role}
                      onChange={e => updateMachine(machine.id, { role: e.target.value })}
                    />
                  </div>
                  <div className="param-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="param-label">Document technique fournisseur</label>
                    <label className="file-upload-zone" style={{ cursor: 'pointer' }}>
                      <Upload size={14} color="#9ca3af" />
                      {machine.documentNom
                        ? <span className="file-name">{machine.documentNom}</span>
                        : <p>Fiche technique, manuel d'utilisation, plans...</p>
                      }
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={e => {
                          const name = e.target.files?.[0]?.name || '';
                          updateMachine(machine.id, { documentNom: name });
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Capteurs */}
                <div className="capteurs-section">
                  <div className="capteurs-header">
                    <span className="capteurs-title">
                      Capteurs — {machine.capteurs.length} configuré{machine.capteurs.length !== 1 ? 's' : ''}
                    </span>
                    {addCapteurFor !== machine.id && (
                      <button
                        className="param-btn-xs btn-xs-primary"
                        onClick={() => setAddCapteurFor(machine.id)}
                      >
                        <Plus size={11} /> Ajouter un capteur
                      </button>
                    )}
                  </div>

                  {/* Add capteur form */}
                  {addCapteurFor === machine.id && (
                    <div className="add-capteur-form">
                      <div className="add-form-title-purple">Nouveau capteur</div>
                      <div className="add-form-grid-3">
                        <select
                          className="param-select-sm"
                          value={newC.type}
                          onChange={e => setNewC(p => ({ ...p, type: e.target.value }))}
                        >
                          {Object.entries(CAPTEUR_TYPES).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <input
                          className="param-input-sm"
                          placeholder="Position (ex : palier DE) *"
                          value={newC.position}
                          onChange={e => setNewC(p => ({ ...p, position: e.target.value }))}
                        />
                        <input
                          className="param-input-sm"
                          placeholder="Acquisition (ex : vibration 10Hz–10kHz RMS)"
                          value={newC.acquisition}
                          onChange={e => setNewC(p => ({ ...p, acquisition: e.target.value }))}
                        />
                      </div>
                      <div className="add-form-actions">
                        <button
                          className="param-btn-xs btn-xs-cancel"
                          onClick={() => { setAddCapteurFor(null); setNewC({ type: 'accelerometre', position: '', acquisition: '' }); }}
                        >
                          Annuler
                        </button>
                        <button
                          className="param-btn-xs btn-xs-primary"
                          onClick={() => addCapteur(machine.id)}
                        >
                          <Plus size={11} /> Ajouter
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Capteurs list */}
                  <div className="capteurs-list">
                    {machine.capteurs.length === 0 && addCapteurFor !== machine.id && (
                      <p className="capteurs-empty">Aucun capteur configuré pour cette machine.</p>
                    )}
                    {machine.capteurs.map(capteur => (
                      <div key={capteur.id} className="capteur-item">
                        <span className="capteur-type-badge">
                          {CAPTEUR_TYPES[capteur.type] || capteur.type}
                        </span>
                        <div className="capteur-info">
                          <div className="capteur-position">{capteur.position}</div>
                          {capteur.acquisition && (
                            <div className="capteur-acquisition">{capteur.acquisition}</div>
                          )}
                        </div>
                        <button
                          className="capteur-remove-btn"
                          title="Supprimer ce capteur"
                          onClick={() => removeCapteur(machine.id, capteur.id)}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParcMachines;
