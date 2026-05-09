// App.jsx - version JavaScript
// Routes protégées par authentification + onboarding
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DatasetProvider } from './contexts/DatasetContext';
import LoginPage from './pages/Auth/LoginPage';
import OnboardingPage from './pages/Auth/OnboardingPage';
import DashboardPage from './pages/Dashboard';
import Predictions from "./pages/Predictions";
import Training from "./pages/Training";
import DonneesPage from './pages/Donnees/index';
import ModelsPage from './pages/Models';
import AgentsPage from "./pages/Agents/index";
import OutilsPage from './pages/Outils';
import ParametresPage from './pages/Parametres';
import MaintenancePage from './pages/Maintenance';
import AideDocumentationPage from './pages/AideDocumentation';
import ChatWidget from './components/chatbot/ChatWidget';

/* ── Protected Routes wrapper ── */
const ProtectedApp = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'center',
        height:'100vh', background:'#060a14', color:'#8896b3',
        fontFamily:'Space Grotesk, system-ui, sans-serif', fontSize:14
      }}>
        <div style={{textAlign:'center'}}>
          <div style={{
            width:48, height:48, borderRadius:12,
            background:'linear-gradient(135deg,#f97316,#fb923c)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px', fontSize:22, fontWeight:800, color:'#0a0e1a'
          }}>AI</div>
          Chargement...
        </div>
      </div>
    );
  }

  // Not logged in → show login page
  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Logged in but onboarding not done → show onboarding
  if (!user.onboarding_done) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<OnboardingPage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Fully authenticated → main app
  return (
    <DatasetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/donnees" element={<DonneesPage />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/entrainement" element={<Training />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/outils" element={<OutilsPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/parametres" element={<ParametresPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/aide-documentation" element={<AideDocumentationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ChatWidget />
      </BrowserRouter>
    </DatasetProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
};

export default App;