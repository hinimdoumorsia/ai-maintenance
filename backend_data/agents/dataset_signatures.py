# backend/agents/dataset_signatures.py
# Dictionnaire des signatures de types de datasets pour détection automatique

DATASET_SIGNATURES = {
    "vibration": {
        "colonnes_signatures": [
            "v_rms", "velocity_rms", "vitesse_rms", "acceleration", "accel", "vibration",
            "v_rms_mm_s", "acceleration_g", "crest_factor", "facteur_crete", "kurtosis",
            "frequence", "frequency", "rpm", "vitesse_rotation", "machine_id", "equipment_id",
            "zone_iso", "vrms", "peak", "peak_to_peak", "deplacement",
        ],
        "seuil_min_colonnes": 3,
        "page_principale": "vibration",
        "colonnes_minimales": ["vibration", "vrms", "v_rms_mm_s", "v_rms"],
        "colonnes_optionnelles": ["rpm", "vitesse_rotation", "machine_id", "timestamp", "date"],
    },
    "kpi": {
        "colonnes_signatures": [
            "mtbf", "mttr", "disponibilite", "availability", "oee", "trs", "taux_rendement",
            "nb_pannes", "downtime", "uptime", "cout_maintenance", "maintenance_cost",
            "performance", "qualite", "taux_marche", "productivite",
        ],
        "seuil_min_colonnes": 2,
        "page_principale": "kpis",
        "colonnes_minimales": ["mtbf", "mttr", "disponibilite"],
        "colonnes_optionnelles": ["oee", "atelier", "date"],
    },
    "maintenance": {
        "colonnes_signatures": [
            "bt_id", "work_order", "ordre_travail", "type_maintenance", "intervention",
            "technicien", "technician", "duree_intervention", "repair_time", "defaut", "fault_type",
            "statut_bt", "priorite", "cout", "machine_id",
        ],
        "seuil_min_colonnes": 2,
        "page_principale": "maintenance",
        "colonnes_minimales": ["machine_id", "type_maintenance"],
        "colonnes_optionnelles": ["date", "technicien", "cout"],
    },
    "machine_health": {
        "colonnes_signatures": [
            "rul", "remaining_useful_life", "duree_residuelle", "health_index", "asset_health",
            "score_degradation", "degradation_score", "probabilite_defaillance", "failure_probability",
            "asset_id", "cycle", "engine_id",
        ],
        "seuil_min_colonnes": 2,
        "page_principale": "pronostic",
        "colonnes_minimales": ["engine_id", "cycle"],
        "colonnes_optionnelles": ["machine_id", "timestamp", "score_degradation", "rul", "health_index"],
    },
    "iot": {
        "colonnes_signatures": [
            "capteur_id", "sensor_id", "capteur_type", "sensor_type", "valeur_mesuree",
            "measured_value", "seuil_alerte", "alarm_threshold", "batterie", "battery_level",
            "passerelle", "gateway",
        ],
        "seuil_min_colonnes": 3,
        "page_principale": "capteurs",
        "colonnes_minimales": ["capteur_id", "timestamp"],
        "colonnes_optionnelles": ["mesure", "batterie", "statut"],
    },
}

# Seuils ISO 10816 pour les zones vibratoires (mm/s)
COLONNES_ISO_ZONES = {
    "ZONE_A_MAX": 2.3,
    "ZONE_B_MAX": 4.5,
    "ZONE_C_MAX": 7.1,
}

# Signatures fréquentielles des défauts vibratoires
DEFAUTS_FREQUENCES = {
    "balourd": "1x vitesse de rotation (harmonique fondamentale)",
    "desalignement": "1x et 2x vitesse de rotation (harmoniques 1 et 2)",
    "defaut_roulement_ext": "BPFO = (Nb_billes/2) * (1 - d/D * cos(alpha)) * RPM/60",
    "defaut_roulement_int": "BPFI = (Nb_billes/2) * (1 + d/D * cos(alpha)) * RPM/60",
    "usure_engrenage": "GMF = Nb_dents * RPM/60 (frequence d'engrenement)",
    "cavitation": "harmoniques multiples a hautes frequences",
}

def detecter_type_dataset(colonnes: list[str]) -> tuple[str, dict]:
    """
    Détecte le type de dataset en cherchant les colonnes signatures.
    Retourne (type, infos_compatibilite).
    """
    colonnes_lower = [c.lower().replace(" ", "_").replace("-", "_") for c in colonnes]
    colonnes_lower_set = set(colonnes_lower)

    best_type = "generique"
    best_score = 0.0
    compat = {
        "vibration": {"compatible": False, "colonnes_manquantes": []},
        "kpi": {"compatible": False, "colonnes_manquantes": []},
        "maintenance": {"compatible": False, "colonnes_manquantes": []},
        "pronostic": {"compatible": False, "colonnes_manquantes": []},
        "iot": {"compatible": False, "colonnes_manquantes": []},
    }

    for dtype, info in DATASET_SIGNATURES.items():
        signatures_presentes = sum(
            1 for sig in info["colonnes_signatures"]
            if sig in colonnes_lower_set or sig.replace("_", " ") in [c.lower() for c in colonnes]
        )
        total_sigs = len(info["colonnes_signatures"])
        score = signatures_presentes / max(total_sigs, 1)
        seuil = info["seuil_min_colonnes"] / max(total_sigs, 1)

        if signatures_presentes >= info["seuil_min_colonnes"] and score > best_score:
            best_type = dtype
            best_score = score

        # Compatibilité
        minimales = info.get("colonnes_minimales", [])
        manquantes = [
            col for col in minimales
            if not any(col in cl for cl in colonnes_lower_set)
        ]
        page_key = info.get("page_principale", dtype)
        if page_key in compat:
            compat[page_key]["compatible"] = len(manquantes) == 0
            compat[page_key]["colonnes_manquantes"] = manquantes

    return best_type, compat
