// src/pages/Parametres/index.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import { Settings, Building2, Cpu, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import EntrepriseForm from './components/EntrepriseForm';
import ParcMachines   from './components/ParcMachines';
import ProfilForm     from './components/ProfilForm';
import './parametres.css';

type Tab = 'profil' | 'entreprise' | 'machines';

const ParametresPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profil');

  /* Redirect if not authenticated */
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  return (
    <AppLayout
      title="Paramètres"
      subtitle="Configuration de l'entreprise et du parc machines"
      icon={Settings}
    >
      <div className="param-main">
        <div className="param-content">

          {/* Tabs */}
          <div className="param-tabs">
            <button
              className={`param-tab ${activeTab === 'profil' ? 'active' : ''}`}
              onClick={() => setActiveTab('profil')}
            >
              <User size={14} />
              Profil
            </button>
            <button
              className={`param-tab ${activeTab === 'entreprise' ? 'active' : ''}`}
              onClick={() => setActiveTab('entreprise')}
            >
              <Building2 size={14} />
              Entreprise
            </button>
            <button
              className={`param-tab ${activeTab === 'machines' ? 'active' : ''}`}
              onClick={() => setActiveTab('machines')}
            >
              <Cpu size={14} />
              Parc Machines
            </button>
          </div>

          {/* Tab content */}
          {activeTab === 'profil'     && <ProfilForm />}
          {activeTab === 'entreprise' && <EntrepriseForm />}
          {activeTab === 'machines'   && <ParcMachines />}

        </div>
      </div>
    </AppLayout>
  );
};

export default ParametresPage;
