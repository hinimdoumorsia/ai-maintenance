/**
 * handleLog.ts — Logique centralisée de traitement des logs SSE
 *
 * PROBLÈME CORRIGÉ :
 *   training_agent.py écrit maintenant sans accents ("Resultat" pas "Résultat",
 *   "Execution" pas "Exécution", "demarre" pas "démarré").
 *   Les comparaisons doivent être insensibles aux accents ET à la casse.
 *
 * Exporte :
 *   - normalizeTitle()  : supprime accents + met en minuscules
 *   - makeHandleLog()   : factory qui retourne le handler complet
 */

import { LogEntry } from "../../../services/api";
import { AgentLogEntry } from "../types";

// ── Normalisation accent-insensitive ──────────────────────────────────────
export function normalizeTitle(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // retire les diacritiques
}

// ── Helpers de correspondance ─────────────────────────────────────────────
function titleIncludes(title: string, needle: string): boolean {
  return normalizeTitle(title).includes(normalizeTitle(needle));
}

// ── Factory principale ────────────────────────────────────────────────────
export interface HandleLogDeps {
  setLogs:            React.Dispatch<React.SetStateAction<AgentLogEntry[]>>;
  updateStep:         (id: string, status: "pending" | "in_progress" | "completed") => void;
  setResults:         React.Dispatch<React.SetStateAction<any>>;
  setTrainingSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  setPercent:         React.Dispatch<React.SetStateAction<number>>;
}

export function makeHandleLog(deps: HandleLogDeps) {
  const { setLogs, updateStep, setResults, setTrainingSuccess, setPercent } = deps;

  return function handleLog(log: LogEntry): void {
    const t = normalizeTitle(log.title ?? "");
    const d = log.detail ?? "";

    // ── 1. Ajouter au journal visible ────────────────────────────────────
    setLogs(prev => [
      ...prev,
      {
        time:   log.time,
        title:  log.title,
        detail: log.detail,
        type:   log.type as any,
      },
    ]);

    // ── 2. Mettre à jour les étapes pipeline ─────────────────────────────
    //
    // Fonctionne avec ET sans accents :
    //   "Pipeline démarré" / "Pipeline demarre"
    //   "Exécution : train_model" / "Execution : train_model"
    //   "Résultat : train_model" / "Resultat : train_model"
    //   "Exécution : save_model" / "Execution : save_model"
    //   "Résultat : save_model"  / "Resultat : save_model"

    if (titleIncludes(t, "pipeline demarre") || titleIncludes(t, "pipeline demarr")) {
      updateStep("analyse", "in_progress");
    }
    else if (titleIncludes(t, "execution : train_model")) {
      updateStep("analyse",  "completed");
      updateStep("training", "in_progress");
    }
    else if (titleIncludes(t, "resultat : train_model")) {
      updateStep("training",    "completed");
      updateStep("evaluation",  "in_progress");

      // ── Extraction des scores depuis le détail ──────────────────────
      // Format attendu: "baseline=0.79 | cleaned=0.8438 | winner=cleaned"
      const mBase  = d.match(/baseline\s*=\s*([\d.]+)/i);
      const mClean = d.match(/cleaned\s*=\s*([\d.]+)/i);
      const mWin   = d.match(/winner\s*=\s*(\w+)/i);

      if (mBase && mClean) {
        const base  = parseFloat(mBase[1]);
        const clean = parseFloat(mClean[1]);
        setResults({
          comparison: {
            baseline_score: base,
            cleaned_score:  clean,
            primary_metric: "accuracy",
            delta:          clean - base,
            winner:         mWin ? mWin[1] : clean > base ? "cleaned" : "baseline",
          },
          is_production: clean > 0.8,
          mlflow_run_id: "from_logs",
        });
      }
    }
    else if (titleIncludes(t, "execution : save_model")) {
      updateStep("evaluation", "completed");
      updateStep("saving",     "in_progress");
    }
    else if (
      titleIncludes(t, "resultat : save_model") ||
      titleIncludes(t, "enregistre")            ||
      titleIncludes(t, "enregistré")
    ) {
      updateStep("saving", "completed");
      setTrainingSuccess(true);
      setPercent(100);
    }
    // Pipeline terminé (signal SSE final)
    else if (log.type === "done") {
      setTrainingSuccess(true);
      setPercent(100);
    }
  };
}