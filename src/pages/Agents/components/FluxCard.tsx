import React, { useState } from "react";
import type { FluxStatus } from "../types";

interface FluxCardProps {
  status: FluxStatus;
}

const FluxCard: React.FC<FluxCardProps> = ({ status }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(249,115,22,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            🤖
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>Flux de Données &amp; Modèles</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Gérer les flux des données et délégation d'agents</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
            backgroundColor: status === 'En Ligne' ? '#f0fdf4' : '#fef2f2',
            color: status === 'En Ligne' ? '#16a34a' : '#dc2626'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: status === 'En Ligne' ? '#16a34a' : '#dc2626' }} />
            {status}
          </span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{ padding: '6px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px' }}
          >
            {collapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div style={{ padding: '20px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '800px' }}>

            {/* Données Capteurs */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', border: '2px solid #e5e7eb', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                🖥️
              </div>
              <div style={{ fontSize: '10px', fontWeight: 600, textAlign: 'center', color: '#374151' }}>Données<br />Capteurs</div>
            </div>

            {/* Arrow */}
            <Arrow />

            {/* Agent Central */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '12px', backgroundColor: '#1E40AF', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                🤖
              </div>
              <div style={{ fontSize: '10px', fontWeight: 600, textAlign: 'center', color: '#374151' }}>Agent<br />Central</div>
            </div>

            {/* Arrow */}
            <Arrow />

            {/* Tool Box */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ marginBottom: '8px', padding: '4px 12px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '999px', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                Agent Central
              </div>
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '12px', minWidth: '140px', border: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textAlign: 'center', marginBottom: '8px', color: '#111827' }}>Trousse à Outils</div>
                <div>
                  {['✂️ Nettoyage', '📋 Validation de Schéma', '🔍 Analyse de Compatibilité'].map((item, i, arr) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: '#4b5563', padding: '4px 0', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      {item}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 600, color: '#16a34a', backgroundColor: '#f0fdf4', padding: '2px 8px', borderRadius: '999px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                    En Ligne
                  </span>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <Arrow />

            {/* Models */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[{ icon: '📊', label: 'Modèles\nMachine Learning' }, { icon: '🧠', label: 'Modèles\nDeep Learning' }].map(({ icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', borderRadius: '10px', padding: '8px', border: '1px solid #f3f4f6' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{icon}</div>
                  <div style={{ fontSize: '9px', fontWeight: 600, color: '#374151', whiteSpace: 'pre-line' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Arrow */}
            <Arrow />

            {/* Prédiction & Error */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', border: '2px solid #e5e7eb', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📈</div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}>Prédiction</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontWeight: 700, fontSize: '14px' }}>!</div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: '#6b7280' }}>Erreur /<br />Redirection</div>
              </div>
            </div>

            {/* Arrow */}
            <Arrow />

            {/* Other Agents */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', border: '2px solid #e5e7eb', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚙️</div>
              <div style={{ fontSize: '9px', fontWeight: 600, textAlign: 'center', color: '#374151' }}>Autres<br />Agents</div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

const Arrow: React.FC = () => (
  <div style={{ flex: 1, position: 'relative', height: '2px', backgroundColor: '#e5e7eb', margin: '0 4px' }}>
    <div style={{
      position: 'absolute', right: '-1px', top: '50%', transform: 'translateY(-50%)',
      width: 0, height: 0,
      borderLeft: '6px solid #F97316',
      borderTop: '4px solid transparent',
      borderBottom: '4px solid transparent'
    }} />
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #e5e7eb, #F97316)' }} />
  </div>
);

export default FluxCard;