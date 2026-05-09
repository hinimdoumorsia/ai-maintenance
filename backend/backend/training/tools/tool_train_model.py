"""
TOOL : train_model
───────────────────
Entraîne Random Forest, XGBoost ou CatBoost sur le DataFrame fourni.
CatBoost gère automatiquement les dates, catégories et valeurs manquantes.

Effectue systématiquement deux runs :
  1. Baseline (sans traitement des outliers)
  2. Cleaned (avec traitement intelligent des outliers basé sur test de normalité)

Compare les performances et retourne la meilleure configuration.
Sauvegarde chaque run dans MLflow.

NOUVEAUTÉS AJOUTÉES :
- Gestion des classes déséquilibrées (intégrée pour RF/ET/LGB/CatBoost, manuelle pour XGBoost)
- Régularisation L1/L2/ElasticNet pour la régression
- Auto-régularisation si les performances sont mauvaises (score < 0.6)
"""
from __future__ import annotations

import logging
import time
from typing import Any

import mlflow
import mlflow.sklearn
import numpy as np
import pandas as pd
from scipy import stats as sp_stats
from sklearn.ensemble import IsolationForest
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, ExtraTreesClassifier, ExtraTreesRegressor
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score, recall_score,
    mean_absolute_error, mean_squared_error, r2_score,
)
from sklearn.model_selection import StratifiedKFold, KFold, cross_val_score, train_test_split
from sklearn.preprocessing import PowerTransformer

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False

try:
    from catboost import CatBoostClassifier, CatBoostRegressor, Pool
    CATBOOST_AVAILABLE = True
except ImportError:
    CATBOOST_AVAILABLE = False

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False

from config.settings import (
    MLFLOW_TRACKING_URI, MLFLOW_EXPERIMENT,
    RF_PARAMS, EXTRA_TREES_PARAMS, XGB_PARAMS, LIGHTGBM_PARAMS, CATBOOST_PARAMS,
    TEST_SIZE, RANDOM_STATE, CV_FOLDS,
)

logger = logging.getLogger(__name__)

mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _is_classification(y: pd.Series) -> bool:
    """Détecte si la tâche est une classification."""
    return y.nunique() <= 10 and y.dtype in [int, "int64", "int32", object]


def _convert_date_columns(df: pd.DataFrame, feature_cols: list) -> tuple[pd.DataFrame, list]:
    """
    Convertit les colonnes de dates en features numériques (timestamp).
    À appeler AVANT toute détection d'outliers ou entraînement.
    """
    df_work = df.copy()
    new_feature_cols = []
    
    for col in feature_cols:
        if col not in df_work.columns:
            continue
            
        # Vérifier si c'est une colonne de date
        is_date = False
        
        # Déjà en datetime
        if pd.api.types.is_datetime64_any_dtype(df_work[col]):
            is_date = True
        # String qui ressemble à une date
        elif df_work[col].dtype == 'object':
            sample = df_work[col].dropna().head(5)
            if len(sample) > 0:
                try:
                    pd.to_datetime(sample, errors='raise')
                    is_date = True
                except:
                    pass
        
        if is_date:
            # Convertir en timestamp (secondes depuis epoch)
            df_work[col] = pd.to_datetime(df_work[col]).astype('int64') // 10**9
            logger.info(f"[convert] Date convertie en timestamp: {col}")
            new_feature_cols.append(col)
        else:
            new_feature_cols.append(col)
    
    return df_work, new_feature_cols


def _detect_categorical_columns(df: pd.DataFrame, feature_cols: list) -> list:
    """
    Détecte automatiquement les colonnes catégorielles pour CatBoost.
    - Colonnes de type object/string
    - Colonnes datetime
    - Colonnes avec peu de valeurs uniques (<20) et non numériques
    """
    categorical_cols = []
    for col in feature_cols:
        if col not in df.columns:
            continue
        # Colonnes datetime
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            categorical_cols.append(col)
            logger.info(f"[detect] Datetime détecté: {col}")
        # Type object/string = catégoriel
        elif df[col].dtype == 'object':
            # Vérifier si c'est une date (déjà convertie)
            try:
                sample = df[col].dropna().head(5)
                if len(sample) > 0:
                    pd.to_datetime(sample, errors='raise')
                    # C'est une date, ne pas ajouter aux catégories
                    continue
            except:
                pass
            categorical_cols.append(col)
            logger.info(f"[detect] Catégorie détectée: {col}")
        # Colonnes avec peu de valeurs uniques
        elif df[col].nunique() < 20 and df[col].nunique() > 2:
            categorical_cols.append(col)
            logger.info(f"[detect] Faible cardinalité ({df[col].nunique()}): {col}")
    return categorical_cols


# ========== NOUVEAU : GESTION DES CLASSES DÉSÉQUILIBRÉES ==========

def _get_scale_pos_weight(y: pd.Series) -> float:
    """
    Calcule scale_pos_weight pour XGBoost (classification binaire uniquement).
    """
    n_neg = (y == 0).sum()
    n_pos = (y == 1).sum()
    if n_pos == 0:
        return 1.0
    return n_neg / n_pos


def _get_sample_weights_for_xgboost_multi(y: pd.Series) -> np.ndarray:
    """
    Calcule les sample_weights pour XGBoost en multi-classes.
    """
    from sklearn.utils.class_weight import compute_sample_weight
    return compute_sample_weight('balanced', y)


def _apply_class_balancing(
    model_id: str, 
    task: str, 
    params: dict, 
    y: pd.Series = None, 
    handle_imbalance: bool = True
) -> tuple[dict, dict | np.ndarray | None]:
    """
    Applique la gestion des classes déséquilibrées selon le modèle.
    
    Retourne: (params_modifiés, class_weights_ou_sample_weights)
    
    - Modèles avec support natif : utilise leur paramètre intégré
    - XGBoost binaire : utilise scale_pos_weight
    - XGBoost multi-classes : utilise sample_weight (retourné séparément)
    """
    sample_weights = None
    
    if not handle_imbalance or task != "classification":
        return params, sample_weights
    
    unique_classes = np.unique(y) if y is not None else []
    n_classes = len(unique_classes)
    
    if model_id in ["random_forest", "extra_trees"]:
        # Support natif
        params["class_weight"] = "balanced"
        logger.info(f"[balance] {model_id} - class_weight='balanced' activé")
    
    elif model_id == "lightgbm":
        # Support natif
        params["class_weight"] = "balanced"
        logger.info(f"[balance] lightgbm - class_weight='balanced' activé")
    
    elif model_id == "catboost":
        # Support natif (meilleur pour CatBoost)
        params["auto_class_weights"] = "Balanced"
        logger.info(f"[balance] catboost - auto_class_weights='Balanced' activé")
    
    elif model_id == "xgboost":
        if n_classes == 2:
            # Binaire : utiliser scale_pos_weight
            scale_pos = _get_scale_pos_weight(y)
            params["scale_pos_weight"] = scale_pos
            logger.info(f"[balance] xgboost - scale_pos_weight={scale_pos:.4f} activé")
        else:
            # Multi-classes : utiliser sample_weight (sera appliqué dans fit)
            sample_weights = _get_sample_weights_for_xgboost_multi(y)
            logger.info(f"[balance] xgboost multi-classes - sample_weight calculé")
    
    return params, sample_weights


# ========== NOUVEAU : RÉGULARISATION POUR LA RÉGRESSION ==========

def _apply_regularization(model_id: str, task: str, params: dict, reg_type: str = None) -> dict:
    """
    Applique la régularisation L1, L2 ou ElasticNet pour la régression.
    
    Args:
        reg_type: 'l1', 'l2', 'elasticnet' ou None
    """
    if task != "regression" or not reg_type:
        return params
    
    if model_id == "random_forest" or model_id == "extra_trees":
        # RandomForest utilise min_samples_split, max_depth pour régulariser
        if reg_type in ["l1", "l2"]:
            params["min_samples_split"] = params.get("min_samples_split", 5) + 5
            params["max_depth"] = params.get("max_depth", 10) - 2
            logger.info(f"[regularization] {model_id} - régularisation par arbre appliquée")
    
    elif model_id == "xgboost":
        if reg_type == "l1":
            params["reg_alpha"] = params.get("reg_alpha", 0) + 0.1
            logger.info(f"[regularization] xgboost - L1 (reg_alpha={params['reg_alpha']})")
        elif reg_type == "l2":
            params["reg_lambda"] = params.get("reg_lambda", 1) + 0.1
            logger.info(f"[regularization] xgboost - L2 (reg_lambda={params['reg_lambda']})")
        elif reg_type == "elasticnet":
            params["reg_alpha"] = params.get("reg_alpha", 0) + 0.1
            params["reg_lambda"] = params.get("reg_lambda", 1) + 0.1
            logger.info(f"[regularization] xgboost - ElasticNet")
    
    elif model_id == "lightgbm":
        if reg_type == "l1":
            params["reg_alpha"] = params.get("reg_alpha", 0) + 0.1
        elif reg_type == "l2":
            params["reg_lambda"] = params.get("reg_lambda", 0) + 0.1
        elif reg_type == "elasticnet":
            params["reg_alpha"] = params.get("reg_alpha", 0) + 0.05
            params["reg_lambda"] = params.get("reg_lambda", 0) + 0.05
    
    elif model_id == "catboost":
        if reg_type == "l1":
            params["l1_leaf_reg"] = params.get("l1_leaf_reg", 0) + 1
        elif reg_type == "l2":
            params["l2_leaf_reg"] = params.get("l2_leaf_reg", 3) + 1
        elif reg_type == "elasticnet":
            params["l1_leaf_reg"] = params.get("l1_leaf_reg", 0) + 0.5
            params["l2_leaf_reg"] = params.get("l2_leaf_reg", 3) + 0.5
    
    return params


def _get_params_for_model(model_id: str, task: str) -> dict:
    """Récupère les paramètres de base pour un modèle donné."""
    if model_id == "random_forest":
        return RF_PARAMS.copy()
    elif model_id == "extra_trees":
        return EXTRA_TREES_PARAMS.copy()
    elif model_id == "xgboost":
        return XGB_PARAMS.copy()
    elif model_id == "lightgbm":
        return LIGHTGBM_PARAMS.copy()
    elif model_id == "catboost":
        return CATBOOST_PARAMS.copy()
    else:
        return {}


def _build_model(
    model_id: str, 
    task: str, 
    categorical_cols: list = None, 
    params: dict = None
):
    """
    Instancie le modèle selon l'identifiant et la tâche.
    Version modifiée pour accepter des paramètres personnalisés.
    """
    if params is None:
        params = _get_params_for_model(model_id, task)
    
    # ─────────────────────────────────────────────────────────────────────────
    # BAGGING (entraînement parallèle)
    # ─────────────────────────────────────────────────────────────────────────
    
    if model_id == "random_forest":
        return (RandomForestClassifier(**params)
                if task == "classification"
                else RandomForestRegressor(**params))
    
    elif model_id == "extra_trees":
        return (ExtraTreesClassifier(**params)
                if task == "classification"
                else ExtraTreesRegressor(**params))
    
    # ─────────────────────────────────────────────────────────────────────────
    # BOOSTING (entraînement séquentiel)
    # ─────────────────────────────────────────────────────────────────────────
    
    elif model_id == "xgboost":
        if not XGB_AVAILABLE:
            raise ImportError("xgboost non installé. pip install xgboost")
        if task == "regression":
            params["eval_metric"] = "rmse"
            params["objective"] = "reg:squarederror"
            return xgb.XGBRegressor(**params)
        else:
            return xgb.XGBClassifier(**params)
    
    elif model_id == "lightgbm":
        if not LIGHTGBM_AVAILABLE:
            raise ImportError("lightgbm non installé. pip install lightgbm")
        if task == "classification":
            params["objective"] = "binary"
            return lgb.LGBMClassifier(**params)
        else:
            params["objective"] = "regression"
            return lgb.LGBMRegressor(**params)
    
    elif model_id == "catboost":
        if not CATBOOST_AVAILABLE:
            raise ImportError("catboost non installé. pip install catboost")
        
        if task == "classification":
            model = CatBoostClassifier(**params)
        else:
            model = CatBoostRegressor(**params)
        
        if categorical_cols:
            model.set_params(cat_features=categorical_cols)
            logger.info(f"[build_model] CatBoost - colonnes catégorielles: {categorical_cols}")
        
        return model
    
    raise ValueError(f"Modèle inconnu : {model_id}")


def _compute_metrics(y_true, y_pred, task: str) -> dict[str, float]:
    if task == "classification":
        avg = "binary" if len(np.unique(y_true)) == 2 else "weighted"
        return {
            "accuracy":  round(float(accuracy_score(y_true, y_pred)),  4),
            "precision": round(float(precision_score(y_true, y_pred, average=avg, zero_division=0)), 4),
            "recall":    round(float(recall_score(y_true, y_pred, average=avg, zero_division=0)), 4),
            "f1":        round(float(f1_score(y_true, y_pred, average=avg, zero_division=0)), 4),
        }
    else:
        return {
            "mae":  round(float(mean_absolute_error(y_true, y_pred)),    4),
            "mse":  round(float(mean_squared_error(y_true, y_pred)),     4),
            "rmse": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 4),
            "r2":   round(float(r2_score(y_true, y_pred)),               4),
        }


# ─────────────────────────────────────────────────────────────────────────────
# SECTION : Détection et traitement intelligent des outliers
# ─────────────────────────────────────────────────────────────────────────────

def _test_normality(series: pd.Series) -> dict[str, Any]:
    """
    Teste la normalité d'une série.
    - Shapiro-Wilk si n < 5000
    - Anderson-Darling si n >= 5000
    """
    clean = series.dropna()
    n = len(clean)
    
    if n < 3:
        return {"is_normal": None, "test": "none", "p_value": None, "statistic": None}
    
    if n < 5000:
        stat, p = sp_stats.shapiro(clean)
        is_normal = p > 0.05
        test_name = "shapiro"
        p_value = p
    else:
        result = sp_stats.anderson(clean, dist='norm')
        crit = result.critical_values[2] if len(result.critical_values) > 2 else 0.787
        stat = result.statistic
        is_normal = stat < crit
        test_name = "anderson"
        p_value = None
    
    return {
        "is_normal": is_normal,
        "test": test_name,
        "p_value": p_value,
        "statistic": round(float(stat), 6),
        "n_samples": n,
    }


def _detect_outliers_zscore(series: pd.Series, threshold: float = 3.0) -> pd.Series:
    """Détecte les outliers via Z-score."""
    clean = series.dropna()
    if len(clean) == 0:
        return pd.Series(False, index=series.index)
    z_scores = np.abs(sp_stats.zscore(clean))
    outlier_idx = clean.index[z_scores > threshold]
    mask = pd.Series(False, index=series.index)
    mask[outlier_idx] = True
    return mask


def _detect_outliers_iqr(series: pd.Series, multiplier: float = 1.5) -> pd.Series:
    """Détecte les outliers via IQR."""
    Q1 = series.quantile(0.25)
    Q3 = series.quantile(0.75)
    IQR = Q3 - Q1
    lower = Q1 - multiplier * IQR
    upper = Q3 + multiplier * IQR
    return (series < lower) | (series > upper)


def _detect_outliers_isolation_forest(df: pd.DataFrame, feature_cols: list, contamination: float = 0.1) -> pd.Series:
    """Détecte les outliers via Isolation Forest (uniquement sur colonnes numériques)."""
    numeric_cols = []
    for col in feature_cols:
        if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
            numeric_cols.append(col)
    
    if len(numeric_cols) == 0:
        logger.warning("[isolation_forest] Aucune colonne numérique disponible")
        return pd.Series(False, index=df.index)
    
    iso_forest = IsolationForest(contamination=contamination, random_state=RANDOM_STATE)
    try:
        predictions = iso_forest.fit_predict(df[numeric_cols])
        return pd.Series(predictions == -1, index=df.index)
    except Exception as e:
        logger.warning(f"[isolation_forest] Échec: {e}")
        return pd.Series(False, index=df.index)


def _apply_capping(series: pd.Series, lower_percentile: float = 0.01, upper_percentile: float = 0.99) -> pd.Series:
    """Applique le capping (winsorization)."""
    lower = series.quantile(lower_percentile)
    upper = series.quantile(upper_percentile)
    return series.clip(lower=lower, upper=upper)


def _apply_transformation(series: pd.Series) -> tuple[pd.Series, str]:
    """Applique une transformation pour réduire l'impact des outliers."""
    min_val = series.min()
    if min_val > 0:
        return np.log1p(series), "log1p"
    else:
        pt = PowerTransformer(method='yeo-johnson')
        transformed = pt.fit_transform(series.values.reshape(-1, 1))
        return pd.Series(transformed.flatten(), index=series.index), "yeo-johnson"


def _handle_outliers_intelligent(
    df: pd.DataFrame,
    feature_cols: list,
    target_col: str,
) -> tuple[pd.DataFrame, dict[str, Any]]:
    """
    Pipeline intelligent de détection et traitement des outliers.
    Ne traite que les colonnes numériques.
    """
    logger.info("[handle_outliers] Début du traitement intelligent des outliers")
    
    df_work = df.copy()
    report = {
        "outliers_detected": {},
        "treatment_applied": {},
        "total_outliers_removed": 0,
        "total_outliers_capped": 0,
        "total_outliers_transformed": 0,
    }
    
    numeric_feature_cols = []
    for col in feature_cols:
        if col != target_col and col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
            numeric_feature_cols.append(col)
    
    if len(numeric_feature_cols) == 0:
        logger.warning("[handle_outliers] Aucune colonne numérique trouvée")
        return df_work, report
    
    total_rows = len(df)
    outlier_mask_per_col = {}
    
    iso_mask = None
    if len(numeric_feature_cols) >= 2:
        iso_mask = _detect_outliers_isolation_forest(df, numeric_feature_cols)
    
    for col in numeric_feature_cols:
        series = df[col].dropna()
        if len(series) < 3:
            outliers_info = {"method": None, "count": 0, "pct": 0}
            outlier_mask_per_col[col] = pd.Series(False, index=df.index)
            report["outliers_detected"][col] = outliers_info
            continue
        
        normality = _test_normality(series)
        logger.info(f"[handle_outliers] {col} - normalité: {normality['is_normal']} ({normality['test']})")
        
        if normality["is_normal"]:
            outlier_mask = _detect_outliers_zscore(series, threshold=3.0)
            method = "zscore"
        else:
            outlier_mask = _detect_outliers_iqr(series, multiplier=1.5)
            method = "iqr"
        
        if iso_mask is not None and method == "zscore" and outlier_mask.sum() != iso_mask.sum():
            logger.info(f"[handle_outliers] {col} - désaccord avec Isolation Forest, utilisation d'IQR")
            outlier_mask = _detect_outliers_iqr(series, multiplier=1.5)
            method = "iqr (robust)"
        
        outlier_count = outlier_mask.sum()
        outlier_pct = outlier_count / total_rows * 100
        
        report["outliers_detected"][col] = {
            "method": method,
            "normality": normality,
            "count": outlier_count,
            "pct": round(outlier_pct, 2),
        }
        outlier_mask_per_col[col] = outlier_mask
    
    for col in numeric_feature_cols:
        info = report["outliers_detected"][col]
        outlier_pct = info["pct"]
        
        if outlier_pct == 0:
            report["treatment_applied"][col] = {"action": "none", "reason": "aucun outlier détecté"}
            continue
        
        if outlier_pct < 5:
            mask = outlier_mask_per_col[col]
            removed_count = mask.sum()
            df_work = df_work[~mask].reset_index(drop=True)
            report["treatment_applied"][col] = {
                "action": "remove",
                "reason": f"<5% outliers ({outlier_pct}%)",
                "removed_rows": removed_count,
            }
            report["total_outliers_removed"] += removed_count
            logger.info(f"[handle_outliers] {col} - {removed_count} lignes supprimées ({outlier_pct}%)")
            
        elif outlier_pct <= 15:
            df_work[col] = _apply_capping(df_work[col])
            report["treatment_applied"][col] = {
                "action": "capping",
                "reason": f"entre 5% et 15% outliers ({outlier_pct}%)",
                "capped_at_percentiles": "1%/99%",
            }
            report["total_outliers_capped"] += outlier_mask_per_col[col].sum()
            logger.info(f"[handle_outliers] {col} - capping appliqué ({outlier_pct}%)")
            
        else:
            transformed_series, transform_type = _apply_transformation(df_work[col])
            df_work[col] = transformed_series
            report["treatment_applied"][col] = {
                "action": "transformation",
                "reason": f">15% outliers ({outlier_pct}%)",
                "transform_type": transform_type,
            }
            report["total_outliers_transformed"] += outlier_mask_per_col[col].sum()
            logger.info(f"[handle_outliers] {col} - transformation {transform_type} appliquée ({outlier_pct}%)")
    
    total_removed = report["total_outliers_removed"]
    if total_removed > total_rows * 0.10:
        logger.warning(f"[handle_outliers] ATTENTION: {total_removed} lignes supprimées (>10%) - annulation")
        df_work = df.copy()
        for col in numeric_feature_cols:
            if col in report["treatment_applied"] and report["treatment_applied"][col]["action"] == "remove":
                df_work[col] = _apply_capping(df_work[col])
                report["treatment_applied"][col] = {
                    "action": "capping (fallback)",
                    "reason": "suppression annulée (>10% limite)",
                }
        report["total_outliers_removed"] = 0
    
    report["total_rows_before"] = total_rows
    report["total_rows_after"] = len(df_work)
    
    logger.info(f"[handle_outliers] Terminé: {len(df_work)} lignes (avant: {total_rows})")
    
    return df_work, report


# ========== NOUVEAU : AUTO-RÉGULARISATION SI MAUVAISES PERFORMANCES ==========

def _try_regularization_if_needed(
    model_id: str,
    task: str,
    X_train, y_train, X_test, y_test,
    base_params: dict,
    categorical_cols: list = None,
    threshold: float = 0.6
) -> tuple[Any, float, str | None]:
    """
    Essaie différentes régularisations si les performances sont mauvaises.
    
    Args:
        threshold: Seuil en dessous duquel on tente la régularisation (défaut: 0.6)
    
    Retourne: (meilleur_modèle, meilleur_score, régularisation_utilisée)
    """
    if task != "regression":
        return None, None, None
    
    base_model = _build_model(model_id, task, categorical_cols, base_params)
    
    if model_id == "catboost" and categorical_cols:
        base_model.fit(X_train, y_train, cat_features=categorical_cols, verbose=False)
    else:
        base_model.fit(X_train, y_train)
    
    y_pred = base_model.predict(X_test)
    base_score = r2_score(y_test, y_pred)
    
    # Si déjà bon, pas besoin de régulariser
    if base_score > threshold:
        logger.info(f"[auto_regularize] Score déjà bon ({base_score:.4f} > {threshold}), pas de régularisation")
        return base_model, base_score, None
    
    logger.info(f"[auto_regularize] Score faible ({base_score:.4f} <= {threshold}), tentative régularisation...")
    
    best_score = base_score
    best_model = base_model
    best_reg = None
    
    for reg_type in ['l1', 'l2', 'elasticnet']:
        params = base_params.copy()
        params = _apply_regularization(model_id, task, params, reg_type)
        
        try:
            model = _build_model(model_id, task, categorical_cols, params)
            
            if model_id == "catboost" and categorical_cols:
                model.fit(X_train, y_train, cat_features=categorical_cols, verbose=False)
            else:
                model.fit(X_train, y_train)
            
            y_pred = model.predict(X_test)
            score = r2_score(y_test, y_pred)
            
            if score > best_score:
                best_score = score
                best_model = model
                best_reg = reg_type
                logger.info(f"[auto_regularize] {reg_type.upper()} amélioration: {score:.4f} (vs {base_score:.4f})")
        except Exception as e:
            logger.warning(f"[auto_regularize] {reg_type} échoué: {e}")
    
    return best_model, best_score, best_reg


def _run_single_experiment(
    df: pd.DataFrame,
    feature_cols: list,
    target_col: str,
    model_id: str,
    run_label: str,
    remove_outliers: bool,
    outlier_report: dict = None,
    handle_imbalance: bool = True,      # ========== NOUVEAU ==========
    auto_regularize: bool = True,       # ========== NOUVEAU ==========
) -> dict[str, Any]:
    """Entraîne un modèle sur un jeu de données et loggue dans MLflow."""
    
    df_work = df.copy()
    used_outlier_report = None
    categorical_cols = None
    
    # Convertir les dates en timestamps
    df_work, feature_cols = _convert_date_columns(df_work, feature_cols)
    
    # Pour CatBoost, détecter les colonnes catégorielles
    if model_id == "catboost":
        categorical_cols = _detect_categorical_columns(df_work, feature_cols)
        logger.info(f"[train] CatBoost - colonnes catégorielles: {categorical_cols}")
    
    if remove_outliers and outlier_report is not None:
        used_outlier_report = outlier_report
        logger.info(f"[train] {run_label} | traitement intelligent appliqué")
    elif remove_outliers:
        df_work, used_outlier_report = _handle_outliers_intelligent(df_work, feature_cols, target_col)
    
    # Préparation des données numériques
    numeric_feature_cols = []
    for col in feature_cols:
        if col in df_work.columns and pd.api.types.is_numeric_dtype(df_work[col]):
            numeric_feature_cols.append(col)
    
    if len(numeric_feature_cols) == 0:
        raise ValueError("Aucune colonne numérique disponible pour l'entraînement")
    
    X = df_work[numeric_feature_cols].values
    y = df_work[target_col].values
    task = "classification" if _is_classification(pd.Series(y)) else "regression"
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE,
        stratify=y if task == "classification" else None,
    )
    
    # ========== NOUVEAU : Récupération des paramètres et application du balancing ==========
    base_params = _get_params_for_model(model_id, task)
    
    # Appliquer la gestion des classes déséquilibrées
    y_series = pd.Series(y_train)
    balanced_params, sample_weights = _apply_class_balancing(
        model_id, task, base_params, y_series, handle_imbalance
    )
    
    # ========== NOUVEAU : Tentative d'auto-régularisation si mauvaise performance ==========
    if auto_regularize and task == "regression":
        best_model, best_score, used_reg = _try_regularization_if_needed(
            model_id, task, X_train, y_train, X_test, y_test,
            balanced_params, categorical_cols, threshold=0.6
        )
        model = best_model
        regularization_used = used_reg
    else:
        model = _build_model(model_id, task, categorical_cols, balanced_params)
        regularization_used = None
    
    # Cross-validation
    cv = StratifiedKFold(CV_FOLDS) if task == "classification" else KFold(CV_FOLDS)
    cv_metric = "accuracy" if task == "classification" else "r2"
    
    cv_scores = np.array([0.0] * CV_FOLDS)
    try:
        if model_id == "catboost":
            cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring=cv_metric)
        else:
            cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring=cv_metric)
    except Exception as e:
        logger.warning(f"[train] Cross-validation échouée: {e}")
    
    # Entraînement final
    t0 = time.time()
    
    # ========== NOUVEAU : Gestion des sample_weights pour XGBoost multi-classes ==========
    if model_id == "xgboost" and sample_weights is not None:
        model.fit(X_train, y_train, sample_weight=sample_weights, verbose=False)
    elif model_id == "catboost" and categorical_cols:
        model.fit(X_train, y_train, cat_features=categorical_cols, verbose=False)
    else:
        model.fit(X_train, y_train)
    
    train_time = round(time.time() - t0, 2)
    
    y_pred = model.predict(X_test)
    metrics = _compute_metrics(y_test, y_pred, task)
    
    # ========== NOUVEAU : Ajout de l'info de régularisation dans les métriques ==========
    if regularization_used:
        metrics["regularization_used"] = regularization_used
    
    if len(cv_scores) > 0:
        metrics["cv_mean"] = round(float(np.mean(cv_scores)), 4)
        metrics["cv_std"] = round(float(np.std(cv_scores)), 4)
    else:
        metrics["cv_mean"] = 0.0
        metrics["cv_std"] = 0.0
    
    metrics["train_sec"] = train_time
    
    # Feature importances
    importances = {}
    if hasattr(model, "feature_importances_"):
        importances = dict(zip(numeric_feature_cols, model.feature_importances_.tolist()))
    elif model_id == "catboost" and hasattr(model, "get_feature_importance"):
        importances = dict(zip(numeric_feature_cols, model.get_feature_importance().tolist()))
    
    # MLflow logging
    mlflow.set_experiment(MLFLOW_EXPERIMENT)
    with mlflow.start_run(run_name=f"{model_id}__{run_label}") as run:
        mlflow.log_param("model_id", model_id)
        mlflow.log_param("run_label", run_label)
        mlflow.log_param("task", task)
        mlflow.log_param("remove_outliers", remove_outliers)
        mlflow.log_param("n_features", len(numeric_feature_cols))
        mlflow.log_param("n_train", len(X_train))
        mlflow.log_param("n_test", len(X_test))
        mlflow.log_param("handle_imbalance", handle_imbalance)  # ========== NOUVEAU ==========
        
        if regularization_used:
            mlflow.log_param("regularization_applied", regularization_used)  # ========== NOUVEAU ==========
        
        if categorical_cols:
            mlflow.log_param("cat_features", str(categorical_cols))
        
        if used_outlier_report:
            mlflow.log_param("outlier_treatment", "intelligent")
            mlflow.log_metric("outliers_removed", used_outlier_report.get("total_outliers_removed", 0))
            mlflow.log_metric("outliers_capped", used_outlier_report.get("total_outliers_capped", 0))
            mlflow.log_metric("outliers_transformed", used_outlier_report.get("total_outliers_transformed", 0))
        
        for k, v in metrics.items():
            if isinstance(v, (int, float)):
                mlflow.log_metric(k, v)
        
        mlflow.sklearn.log_model(model, artifact_path="model")
        run_id = run.info.run_id
    
    logger.info(f"[train] {run_label} | metrics={metrics} | mlflow_run={run_id}")
    
    result = {
        "run_label": run_label,
        "task": task,
        "remove_outliers": remove_outliers,
        "metrics": metrics,
        "importances": importances,
        "mlflow_run_id": run_id,
        "model": model,
        "n_rows": len(df_work),
        "handle_imbalance": handle_imbalance,           # ========== NOUVEAU ==========
        "regularization_used": regularization_used,     # ========== NOUVEAU ==========
    }
    
    if used_outlier_report:
        result["outlier_report"] = used_outlier_report
    
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Tool principal
# ─────────────────────────────────────────────────────────────────────────────

def train_model(
    df: pd.DataFrame,
    target_col: str,
    model_id: str = "random_forest",
    feature_cols: list[str] | None = None,
    handle_imbalance: bool = True,      # ========== NOUVEAU ==========
    auto_regularize: bool = True,       # ========== NOUVEAU ==========
) -> dict[str, Any]:
    """
    Lance deux entraînements:
      1. Baseline (sans traitement outliers)
      2. Cleaned (avec traitement intelligent des outliers)

    Modèles supportés:
      - "random_forest"
      - "extra_trees"
      - "xgboost"
      - "lightgbm"
      - "catboost" (gère automatiquement dates et catégories)
    
    NOUVEAUX PARAMÈTRES:
      - handle_imbalance: Active la gestion des classes déséquilibrées (True par défaut)
      - auto_regularize: Active l'auto-régularisation pour la régression si score < 0.6 (True par défaut)
    """
    logger.info(f"[train_model] model={model_id} | target={target_col} | handle_imbalance={handle_imbalance} | auto_regularize={auto_regularize}")

    try:
        if target_col not in df.columns:
            return {"status": "error", "error": f"Colonne cible '{target_col}' absente."}

        if feature_cols is None:
            feature_cols = [c for c in df.columns if c != target_col]
            logger.info(f"[train_model] Auto-détection des features : {len(feature_cols)} colonnes")

        missing_features = [col for col in feature_cols if col not in df.columns]
        if missing_features:
            return {"status": "error", "error": f"Features manquantes: {missing_features}"}

        # Baseline (sans suppression outliers)
        baseline = _run_single_experiment(
            df, feature_cols, target_col, model_id,
            run_label="baseline", remove_outliers=False,
            handle_imbalance=handle_imbalance,           # ========== NOUVEAU ==========
            auto_regularize=auto_regularize,             # ========== NOUVEAU ==========
        )

        # Cleaned (avec traitement intelligent outliers)
        cleaned = _run_single_experiment(
            df, feature_cols, target_col, model_id,
            run_label="cleaned", remove_outliers=True,
            handle_imbalance=handle_imbalance,           # ========== NOUVEAU ==========
            auto_regularize=auto_regularize,             # ========== NOUVEAU ==========
        )

        # Comparaison
        task = baseline["task"]
        primary = "accuracy" if task == "classification" else "r2"

        b_score = baseline["metrics"].get(primary, 0)
        c_score = cleaned["metrics"].get(primary, 0)
        best = "cleaned" if c_score > b_score else "baseline"

        comparison = {
            "primary_metric": primary,
            "baseline_score": b_score,
            "cleaned_score": c_score,
            "delta": round(c_score - b_score, 4),
            "winner": best,
        }

        logger.info(f"[train_model] Meilleur run : {best} | {primary}={max(b_score, c_score)}")

        return {
            "status": "ok",
            "baseline": {k: v for k, v in baseline.items() if k != "model"},
            "cleaned": {k: v for k, v in cleaned.items() if k != "model"},
            "best_run": best,
            "best_model": baseline["model"] if best == "baseline" else cleaned["model"],
            "comparison": comparison,
            "error": None,
        }

    except Exception as exc:
        logger.error(f"[train_model] Erreur: {exc}", exc_info=True)
        return {"status": "error", "error": str(exc)}


# ─────────────────────────────────────────────────────────────────────────────
# Définition Groq Tool (JSON Schema)
# ─────────────────────────────────────────────────────────────────────────────
TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "train_model",
        "description": (
            "Entraîne un modèle ML parmi plusieurs algorithmes : "
            "Bagging (random_forest, extra_trees) ou Boosting (xgboost, lightgbm, catboost). "
            "Effectue DEUX runs MLflow : baseline (sans outliers) et cleaned (avec traitement intelligent). "
            "NOUVEAU : Gère automatiquement les classes déséquilibrées et propose une régularisation L1/L2/ElasticNet."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "target_col": {
                    "type": "string",
                    "description": "Nom de la colonne cible à prédire."
                },
                "model_id": {
                    "type": "string",
                    "enum": ["random_forest", "extra_trees", "xgboost", "lightgbm", "catboost"],
                    "description": "Algorithme à utiliser.",
                    "default": "random_forest"
                },
                "feature_cols": {
                    "oneOf": [
                        {"type": "array", "items": {"type": "string"}},
                        {"type": "null"}
                    ],
                    "default": None,
                    "description": "Liste des colonnes features (optionnel - auto-détection)"
                },
                "handle_imbalance": {  # ========== NOUVEAU ==========
                    "type": "boolean",
                    "description": "Active la gestion automatique des classes déséquilibrées",
                    "default": True
                },
                "auto_regularize": {   # ========== NOUVEAU ==========
                    "type": "boolean",
                    "description": "Active l'auto-régularisation pour la régression si performances < 0.6",
                    "default": True
                }
            },
            "required": ["target_col"]
        }
    }
}