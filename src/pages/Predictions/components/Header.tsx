import React from "react";
import { Bell, ChevronDown, Brain } from "lucide-react";

const Header: React.FC = () => {
  return (
    <header className="prediction-header">
      <div className="header-left">
        <div className="header-icon-wrap">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="24" height="24" rx="6" fill="#F97316" />
            <path d="M8 14h12M14 8v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h1 className="header-title">Page de Prédiction</h1>
          <p className="header-subtitle">Préparer et effectuer des prédictions basées sur votre modèle IA</p>
        </div>
      </div>
      <div className="header-right">
        <div className="notif-bell">
          <Bell size={20} />
          <span className="notif-badge">1</span>
        </div>
        <div className="user-chip">
          <div className="user-avatar">A</div>
          <span>Admin</span>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  );
};

export default Header;
