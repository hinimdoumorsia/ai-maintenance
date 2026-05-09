import React from "react";
import { Activity } from "lucide-react";
import type { ToolPerformance, PerformanceBarPoint } from "../types";

interface Props {
  tools: ToolPerformance[];
  chartData: PerformanceBarPoint[];
}

const PerformanceCard: React.FC<Props> = ({ tools, chartData }) => {
  const maxVal = Math.max(...chartData.flatMap((d) => [d.f1Score, d.recall]));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
            <Activity size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Performance des Outils</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div>
        <div className="grid grid-cols-[1fr,80px,70px,80px] bg-gray-50 px-5 py-2 border-b border-gray-100 text-[11px] font-bold text-gray-400">
          <span>Outils</span>
          <span className="text-center">Exécution</span>
          <span className="text-center">Temps</span>
          <span className="text-center">Succès</span>
        </div>

        {tools.map((tool) => (
          <div key={tool.name} className="grid grid-cols-[1fr,80px,70px,80px] px-5 py-3 border-b border-gray-100 items-center">
            <span className="text-sm font-medium text-gray-900">{tool.name}</span>
            <span className="text-sm text-gray-500 text-center">{tool.execution}</span>
            <span className="text-sm text-gray-500 text-center">{tool.temps}</span>
            <span className="text-sm text-green-600 font-semibold text-center">{tool.success}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="p-5">
        {/* Legend */}
        <div className="flex gap-6 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
            <span>F1-Score</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-3 h-3 rounded-sm bg-purple-500" />
            <span>Recall</span>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Y-axis */}
          <div className="flex flex-col justify-between h-[110px] pb-6 text-[10px] text-gray-400 pr-2">
            <span>1.0</span>
            <span>0.8</span>
            <span>0.6</span>
            <span>0.3</span>
            <span>0.0</span>
          </div>

          <div className="flex-1">
            <div className="flex items-end gap-1.5 h-[110px]">
              {chartData.map((point, idx) => (
                <div key={point.label} className="flex-1 flex gap-1 items-end">
                  <div
                    className="flex-1 bg-blue-500 rounded-t transition-all duration-500"
                    style={{
                      height: `${(point.f1Score / maxVal) * 80}px`,
                      transitionDelay: `${idx * 0.05}s`
                    }}
                    title={`F1: ${point.f1Score}`}
                  />
                  <div
                    className="flex-1 bg-purple-500 rounded-t transition-all duration-500"
                    style={{
                      height: `${(point.recall / maxVal) * 80}px`,
                      transitionDelay: `${idx * 0.05 + 0.1}s`
                    }}
                    title={`Recall: ${point.recall}`}
                  />
                </div>
              ))}
            </div>
            {/* X-axis labels */}
            <div className="flex justify-around mt-2 text-[10px] text-gray-500">
              {chartData.map((point) => (
                <div key={point.label} className="flex-1 text-center">
                  {point.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCard;