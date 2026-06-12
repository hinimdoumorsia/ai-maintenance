# Guide des features requises — Page Données

> Pour chaque sous-page de la section **Données**, ce document décrit exactement quelles colonnes
> sont nécessaires dans un dataset uploadé pour que chaque calcul puisse être effectué.
>
> **Règle générale :** si la colonne est absente, la section correspondante affiche un message
> « Non calculable » plutôt que des valeurs erronées ou nulles.

---

## 1. Chargement (upload)

**Aucune colonne requise.** Cette page gère uniquement l'upload du fichier.

**Formats acceptés :** `.csv` · `.xlsx` / `.xls` · `.txt` / `.tsv` · `.arff` · `.data` / `.dat` · `.zip` · `.mat` (MATLAB)

**Ce que l'EDA génère automatiquement après upload :**
- Détection du type de dataset (`vibration | kpi | maintenance | machine | generic`)
- Score qualité 0–100 (pénalités : valeurs manquantes, doublons, outliers IQR, skewness)
- 12 étapes de preprocessing (dédoublonnage, imputation, encoding, scaling)
- Génération de plots PNG + rapport PDF + narration IA (Claude)

---

## 2. Vue Générale (EDA)

**Fonctionne avec n'importe quel dataset.** La richesse du rapport dépend des colonnes présentes.

| Section du rapport | Colonnes nécessaires | Comportement si absent |
|---|---|---|
| Résumé statistique (shape, dtypes, nulls) | Aucune | Toujours présent |
| Score qualité | Aucune | Toujours présent |
| Analyse univariée (histogrammes, boxplots) | Au moins 1 colonne numérique | Ignoré si aucune numérique |
| Matrice de corrélations | ≥ 2 colonnes numériques | Non affiché |
| Analyse temporelle | 1 colonne date/timestamp + 1 numérique | Non affiché |
| KPIs sectoriels (disponibilité, MTBF…) | `disponibilite_pct`, `mtbf`, `mttr` | Estimés ou ignorés |
| Pronostic RUL | `rul_days` ou `health_index` | Non affiché |
| Zones ISO 10816 | `v_rms_mm_s` / `vrms` / `rms` | Non affiché |
| Narration IA (Claude) | ANTHROPIC_API_KEY dans backend/.env | Message d'erreur LLM |
| Recommandations preprocessing | Aucune | Toujours présent |
| Compatibilité application | Dépend du `detected_type` | Toujours présent |

**Tip :** Pour une narration IA de qualité, préférez des datasets avec des en-têtes explicites
(ex. `v_rms_mm_s` plutôt que `col_1`). L'agent utilise les noms de colonnes pour adapter son analyse.

---

## 3. Analyse Vibratoire

**Type requis :** `detected_type = "vibration"`

> Cette page lit les données brutes du fichier original uploadé (pas le CSV préprocessé).

### 3.1 — Colonnes détectées automatiquement

Le backend cherche ces colonnes par mots-clés (insensible à la casse) :

| Colonne logique | Aliases reconnus | Obligatoire ? |
|---|---|---|
| V-RMS (mm/s) | `v_rms_mm_s`, `v_rms`, `vrms`, `velocity_rms`, `rms` | **Critique** |
| Crest Factor | `crest`, `crest_factor`, `facteur_crete`, `impulse_factor` | Recommandé |
| Kurtosis | `kurtosis`, `kurt`, `facteur_k` | Recommandé |
| Timestamp | `timestamp`, `time`, `date`, `datetime`, `horodatage`, `cycle`, `index` | Recommandé |
| Machine ID | `machine_id`, `machine`, `code_machine`, `id`, `label` | Recommandé |
| RPM | `rpm`, `vitesse_rotation`, `rotation`, `speed`, `vitesse` | Optionnel |
| Amplitude BPFO | `bpfo_amplitude`, `bpfo_amp` | Optionnel |
| Amplitude BPFI | `bpfi_amplitude`, `bpfi_amp` | Optionnel |
| Amplitude BSF | `bsf_amplitude`, `bsf_amp` | Optionnel |
| Fréquence BPFO | `bpfo_freq` | Optionnel |
| Fréquence BPFI | `bpfi_freq` | Optionnel |
| Fréquence BSF | `bsf_freq` | Optionnel |
| Fréquence FTF | `ftf_freq` | Optionnel |
| Accélération RMS | `a_rms_g`, `acceleration`, `accel` | Optionnel |
| Zone ISO | nom contenant `zone` + `iso` | Optionnel |
| Puissance (kW) | `puissance`, `power` | Optionnel (classe ISO auto) |

### 3.2 — Sections et leurs dépendances

| Section affichée | Colonnes requises | Si absent |
|---|---|---|
| **Bannière ISO** (zone globale V-RMS) | `vrms` | Affiche zone D par défaut |
| **Avis ISO 10816 par machine** | `vrms` | Section masquée + message |
| **Grille de détection de défauts** | `vrms` | Section masquée + message |
| **Tableau de bord vibratoire** (KPIs) | `vrms` | Section masquée + message |
| **État des roulements** — tableau | `vrms` | Section masquée + message |
| État des roulements — amplitudes BPFO/BPFI | `vrms` + `bpfo_amplitude`, `bpfi_amplitude`, `bsf_amplitude` | Tableau visible avec note orange "amplitudes estimées" |
| **Spectre FFT simulé** | Toujours visible | Note jaune "RPM supposé 1 500 tr/min" si `rpm` absent |
| **Tendance V-RMS** | `vrms` + `timestamp` | Section masquée si `timestamp` absent |
| **Crest Factor vs Kurtosis** | `crest` OU `kurtosis` | Section masquée si les deux absents |
| **Détection automatique des défauts** | `vrms` | Section masquée + message |
| **Calculateur fréquences roulement** | — (outil manuel) | Toujours visible |

### 3.3 — Dataset idéal pour Analyse Vibratoire

```
timestamp, machine_id, v_rms_mm_s, crest_factor, kurtosis, rpm,
bpfo_amplitude, bpfi_amplitude, bsf_amplitude,
bpfo_freq_hz, bpfi_freq_hz, bsf_freq_hz, ftf_freq_hz,
a_rms_g, zone_iso, puissance_kw
```

### 3.4 — Dataset minimal fonctionnel

```
machine_id, v_rms_mm_s, kurtosis, crest_factor
```
→ Donne : Avis ISO, Grille défauts, Tableau de bord, Spectre FFT (RPM par défaut),
  Crest vs Kurtosis. Manque : Tendance (pas de temps), Roulements (pas d'amplitudes).

### 3.5 — Cas particulier : features pré-extraites (mean, std, rms, kurtosis, crest_factor…)

Si le dataset contient uniquement des features statistiques sans axe temporel ni RPM :
- Colonnes `rms`, `kurtosis`, `crest_factor` → reconnus ✅
- Pas de `timestamp` → Tendance masquée ✅
- Pas de `rpm` → FFT avec 1 500 rpm par défaut, note affichée ✅
- Pas de `bpfo_amplitude` → Roulements avec note "amplitudes estimées" ✅
- Colonne `label` ou `id` → utilisée comme `machine_id` ✅

---

## 4. Pronostic & DRBF

**Deux modes :**
- **Base de données** : lit la table `pronostic_drbf` (données insérées via intégration)
- **Dataset uploadé** — `detected_type = "maintenance"`

### 4.1 — Colonnes requises (mode dataset)

| Colonne | Description | Obligatoire |
|---|---|---|
| `machine_id` | Identifiant machine | Oui |
| `machine_name` | Nom lisible | Recommandé |
| `health_index` | Score santé 0–100 (0 = hors service) | Oui |
| `rul_days` | Durée résiduelle avant panne (jours) | Oui |
| `rul_confidence` | Confiance du modèle (%) | Recommandé |
| `vrms_current` | V-RMS actuel (mm/s) | Recommandé |
| `last_updated` | Date de la mesure | Recommandé |

### 4.2 — Ce qui est calculé

| Section | Basé sur | Condition |
|---|---|---|
| Synthèse urgence (Critique / Surveillance / Nominal) | `rul_days` | `rul_days` présent |
| Alarmes prévisionnelles (dates) | `rul_days` | `rul_days` présent |
| Courbe de dégradation | `health_index`, `rul_days`, `vrms_current` | Machine sélectionnée |
| Analyse Weibull (β, η, fiabilité) | `health_index` (variance) + MTBF | Données chargées |
| Distribution RUL (donut chart) | `rul_days` | Données chargées |
| Statistiques fiabilité (MTBF, MTTR, dispo) | DB ou dataset | Toujours (valeurs défaut si absent) |

### 4.3 — Dataset idéal pour Pronostic

```
machine_id, machine_name, health_index, rul_days, rul_confidence, vrms_current, last_updated
```

---

## 5. KPIs & Performance

**Deux modes :**
- **Base de données** : lit la table `kpi_journalier`
- **Dataset uploadé** — `detected_type = "kpi"`

### 5.1 — Colonnes requises (mode dataset)

| Colonne | Description | Obligatoire |
|---|---|---|
| `date_kpi` / `date` / `mois` | Axe temporel | Oui (pour l'évolution) |
| `disponibilite_pct` | Disponibilité (%) | Principal |
| `oee` | OEE / TRS (%) — **même indicateur**, juste français vs anglais. Formule : Disponibilité × Performance × Qualité. | Recommandé |
| `trg` | TRG (%) — Taux de Rendement Global. Variante de TRS calculée sur le **temps calendaire 24h/24** (plus sévère que TRS/OEE). | Optionnel |
| `mtbf` | MTBF moyen (heures) | Recommandé |
| `mttr` | MTTR moyen (heures) | Recommandé |

### 5.2 — Ce qui est calculé

| Section | Colonnes requises | Comportement si absent |
|---|---|---|
| 6 cartes KPI | `disponibilite_pct`, `oee`, `mtbf`, `mttr` | Valeurs démo (94.2%, 78.5%, 480h, 4.2h) |
| Décomposition OEE | `disponibilite_pct`, `oee` | Calculé depuis valeurs démo |
| Évolution temporelle | date + indicateur sélectionné | Données démo 12 mois |
| Projection (régression linéaire) | ≥ 3 points temporels | Non affiché si < 3 points |
| Analyse Pareto des défaillances | — (données statiques) | Toujours visible (données illustratives) |
| Comparaison ateliers (radar) | — (données statiques) | Toujours visible (données illustratives) |
| Ratios NF X 60-020 | — (calculés depuis KPIs) | Toujours visible |

### 5.3 — Dataset idéal pour KPIs

```
date_kpi, disponibilite_pct, oee, mtbf, mttr, atelier
```

---

## 6. Données Parc (tableau parc machines)

**Deux modes :**
- **Base de données** : tables `machine` + `mesure_globale` + `capteur` + `defaut_detecte`
- **Dataset uploadé** — `detected_type = "machine"`

### 6.1 — Colonnes requises (mode dataset)

| Colonne | Aliases | Obligatoire |
|---|---|---|
| `code` / `machine_id` | `code_machine`, `id` | Oui |
| `nom` | `machine_name`, `nom_machine` | Recommandé |
| `type` | `type_machine` | Recommandé |
| `atelier` | `workshop`, `zone` | Recommandé |
| `statut` | `status`, `etat` | Recommandé |
| `zone_iso` | `zone`, `iso_zone` | Recommandé |
| `classe_iso` | — | Optionnel (auto-détecté depuis puissance) |
| `age_jours` | `age`, `age_days` | Optionnel |
| `nb_capteurs` | `capteurs`, `sensors` | Optionnel |
| `derniere_mesure` | `last_update`, `timestamp` | Optionnel |

### 6.2 — Ce qui est calculé / affiché

| Vue | Colonnes requises |
|---|---|
| Tableau synoptique (code, nom, type, atelier, statut, zone) | `code`, `nom`, `type`, `atelier`, `statut`, `zone_iso` |
| Filtres (atelier, type, zone ISO) | `atelier`, `type`, `zone_iso` |
| Tri colonnes | N'importe quelle colonne |
| Vue cartes (synoptique) | Identique au tableau |
| Panneau étendu (capteurs, défauts, mesures récentes) | Données DB (`capteur`, `defaut_detecte`, `mesure_globale`) |

---

## 7. Capteurs IoT

**Mode principal :** Base de données (table `capteur` + `mesure_globale`)

Le dataset uploadé n'est pas directement utilisé pour remplir ce tableau — les capteurs proviennent de la hiérarchie BD configurée dans **Paramètres → Parc Machines**.

### 7.1 — Structure attendue (table `capteur` en BD)

| Champ | Description |
|---|---|
| `machine_id` | Machine associée |
| `type` | `Accéléromètre`, `Vélocimètre`, `Température`, `Courant`, `Pression` |
| `position` | Position physique (ex. "Roulement avant") |
| `statut` | `Actif`, `Inactif`, `En alarme` |
| `batterie` | Niveau batterie % (optionnel) |
| `freq_acq` | Fréquence d'acquisition |
| `nb_mesures_24h` | Comptage mesures sur 24h |

### 7.2 — Ce qui est affiché

- Liste de tous les capteurs du parc avec état et batterie
- Alerte batterie < 20%
- Statistiques par type de capteur (nb actifs, en alarme…)
- Taux de couverture du parc (capteurs actifs / total)

---

## 8. Classification VIS

**Deux modes :**
- **Base de données** : endpoint `/api/donnees/parc/classification-vis` (table `mesure_globale`)
- **Dataset uploadé** — `detected_type = "maintenance"`

### 8.1 — Colonnes requises (mode dataset)

| Colonne | Description | Obligatoire |
|---|---|---|
| `machine_id` | Identifiant machine | Oui |
| `machine_nom` / `nom` | Nom lisible | Recommandé |
| `vrms` / `v_rms_mm_s` | Vitesse vibratoire (mm/s) | **Critique** |
| `zone_iso` | Zone ISO calculée (A/B/C/D) | Recommandé |
| `tendance_7j` | `Stable` / `Hausse modérée` / `Hausse forte` / `Baisse` | Recommandé |
| `classe_vis` | `NORMAL` / `ATTENTION` / `CRITIQUE` / `URGENCE` | Optionnel (calculable) |

### 8.2 — Logique de classification VIS (si colonne absente)

Si `classe_vis` est absent, l'application la déduit de `zone_iso` + `tendance_7j` :

| Zone ISO | Tendance | → Classe VIS |
|---|---|---|
| A ou B | Stable ou baisse | NORMAL |
| B ou C | Hausse modérée | ATTENTION |
| C | Hausse forte | CRITIQUE |
| D | Toute | URGENCE |

---

## Tableau récapitulatif — Types de datasets et compatibilité

| Sous-page | Type requis (`detected_type`) | Mode DB disponible ? | Colonne pivot principale |
|---|---|---|---|
| Vue Générale | Tous | Non | — |
| **Analyse Vibratoire** | `vibration` | Non | `v_rms_mm_s` / `rms` |
| **Pronostic & DRBF** | `maintenance` | **Oui** | `rul_days`, `health_index` |
| **KPIs & Performance** | `kpi` | **Oui** | `disponibilite_pct`, `mtbf` |
| **Données Parc** | `machine` | **Oui** | `code`, `zone_iso` |
| **Capteurs IoT** | — | **Oui (uniquement)** | (BD) |
| **Classification VIS** | `maintenance` | **Oui** | `vrms`, `zone_iso` |

---

## Règles de détection du type de dataset

L'agent EDA détecte automatiquement le type avec un score de confiance.
Si la confiance est faible, Claude Haiku est appelé pour affiner la détection.

| `detected_type` | Mots-clés colonnes recherchés |
|---|---|
| `vibration` | `vrms`, `rms`, `kurtosis`, `crest_factor`, `bpfo`, `fft`, `acceleration`, `mm_s` |
| `kpi` | `mtbf`, `mttr`, `disponibilite`, `oee`, `taux_pannes`, `date_kpi` |
| `maintenance` | `rul`, `health_index`, `failure`, `panne`, `date_panne`, `machine_id` |
| `machine` | `machine_id`, `code_machine`, `type_machine`, `atelier`, `classe_iso` |
| `generic` | Aucun mot-clé sectoriel détecté (score = 0) |

> Si score ≤ 1 → appel Claude Haiku avec noms de colonnes + valeurs d'exemple
> pour inférer le domaine (vibration, kpi, maintenance, machine, électrique, thermique, acoustique, procédé, qualité, NASA C-MAPSS)

---

## Exemple de datasets types

### Dataset vibratoire complet (tout débloque)
```csv
timestamp,machine_id,v_rms_mm_s,crest_factor,kurtosis,rpm,bpfo_amplitude,bpfi_amplitude,bsf_amplitude,a_rms_g,puissance_kw
2026-01-01 08:00,M001,2.8,3.1,3.2,1480,0.05,0.03,0.02,0.4,45
```

### Dataset features pré-extraites (vibratoire, sans temps ni RPM)
```csv
mean,std,var,skewness,kurtosis,rms,peak_to_peak,crest_factor,entropy,label
0.002,0.121,0.014,0.31,3.45,0.122,0.89,3.2,4.1,0
```
→ Sections disponibles : Grille défauts, Crest vs Kurtosis, Avis ISO, Tableau de bord
→ Sections masquées : Tendance V-RMS (pas de timestamp), Spectre FFT (RPM supposé 1 500)

### Dataset KPI temporel
```csv
date_kpi,disponibilite_pct,oee,mtbf,mttr,atelier
2026-01-31,94.2,78.5,480,4.2,A
2026-02-28,93.7,77.1,472,4.5,A
```

### Dataset pronostic maintenance
```csv
machine_id,machine_name,health_index,rul_days,rul_confidence,vrms_current,last_updated
M001,Compresseur C-1,45,12,87,5.2,2026-05-05
M002,Pompe P-12,18,6,92,8.1,2026-05-05
```
