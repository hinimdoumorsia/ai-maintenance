"""
demo.py — version simplifiée (entraînement direct sans prétraitement)
"""
import sys
import os
import logging

sys.path.insert(0, os.path.dirname(__file__))

import numpy as np
import pandas as pd

logging.basicConfig(level=logging.WARNING)


def generate_dataset(n=500, path="demo_sensors.csv"):
    """Génère un CSV de capteurs industriels déjà propre (SANS colonnes texte)."""
    np.random.seed(42)

    df = pd.DataFrame({
        "temperature": np.random.normal(75, 8, n),
        "vibration": np.abs(np.random.normal(0.02, 0.005, n)),
        "pressure": np.random.normal(1.2, 0.1, n),
        "current": np.random.normal(5.0, 0.5, n),
        "voltage": np.random.normal(220.0, 5.0, n),
        "rpm": np.random.randint(1400, 1600, n).astype(float),
        "humidity": np.random.normal(50, 10, n),
        "failure": np.random.choice([0, 1], n, p=[0.85, 0.15]),
    })

    df.to_csv(path, index=False)
    print(f"✅ Dataset généré : {path} | shape={df.shape}")
    print(f"   Colonnes : {list(df.columns)}")
    return path


if __name__ == "__main__":
    print("\n" + "="*60)
    print("  DÉMO — Pipeline d'entraînement direct (sans prétraitement)")
    print("="*60 + "\n")

    csv_path = generate_dataset()

    from pipeline.orchestrator import run_pipeline
    result = run_pipeline(
        file_path=csv_path,
        target_col="failure",
        model_id="random_forest",
        verbose=True,
    )

    if result["status"] == "ok":
        print("\n📊 RÉSUMÉ FINAL :")
        cmp = result["train"]["comparison"]
        print(f"   Metric principal : {cmp['primary_metric']}")
        print(f"   Baseline score   : {cmp['baseline_score']}")
        print(f"   Cleaned score    : {cmp['cleaned_score']}")
        print(f"   Delta            : {cmp['delta']:+.4f}")
        print(f"   🏆 Meilleur run  : {cmp['winner']}")
        print(f"\n   MLflow run_id    : {result['save']['mlflow_run_id']}")
        print(f"   Production       : {result['save']['is_production']}")
        print(f"   Nb features      : {len(result['feature_cols'])}")
    else:
        print(f"\n❌ Erreur à l'étape '{result.get('step')}' : {result.get('error')}")