// App.jsx - version JavaScript
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Predictions from "./pages/Predictions";
import Training from "./pages/Training";
import DonneesPage from './pages/Donnees/index';
import ModelsPage from './pages/Models';
import AgentsPage from "./pages/Agents/index";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/predictions" replace />} />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/entrainement" element={<Training />} /> {/* Changé ici */}
        <Route path="*" element={<Navigate to="/predictions" replace />} />
        <Route path="/donnees" element={<DonneesPage />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/agents" element={<AgentsPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;