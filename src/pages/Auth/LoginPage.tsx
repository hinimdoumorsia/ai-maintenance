// src/pages/Auth/LoginPage.tsx
// Page de connexion / inscription — UI premium dark

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Cpu, Activity, Shield, BarChart2, Zap } from 'lucide-react';
import './auth.css';

const LoginPage: React.FC = () => {
  const { login, signup, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [localErr, setLocalErr] = useState('');

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m);
    clearError();
    setLocalErr('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr('');
    clearError();

    if (mode === 'signup') {
      if (!nom.trim() || !prenom.trim()) { setLocalErr('Nom et prénom requis'); return; }
      if (password.length < 4) { setLocalErr('Mot de passe trop court (min. 4 caractères)'); return; }
      if (password !== confirmPwd) { setLocalErr('Les mots de passe ne correspondent pas'); return; }
    }
    if (!email.trim()) { setLocalErr('Email requis'); return; }
    if (!password.trim()) { setLocalErr('Mot de passe requis'); return; }

    setSubmitting(true);
    if (mode === 'login') {
      await login(email.trim(), password);
    } else {
      await signup({ nom: nom.trim(), prenom: prenom.trim(), email: email.trim(), password });
    }
    setSubmitting(false);
  };

  const displayErr = localErr || error;

  return (
    <div className="auth-page">
      {/* ── Left branding panel ── */}
      <div className="auth-left">
        <div className="auth-brand-icon"><Cpu size={28} /></div>
        <h1>Bienvenue sur votre solution de maintenance <span>tout en 1</span></h1>
        <p className="auth-tagline">
          FIABILITÉ et EFFICACITÉ — Surveillance vibratoire, diagnostic intelligent,
          pronostic de défaillance et optimisation de la maintenance industrielle.
        </p>
        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon orange"><Activity size={18} /></div>
            <div className="auth-feature-text">
              <strong>Surveillance temps réel</strong>
              <span>Capteurs IoT, vibrations, ISO 10816/20816</span>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon blue"><BarChart2 size={18} /></div>
            <div className="auth-feature-text">
              <strong>Analyse prédictive IA</strong>
              <span>Détection de défauts, DRBF, pronostic RUL</span>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon green"><Shield size={18} /></div>
            <div className="auth-feature-text">
              <strong>Réduction des risques</strong>
              <span>Pannes évitées, conformité réglementaire</span>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon purple"><Zap size={18} /></div>
            <div className="auth-feature-text">
              <strong>ROI mesurable</strong>
              <span>Économies documentées, 9 piliers KPI</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h2>
            <p>{mode === 'login'
              ? 'Accédez à votre tableau de bord de maintenance prédictive'
              : 'Configurez votre espace de maintenance en quelques minutes'
            }</p>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>
              Connexion
            </button>
            <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => switchMode('signup')}>
              Inscription
            </button>
          </div>

          {displayErr && <div className="auth-error">{displayErr}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="auth-field-row">
                <div className="auth-field">
                  <label>Nom</label>
                  <input className="auth-input" placeholder="Votre nom" value={nom} onChange={e => setNom(e.target.value)} />
                </div>
                <div className="auth-field">
                  <label>Prénom</label>
                  <input className="auth-input" placeholder="Votre prénom" value={prenom} onChange={e => setPrenom(e.target.value)} />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label>Adresse email</label>
              <input className="auth-input" type="email" placeholder="admin@entreprise.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="auth-field">
              <label>Mot de passe</label>
              <input className="auth-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            {mode === 'signup' && (
              <div className="auth-field">
                <label>Confirmer le mot de passe</label>
                <input className="auth-input" type="password" placeholder="••••••••" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
              </div>
            )}

            <button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Chargement...' : mode === 'login' ? 'Se connecter →' : "S'inscrire →"}
            </button>
          </form>

          <div className="auth-footer">
            {mode === 'login'
              ? <>Pas encore de compte ? <button style={{background:'none',border:'none',color:'#f97316',cursor:'pointer',fontFamily:'inherit',fontSize:'inherit',fontWeight:600}} onClick={() => switchMode('signup')}>S'inscrire</button></>
              : <>Déjà un compte ? <button style={{background:'none',border:'none',color:'#f97316',cursor:'pointer',fontFamily:'inherit',fontSize:'inherit',fontWeight:600}} onClick={() => switchMode('login')}>Se connecter</button></>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
