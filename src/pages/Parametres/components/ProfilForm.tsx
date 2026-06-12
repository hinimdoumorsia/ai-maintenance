// src/pages/Parametres/components/ProfilForm.tsx
import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, CheckCircle, Briefcase, Calendar } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const API = 'http://localhost:8000';

interface ProfilData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  dateEmbauche: string;
}

const DEFAULT_PROFIL: ProfilData = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  poste: '',
  dateEmbauche: '',
};

const ProfilForm: React.FC = () => {
  const [data, setData] = useState<ProfilData>(DEFAULT_PROFIL);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Charger les données du profil utilisateur
    fetch(`${API}/api/auth/profile?user_id=${user.id}`)
      .then(res => res.json())
      .then(profileData => {
        if (profileData) {
          setData({
            nom: profileData.nom || '',
            prenom: profileData.prenom || '',
            email: profileData.email || user.email || '',
            telephone: profileData.telephone || '',
            poste: profileData.poste || 'Technicien maintenance',
            dateEmbauche: profileData.date_embauche || '',
          });
        } else {
          // Initialiser avec les données de l'utilisateur connecté
          setData({
            nom: user.nom || '',
            prenom: user.prenom || '',
            email: user.email || '',
            telephone: user.telephone || '',
            poste: 'Technicien maintenance',
            dateEmbauche: '',
          });
        }
      })
      .catch(err => console.error("Error fetching profile:", err))
      .finally(() => setLoading(false));
  }, [user]);

  const handleChange = (field: keyof ProfilData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          telephone: data.telephone,
          poste: data.poste,
          date_embauche: data.dateEmbauche,
        })
      });
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Error saving profile:", err);
    }
  };

  if (loading) {
    return (
      <div className="param-card">
        <div className="param-card-header">
          <div className="param-card-title">
            <div className="param-card-icon">
              <User size={18} />
            </div>
            <div>
              <h2>Mon Profil</h2>
              <p>Chargement...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="param-card">
      {/* Header */}
      <div className="param-card-header">
        <div className="param-card-title">
          <div className="param-card-icon">
            <User size={18} />
          </div>
          <div>
            <h2>Mon Profil</h2>
            <p>Informations personnelles et professionnelles</p>
          </div>
        </div>
        {saved && (
          <div className="param-toast">
            <CheckCircle size={14} />
            Profil mis à jour avec succès
          </div>
        )}
      </div>

      {/* Form fields */}
      <div className="param-form-grid">
        <div className="param-field">
          <label className="param-label">Prénom</label>
          <input
            className="param-input"
            placeholder="Votre prénom"
            value={data.prenom}
            onChange={e => handleChange('prenom', e.target.value)}
          />
        </div>

        <div className="param-field">
          <label className="param-label">Nom</label>
          <input
            className="param-input"
            placeholder="Votre nom"
            value={data.nom}
            onChange={e => handleChange('nom', e.target.value)}
          />
        </div>

        <div className="param-field">
          <label className="param-label">
            <Mail size={14} className="inline mr-1" /> Email
          </label>
          <input
            className="param-input"
            type="email"
            placeholder="email@entreprise.com"
            value={data.email}
            onChange={e => handleChange('email', e.target.value)}
            disabled
            style={{ opacity: 0.7, cursor: 'not-allowed' }}
          />
        </div>

        <div className="param-field">
          <label className="param-label">
            <Phone size={14} className="inline mr-1" /> Téléphone
          </label>
          <input
            className="param-input"
            placeholder="+212 6 XX XXX XXX"
            value={data.telephone}
            onChange={e => handleChange('telephone', e.target.value)}
          />
        </div>

        <div className="param-field">
          <label className="param-label">
            <Briefcase size={14} className="inline mr-1" /> Poste
          </label>
          <select
            className="param-select"
            value={data.poste}
            onChange={e => handleChange('poste', e.target.value)}
          >
            <option value="Technicien maintenance">Technicien maintenance</option>
            <option value="Ingénieur maintenance">Ingénieur maintenance</option>
            <option value="Responsable maintenance">Responsable maintenance</option>
            <option value="Directeur technique">Directeur technique</option>
            <option value="Chef de projet">Chef de projet</option>
          </select>
        </div>

        <div className="param-field">
          <label className="param-label">
            <Calendar size={14} className="inline mr-1" /> Date d'embauche
          </label>
          <input
            className="param-input"
            type="date"
            value={data.dateEmbauche}
            onChange={e => handleChange('dateEmbauche', e.target.value)}
          />
        </div>
      </div>

      <div className="param-form-actions">
        <button 
          className="param-btn-secondary" 
          onClick={() => {
            setData(DEFAULT_PROFIL);
          }}
        >
          Réinitialiser
        </button>
        <button className="param-btn-primary" onClick={handleSave}>
          <Save size={14} />
          Enregistrer les modifications
        </button>
      </div>
    </div>
  );
};

export default ProfilForm;