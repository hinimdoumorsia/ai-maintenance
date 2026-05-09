import React, { useState } from "react";
import type { ToolPerformance, PerformanceBarPoint } from "../types";

interface Props {
  tools: ToolPerformance[];
  chartData: PerformanceBarPoint[];
}

const PerformanceCard: React.FC<Props> = ({ tools, chartData }) => {
  const [collapsed, setCollapsed] = useState(false);
  const maxVal = Math.max(...chartData.flatMap((d) => [d.f1Score, d.recall]));

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(249,115,22,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            📶
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>Performance des Outils</div>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ padding: '6px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px' }}
        >
          {collapsed ? '▼' : '▲'}
        </button>
      </div>

      {!collapsed && (
        <div>
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 80px', padding: '12px 20px', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
            {['Outils', 'Exécution', 'Timps', 'Success'].map((h, i) => (
              <span key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textAlign: i > 0 ? 'center' : 'left' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {tools.map((tool) => (
            <div key={tool.name} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 80px', padding: '12px 20px', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{tool.name}</span>
              <span style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>{tool.execution}</span>
              <span style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>{tool.temps}</span>
              <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600, textAlign: 'center' }}>{tool.success}</span>
            </div>
          ))}

          {/* Chart */}
          <div style={{ padding: '20px' }}>
            {/* Legend */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
              {[{ color: '#3b82f6', label: 'F1-Score' }, { color: '#a855f7', label: 'Recall' }].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color }} />
                  {label}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Y-axis */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '110px', paddingBottom: '24px', fontSize: '10px', color: '#9ca3af', paddingRight: '8px' }}>
                {['1.0', '0.8', '0.6', '0.3', '0.0'].map((v) => <span key={v}>{v}</span>)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '110px' }}>
                  {chartData.map((point, idx) => (
                    <div key={point.label} style={{ flex: 1, display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
                      <div
                        style={{
                          flex: 1, backgroundColor: '#3b82f6', borderRadius: '3px 3px 0 0',
                          height: `${(point.f1Score / maxVal) * 80}px`,
                          transition: `height 0.5s ease ${idx * 0.05}s`
                        }}
                        title={`F1: ${point.f1Score}`}
                      />
                      <div
                        style={{
                          flex: 1, backgroundColor: '#a855f7', borderRadius: '3px 3px 0 0',
                          height: `${(point.recall / maxVal) * 80}px`,
                          transition: `height 0.5s ease ${idx * 0.05 + 0.1}s`
                        }}
                        title={`Recall: ${point.recall}`}
                      />
                    </div>
                  ))}
                </div>
                {/* X-axis labels */}
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '8px' }}>
                  {chartData.map((point) => (
                    <div key={point.label} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: '#6b7280' }}>
                      {point.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceCard;