/**
 * ResultsCard.tsx
 *
 * CORRECTIONS :
 *   1. Recherche des logs insensible aux accents
 *      ("Resultat : train_model" ET "Résultat : train_model" fonctionnent)
 *   2. Regex plus robuste pour extraire baseline/cleaned
 *   3. Affichage dès que results OU log de résultat existe
 */
import React from "react";
import { Settings, TrendingUp, TrendingDown, CheckCircle } from "lucide-react";

interface ResultsCardProps {
  results: any;
  logs?:   any[];
}

// ── Normalisation accent-insensitive (même helper que handleLog.ts) ───────
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const ResultsCard: React.FC<ResultsCardProps> = ({ results, logs = [] }) => {

  // ── 1. Extraction depuis `results` (prop passée par Training.tsx) ──────
  let baselineScore = 0;
  let cleanedScore  = 0;
  let winner: string = "baseline";
  let primaryMetric  = "accuracy";
  let isProduction   = false;
  let mlflowRunId: string | null = null;

  if (results) {
    const cmp     = results.comparison ?? results;
    baselineScore = Number(cmp.baseline_score ?? 0);
    cleanedScore  = Number(cmp.cleaned_score  ?? 0);
    winner        = cmp.winner ?? (cleanedScore > baselineScore ? "cleaned" : "baseline");
    primaryMetric = cmp.primary_metric ?? "accuracy";
    isProduction  = Boolean(results.is_production);
    mlflowRunId   = results.mlflow_run_id ?? null;
  }

  // ── 2. Fallback via les logs si résultats non encore propagés ─────────
  if (baselineScore === 0 && cleanedScore === 0 && logs.length > 0) {
    const trainLog = logs.find(
      l => l.title && norm(l.title).includes(norm("Resultat : train_model"))
    );
    if (trainLog?.detail) {
      const mBase  = trainLog.detail.match(/baseline\s*=\s*([\d.]+)/i);
      const mClean = trainLog.detail.match(/cleaned\s*=\s*([\d.]+)/i);
      const mWin   = trainLog.detail.match(/winner\s*=\s*(\w+)/i);
      if (mBase && mClean) {
        baselineScore = parseFloat(mBase[1]);
        cleanedScore  = parseFloat(mClean[1]);
        winner        = mWin ? mWin[1] : cleanedScore > baselineScore ? "cleaned" : "baseline";
      }
    }

    // Chercher is_production dans les logs save_model
    const saveLog = logs.find(
      l => l.title && norm(l.title).includes(norm("Resultat : save_model"))
    );
    if (saveLog?.detail) {
      const mProd = saveLog.detail.match(/production\s*=\s*(true|false)/i);
      if (mProd) isProduction = mProd[1].toLowerCase() === "true";
      const mRun  = saveLog.detail.match(/run_id\s*=\s*([a-f0-9]+)/i);
      if (mRun)  mlflowRunId = mRun[1];
    }
  }

  // ── 3. Pas encore de résultats ─────────────────────────────────────────
  if (baselineScore === 0 && cleanedScore === 0) {
    return (
      <div className="rounded-2xl border-2 border-gray-800 dark:border-gray-700 p-1 shadow-lg shadow-gray-900/20 transition-all duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-lg">📊</span>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Résultats</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-400 dark:text-gray-500">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center">
              <Settings size={24} className="opacity-40" />
            </div>
            <p className="text-sm text-center text-gray-400 dark:text-gray-500">
              Les résultats apparaîtront ici après l'entraînement
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── 4. Affichage des résultats ─────────────────────────────────────────
  const bestScore     = Math.max(baselineScore, cleanedScore);
  const delta         = cleanedScore - baselineScore;
  const deltaPositive = delta >= 0;
  const bestRun       = baselineScore > cleanedScore ? "Baseline" : "Nettoyé";

  const formatPct   = (v: number) => `${(v * 100).toFixed(1)}%`;
  const formatDelta = () => `${delta > 0 ? "+" : ""}${(delta * 100).toFixed(1)}%`;

  return (
    <div className="rounded-2xl border-2 border-gray-800 dark:border-gray-700 p-1 shadow-lg shadow-gray-900/20 transition-all duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">📊</span>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Résultats de l'entraînement
            </h3>
          </div>
          {isProduction && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full border border-green-200 dark:border-green-800">
              <CheckCircle size={11} /> Production
            </span>
          )}
        </div>

        {/* ── Métriques 2×2 ── */}
        <div className="grid grid-cols-2 gap-2 mb-4">

          {/* Meilleur score */}
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
              {primaryMetric}
            </span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatPct(bestScore)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">Meilleur : {bestRun}</span>
          </div>

          {/* Baseline */}
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Baseline</span>
            <span className="text-2xl font-bold text-orange-500 dark:text-orange-400">
              {formatPct(baselineScore)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">sans outliers</span>
          </div>

          {/* Nettoyé */}
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Nettoyé</span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatPct(cleanedScore)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">outliers traités</span>
          </div>

          {/* Delta */}
          <div className={`flex flex-col gap-1 p-3 rounded-xl border ${
            deltaPositive
              ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          }`}>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Delta</span>
            <div className="flex items-center gap-1">
              {deltaPositive
                ? <TrendingUp   size={14} className="text-green-500" />
                : <TrendingDown size={14} className="text-red-500"   />}
              <span className={`text-2xl font-bold ${
                deltaPositive ? "text-purple-600 dark:text-purple-400" : "text-red-500 dark:text-red-400"
              }`}>
                {formatDelta()}
              </span>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {deltaPositive ? "amélioration" : "régression"}
            </span>
          </div>
        </div>

        {/* ── Barres de progression ── */}
        <div className="space-y-3 mb-4">
          {[
            { label: "Baseline", value: baselineScore, color: "from-orange-400 to-orange-500" },
            { label: "Nettoyé",  value: cleanedScore,  color: "from-gray-600 to-gray-800 dark:from-gray-500 dark:to-gray-700" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>{label}</span>
                <span className="font-semibold">{formatPct(value)}</span>
              </div>
              <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
                <div
                  className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2`}
                  style={{ width: `${Math.min(value * 100, 100)}%` }}
                >
                  {value > 0.15 && (
                    <span className="text-white text-[10px] font-medium">{formatPct(value)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Résumé ── */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 dark:text-gray-400">Meilleur run</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {winner === "cleaned" ? "Modèle nettoyé" : "Baseline"}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 dark:text-gray-400">Amélioration</span>
            <span className={`font-semibold ${deltaPositive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
              {deltaPositive ? "+" : ""}{(Math.abs(delta) * 100).toFixed(2)}%
            </span>
          </div>
          {mlflowRunId && mlflowRunId !== "from_logs" && (
            <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="text-gray-500 dark:text-gray-400">MLflow run</span>
              <span className="font-mono text-gray-600 dark:text-gray-400 text-[10px]">
                {mlflowRunId.slice(0, 8)}…
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200 dark:border-gray-600">
            <span className="text-gray-500 dark:text-gray-400">Score final</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">{formatPct(bestScore)}</span>
          </div>
        </div>

        {/* ── Tag synthèse ── */}
        <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg text-center">
          <p className="text-xs text-purple-600 dark:text-purple-400">
            Baseline : {formatPct(baselineScore)} &nbsp;|&nbsp; Nettoyé : {formatPct(cleanedScore)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultsCard;