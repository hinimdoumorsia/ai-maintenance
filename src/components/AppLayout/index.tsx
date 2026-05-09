// src/components/AppLayout/index.tsx
// Sidebar partagée avec collapse + responsive pour toutes les pages

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home, Database, GraduationCap, Package, Sparkles,
  Wrench, Bot, Settings, ChevronLeft, ChevronRight, Menu, X,
  Bell, ChevronDown, Cpu, ClipboardList, Sun, Moon,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { LogOut } from "lucide-react";
import "./layout.css";

// ─── Ordre canonique du menu (conforme à la maquette) ──────────────────────
const NAV_ITEMS = [
  { label: "Tableau de bord", icon: Home,         path: "/" },
  { label: "Données",         icon: Database,      path: "/donnees" },
  { label: "Prédictions",     icon: Sparkles,      path: "/predictions" },
  { label: "Entrainement",    icon: GraduationCap, path: "/entrainement" },
  { label: "Modèles",         icon: Package,       path: "/models" },
  { label: "Outils",          icon: Wrench,        path: "/outils" },
  { label: "Agents",          icon: Bot,           path: "/agents" },
  { label: "Maintenance",     icon: ClipboardList, path: "/maintenance" },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  notifCount?: number;
}

const AppLayout: React.FC<AppLayoutProps> = ({ title, subtitle, icon: PageIcon, children, notifCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <div className={`al-layout ${collapsed ? "al-collapsed" : ""}`}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="al-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`al-sidebar ${mobileOpen ? "al-mobile-open" : ""}`}>

        {/* Header: logo + toggle */}
        <div className="al-sidebar-head">
          <div className="al-logo">
            <div className="al-logo-icon">
              <Cpu size={18} />
            </div>
            <div className="al-logo-text">
              <strong>AI MAINTENANCE</strong>
              <small>Système intelligent</small>
            </div>
          </div>
          <button
            className="al-toggle"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Développer le menu" : "Réduire le menu"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="al-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={`al-nav-item ${location.pathname === item.path ? "al-active" : ""}`}
              onClick={() => handleNav(item.path)}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={17} className="al-nav-icon" />
              <span className="al-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer: paramètres + aide */}
        <div className="al-sidebar-foot">
          <button
            className={`al-nav-item ${location.pathname === "/parametres" ? "al-active" : ""}`}
            onClick={() => handleNav("/parametres")}
            title={collapsed ? "Paramètres" : undefined}
          >
            <Settings size={17} className="al-nav-icon" />
            <span className="al-nav-label">Paramètres</span>
          </button>

          {/* Theme toggle */}
          <button
            className="al-theme-btn"
            onClick={toggleTheme}
            title={collapsed ? (theme === "light" ? "Thème sombre" : "Thème clair") : undefined}
          >
            {theme === "light"
              ? <Moon size={17} className="al-nav-icon" />
              : <Sun size={17} className="al-nav-icon" />
            }
            <span className="al-nav-label">
              {theme === "light" ? "Thème sombre" : "Thème clair"}
            </span>
          </button>

          <div className="al-help">
            <p className="al-help-title">Besoin d'aide?</p>
            <button
              className="al-help-link"
              onClick={() => handleNav('/aide-documentation')}
              title={collapsed ? 'Aide & Documentation' : undefined}
            >
              Aide & Documentation
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile hamburger */}
      <button
        className="al-hamburger"
        onClick={() => setMobileOpen(!mobileOpen)}
        title="Menu"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* ── Page content ── */}
      <div className="al-content">

        {/* ── Standardized page header ── */}
        <header className="al-page-header">
          <div className="al-ph-left">
            {PageIcon && (
              <div className="al-ph-icon">
                <PageIcon size={18} />
              </div>
            )}
            <div>
              <h1 className="al-ph-title">{title}</h1>
              {subtitle && <p className="al-ph-subtitle">{subtitle}</p>}
            </div>
          </div>
          <div className="al-ph-right">
            <button className="al-ph-notif" title="Notifications">
              <Bell size={17} />
              {notifCount > 0 && (
                <span className="al-ph-badge">{notifCount}</span>
              )}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="al-ph-user" onClick={() => navigate('/parametres')}>
                <div className="al-ph-avatar">{user?.prenom?.[0] || 'U'}</div>
                <span>{user?.prenom} {user?.nom}</span>
              </button>
              <button 
                className="al-ph-notif" 
                title="Déconnexion" 
                onClick={logout}
                style={{ color: 'var(--theme-text-muted)' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {children}
      </div>

    </div>
  );
};

export default AppLayout;
