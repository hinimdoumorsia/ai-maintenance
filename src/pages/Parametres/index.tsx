// src/pages/Parametres/index.tsx
import React, { useState } from 'react';
import AppLayout from '../../components/AppLayout';
import { Settings, Building2, Cpu } from 'lucide-react';
import EntrepriseForm from './components/EntrepriseForm';
import ParcMachines   from './components/ParcMachines';
import './parametres.css';

type Tab = 'entreprise' | 'machines';

const ParametresPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('entreprise');

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
          {activeTab === 'entreprise' && <EntrepriseForm />}
          {activeTab === 'machines'   && <ParcMachines />}

        </div>
      </div>
    </AppLayout>
  );
};

export default ParametresPage;
