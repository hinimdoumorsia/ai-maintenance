// App.jsx - version JavaScript
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DatasetProvider } from './contexts/DatasetContext';
import DashboardPage from './pages/Dashboard';
import Predictions from "./pages/Predictions";
import Training from "./pages/Training";
import DonneesPage from './pages/Donnees/index';
import ModelsPage from './pages/Models';
import AgentsPage from "./pages/Agents/index";
import OutilsPage from './pages/Outils';
import ParametresPage from './pages/Parametres';
import MaintenancePage from './pages/Maintenance';

const App = () => {
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </DatasetProvider>
  );
};

export default App;