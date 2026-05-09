# backend/db/models.py
# Modèles SQLAlchemy (tables de la base de données SQLite)
# Tables prévues :
#   - Dataset     : métadonnées des fichiers uploadés (nom, chemin, date, taille, statut)
#   - Machine     : liste des machines suivies (id, nom, type, statut, dernière maintenance)
#   - Alert       : alertes générées (id, machine_id, type, sévérité, date, résolu)
#   - Prediction  : résultats de prédictions (id, dataset_id, model_id, date, résultats JSON)
#   - Metric      : métriques de performance système (id, nom, valeur, date)
