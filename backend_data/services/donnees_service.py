# backend/services/donnees_service.py
# Logique métier pour la page Données
# Fonctions prévues :
#   - save_uploaded_file(file) → enregistre le fichier dans data/uploads/ + entrée BD
#   - list_datasets()          → lit la BD et retourne la liste des datasets
#   - compute_kpis(dataset_id) → lit le fichier, calcule les KPI avec pandas
#   - get_predictions(dataset_id) → récupère prédictions associées en BD
#   - delete_dataset(dataset_id)  → supprime fichier disque + entrée BD
