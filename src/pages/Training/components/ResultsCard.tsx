import React from "react";
import { Settings, TrendingUp, TrendingDown } from "lucide-react";

interface ResultsCardProps {
  results: any;
  logs?: any[];
}

const ResultsCard: React.FC<ResultsCardProps> = ({ results, logs = [] }) => {
  let baselineScore = 0;
  let cleanedScore  = 0;
  let winner        = "baseline";
  let primaryMetric = "accuracy";

  if (results) {
    const cmp   = results.comparison || results;
    baselineScore = cmp.baseline_score || 0;
    cleanedScore  = cmp.cleaned_score  || 0;
    winner        = cmp.winner || (cleanedScore > baselineScore ? "cleaned" : "baseline");
    primaryMetric = cmp.primary_metric || "accuracy";
  }

  if (baselineScore === 0 && cleanedScore === 0 && logs.length > 0) {
    const trainLog = logs.find((l) => l.title === "Résultat : train_model");
    if (trainLog?.detail) {
      const match = trainLog.detail.match(/baseline=([\d.]+)\s*\|\s*cleaned=([\d.]+)/);
      if (match) {
        baselineScore = parseFloat(match[1]);
        cleanedScore  = parseFloat(match[2]);
        winner        = cleanedScore > baselineScore ? "cleaned" : "baseline";
      }
    }
  }

  if (baselineScore === 0 && cleanedScore === 0) {
    return (
      <div className="rounded-2xl border-2 border-gray-800 dark:border-gray-700 p-1 shadow-lg shadow-gray-900/20 transition-all duration-300 hover:shadow-gray-800/40 hover:border-gray-700 animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-7 h-7 rounded-full bg-gray-900 dark:bg-gray-700 ring-2 ring-gray-700 shadow-md flex items-center justify-center">
              <span className="text-white text-xs">📊</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Résultats</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400 dark:text-gray-500">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center animate-pulse">
              <Settings size={26} className="opacity-40" />
            </div>
            <p className="text-sm text-center text-gray-400 dark:text-gray-500">
              Les résultats apparaîtront ici après l'entraînement
            </p>
          </div>
        </div>
      </div>
    );
  }

  const bestScore     = Math.max(baselineScore, cleanedScore);
  const delta         = cleanedScore - baselineScore;
  const deltaPositive = delta >= 0;
  const bestRun       = baselineScore > cleanedScore ? "Baseline" : "Cleaned";

  const metrics = [
    {
      label: primaryMetric.toUpperCase(),
      value: `${(bestScore * 100).toFixed(1)}%`,
      sub: bestRun,
      bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      text: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Baseline",
      value: `${(baselineScore * 100).toFixed(1)}%`,
      sub: "sans outliers",
      bg: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
      text: "text-orange-500 dark:text-orange-400",
    },
    {
      label: "Cleaned",
      value: `${(cleanedScore * 100).toFixed(1)}%`,
      sub: "outliers traités",
      bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      text: "text-green-600 dark:text-green-400",
    },
    {
      label: "Delta",
      value: `${delta > 0 ? "+" : ""}${(delta * 100).toFixed(1)}%`,
      sub: deltaPositive ? "amélioration" : "régression",
      bg: deltaPositive ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      text: deltaPositive ? "text-purple-600 dark:text-purple-400" : "text-red-500 dark:text-red-400",
      icon: deltaPositive
        ? <TrendingUp size={13} className="text-green-500" />
        : <TrendingDown size={13} className="text-red-500" />,
    },
  ];

  return (
    <div className="rounded-2xl border-2 border-gray-800 dark:border-gray-700 p-1 shadow-lg shadow-gray-900/20 transition-all duration-300 hover:shadow-gray-800/40 hover:border-gray-700 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">

        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 rounded-full bg-gray-900 dark:bg-gray-700 ring-2 ring-gray-700 shadow-md flex items-center justify-center">
            <span className="text-white text-xs">📊</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Résultats de l'entraînement</h3>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {metrics.map((m, i) => (
            <div key={m.label} className={`flex flex-col gap-1 p-3 rounded-xl border transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 ${m.bg}`} style={{ animationDelay: `${i * 60}ms` }}>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{m.label}</span>
              <div className="flex items-center gap-1">
                {m.icon}
                <span className={`text-xl font-bold ${m.text}`}>{m.value}</span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">{m.sub}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2 mb-4">
          {[
            { label: "Baseline", value: baselineScore, color: "from-orange-400 to-orange-500" },
            { label: "Cleaned",  value: cleanedScore,  color: "from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>{label}</span>
                <span className="font-semibold">{(value * 100).toFixed(1)}%</span>
              </div>
              <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
                <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2`} style={{ width: `${value * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 space-y-1">
          <div className="flex justify-between">
            <span className="font-medium">Meilleur run :</span>
            <span>{winner === "cleaned" ? "Cleaned" : "Baseline"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Amélioration :</span>
            <span className={deltaPositive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}>
              {deltaPositive ? "+" : ""}{(Math.abs(delta) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Score final :</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">{(bestScore * 100).toFixed(2)}%</span>
          </div>
        </div>

        <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl flex items-center gap-2">
          <span className="text-purple-600 dark:text-purple-400 text-xs">
            📊 Baseline : <strong>{(baselineScore * 100).toFixed(1)}%</strong>
            &nbsp;/&nbsp;Cleaned : <strong>{(cleanedScore * 100).toFixed(1)}%</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResultsCard;