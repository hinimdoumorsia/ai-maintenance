# generate_datasets/2_kpi_performance.py
# Génère un dataset KPI pour tester la page KPIs & Performance

import pandas as pd
import random
import os
from datetime import datetime, timedelta

random.seed(42)

out = "output"
os.makedirs(out, exist_ok=True)

rows = []
start = datetime(2026, 1, 1)
for i in range(200):
    d = start + timedelta(days=i)
    rows.append({
        "date": d.strftime("%Y-%m-%d"),
        "atelier": random.choice(["A", "B", "C", "D", "E"]),
        "mtbf_heures": random.randint(350, 550),
        "mttr_heures": round(random.uniform(2.5, 7.0), 1),
        "disponibilite_pct": round(random.uniform(85, 98), 1),
        "oee_pct": round(random.uniform(65, 92), 1),
        "trs_pct": round(random.uniform(62, 90), 1),
        "nb_pannes": random.randint(0, 5),
        "nb_alertes": random.randint(0, 8),
        "cout_maintenance_euros": random.randint(200, 2500),
        "economies_predictif_euros": random.randint(0, 5000),
        "performance_pct": round(random.uniform(80, 99), 1),
        "qualite_pct": round(random.uniform(95, 100), 1),
    })

df = pd.DataFrame(rows)
path = os.path.join(out, "kpi_performance.csv")
df.to_csv(path, index=False)
print(f"[KPI] {path} — {len(df)} lignes, {len(df.columns)} colonnes")
print(f"  → Upload ce fichier pour tester la page KPIs & Performance")
print(f"  → Colonnes : {', '.join(df.columns)}")
