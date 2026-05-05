# generate_datasets/3_pronostic_drbf.py
# Génère un dataset pronostic/RUL pour tester Pronostic & DRBF

import pandas as pd
import random
import os
from datetime import datetime, timedelta

random.seed(42)

out = "output"
os.makedirs(out, exist_ok=True)

rows = []
machines = ["M001", "M002", "M003", "M004", "M005", "M006"]
start = datetime(2026, 1, 1)

for m in machines:
    health = random.randint(60, 95)
    for day in range(0, 90, 2):
        d = start + timedelta(days=day)
        degradation = random.uniform(0.2, 1.5)
        health = max(5, health - degradation)
        rows.append({
            "machine_id": m,
            "date": d.strftime("%Y-%m-%d"),
            "health_index": round(health, 1),
            "rul_days": max(1, int(health * 1.5 + random.randint(-10, 10))),
            "rul_confidence_pct": random.randint(60, 95),
            "vrms_mm_s": round(1.5 + (100 - health) * 0.08 + random.uniform(-0.3, 0.3), 2),
            "temperature_c": round(35 + (100 - health) * 0.3 + random.uniform(-2, 2), 1),
            "score_degradation": round((100 - health) / 100 + random.uniform(-0.05, 0.05), 3),
            "crest_factor": round(2.0 + (100 - health) * 0.04 + random.uniform(-0.2, 0.2), 2),
            "kurtosis": round(2.5 + (100 - health) * 0.05 + random.uniform(-0.3, 0.3), 2),
        })

df = pd.DataFrame(rows)
path = os.path.join(out, "pronostic_drbf.csv")
df.to_csv(path, index=False)
print(f"[PRONOSTIC] {path} — {len(df)} lignes, {len(df.columns)} colonnes")
print(f"  → Upload pour tester Pronostic & DRBF")
print(f"  → Colonnes : {', '.join(df.columns)}")
