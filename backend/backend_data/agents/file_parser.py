# backend/agents/file_parser.py
# Parseur multi-format : CSV, XLSX, TXT, ARFF, ZIP, MAT (MATLAB)

import io
import zipfile
from pathlib import Path
import pandas as pd
import chardet


def _detect_encoding(raw: bytes) -> str:
    result = chardet.detect(raw[:50_000])
    return result.get("encoding") or "utf-8"


def _parse_csv(path: Path) -> dict[str, pd.DataFrame]:
    raw = path.read_bytes()
    enc = _detect_encoding(raw)
    # Try space separator first for CMAPSS-like files
    for sep in [" ", "\t", ",", ";", "|"]:
        try:
            df = pd.read_csv(path, sep=sep, encoding=enc, low_memory=False)
            if df.shape[1] > 1:
                # Detect CMAPSS: 26 cols, no header, all numeric
                if df.shape[1] >= 20 and all(df.dtypes.apply(lambda x: str(x).startswith("float") or str(x).startswith("int"))):
                    df = _fix_cmapss(df, path.name)
                return {path.name: df}
        except Exception:
            continue
    df = pd.read_csv(path, encoding=enc, low_memory=False)
    return {path.name: df}


def _fix_cmapss(df: pd.DataFrame, filename: str) -> pd.DataFrame:
    """Detecte et corrige un dataset NASA C-MAPSS (26 colonnes sans header)."""
    if df.shape[1] >= 20 and df.shape[1] <= 28:
        cols = ["engine_id", "cycle", "op_setting_1", "op_setting_2", "op_setting_3"] + \
               [f"sensor_{i}" for i in range(1, df.shape[1] - 4)]
        df.columns = cols[:df.shape[1]]
    return df


def _parse_xlsx(path: Path) -> dict[str, pd.DataFrame]:
    xl = pd.ExcelFile(path)
    result = {}
    for sheet in xl.sheet_names:
        df = xl.parse(sheet)
        if not df.empty:
            result[f"{path.stem}_{sheet}" if len(xl.sheet_names) > 1 else path.name] = df
    return result


def _parse_txt(path: Path) -> dict[str, pd.DataFrame]:
    return _parse_csv(path)


def _parse_arff(path: Path) -> dict[str, pd.DataFrame]:
    try:
        import arff as liac_arff
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            data = liac_arff.load(f)
        df = pd.DataFrame(data["data"], columns=[a[0] for a in data["attributes"]])
        return {path.name: df}
    except ImportError:
        # Fallback: skip ARFF header and read as CSV
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        data_start = next(
            (i for i, l in enumerate(lines) if l.strip().upper() == "@DATA"), None
        )
        if data_start is None:
            raise ValueError("Format ARFF invalide — section @DATA introuvable")
        raw_data = "\n".join(lines[data_start + 1 :])
        df = pd.read_csv(io.StringIO(raw_data), header=None)
        return {path.name: df}


def _parse_mat(path: Path) -> dict[str, pd.DataFrame]:
    """Parse un fichier MATLAB .mat (v4/v5) et retourne chaque variable 2D comme DataFrame."""
    try:
        import scipy.io as sio
    except ImportError:
        raise ValueError("scipy est requis pour lire les fichiers .mat — pip install scipy")

    # Essai format v5 / v7 standard
    try:
        mat = sio.loadmat(str(path), squeeze_me=True, struct_as_record=False)
    except Exception:
        # Certains .mat v7.3 sont en HDF5 — utiliser h5py si disponible
        try:
            import h5py
            import numpy as np
            result = {}
            with h5py.File(str(path), "r") as f:
                for key in f.keys():
                    if key.startswith("__"):
                        continue
                    try:
                        arr = np.array(f[key])
                        if arr.ndim == 2:
                            df = pd.DataFrame(arr)
                            result[f"{path.stem}_{key}"] = df
                        elif arr.ndim == 1:
                            df = pd.DataFrame({key: arr})
                            result[f"{path.stem}_{key}"] = df
                    except Exception:
                        pass
            if result:
                return result
        except ImportError:
            pass
        raise ValueError("Fichier .mat illisible : format HDF5/v7.3 non supporté sans h5py")

    result = {}
    for key, val in mat.items():
        if key.startswith("__"):
            continue
        try:
            import numpy as np
            arr = np.array(val)
            if arr.ndim == 0:
                continue
            if arr.ndim == 1:
                df = pd.DataFrame({key: arr})
            elif arr.ndim == 2:
                # Colonnes nommées si peu de colonnes, sinon col_0..col_N
                n_cols = arr.shape[1]
                col_names = [f"{key}_{i}" for i in range(n_cols)] if n_cols > 1 else [key]
                df = pd.DataFrame(arr, columns=col_names)
            else:
                # Tableau 3D+ : on reshape en 2D (samples × features)
                arr2d = arr.reshape(arr.shape[0], -1)
                df = pd.DataFrame(arr2d, columns=[f"{key}_{i}" for i in range(arr2d.shape[1])])
            if not df.empty:
                label = f"{path.stem}_{key}" if len([k for k in mat if not k.startswith("__")]) > 1 else path.name
                result[label] = df
        except Exception:
            continue

    if not result:
        raise ValueError(f"Aucune variable matricielle exploitable trouvée dans {path.name}")
    return result


def _parse_npz(path: Path) -> dict[str, pd.DataFrame]:
    """Parse un fichier NumPy .npz et retourne chaque tableau comme DataFrame."""
    import numpy as np
    data = np.load(str(path), allow_pickle=True)
    result = {}
    keys = list(data.files)
    for key in keys:
        arr = data[key]
        try:
            arr = np.array(arr, dtype=float)
        except Exception:
            continue
        if arr.ndim == 0:
            continue
        if arr.ndim == 1:
            df = pd.DataFrame({key: arr})
        elif arr.ndim == 2:
            n_cols = arr.shape[1]
            col_names = [f"{key}_{i}" for i in range(n_cols)] if n_cols > 1 else [key]
            df = pd.DataFrame(arr, columns=col_names)
        else:
            arr2d = arr.reshape(arr.shape[0], -1)
            df = pd.DataFrame(arr2d, columns=[f"{key}_{i}" for i in range(arr2d.shape[1])])
        label = f"{path.stem}_{key}" if len(keys) > 1 else path.name
        result[label] = df
    if not result:
        raise ValueError(f"Aucun tableau numérique exploitable trouvé dans {path.name}")
    return result


def _parse_single(path: Path) -> dict[str, pd.DataFrame]:
    suffix = path.suffix.lower()
    if suffix in (".csv", ".data", ".dat"):
        return _parse_csv(path)
    elif suffix in (".xlsx", ".xls"):
        return _parse_xlsx(path)
    elif suffix in (".txt", ".tsv"):
        return _parse_txt(path)
    elif suffix == ".arff":
        return _parse_arff(path)
    elif suffix == ".mat":
        return _parse_mat(path)
    elif suffix == ".npz":
        return _parse_npz(path)
    else:
        # Try CSV as fallback
        try:
            return _parse_csv(path)
        except Exception:
            raise ValueError(f"Format non supporté : {suffix}")


def parse_file(path: Path) -> dict[str, pd.DataFrame]:
    """
    Parse un fichier uploadé (CSV/XLSX/TXT/ARFF/ZIP).
    Retourne un dict {nom: DataFrame}.
    Un ZIP peut contenir plusieurs fichiers → plusieurs DataFrames.
    """
    if path.suffix.lower() == ".zip":
        result = {}
        with zipfile.ZipFile(path, "r") as zf:
            for name in zf.namelist():
                if name.startswith("__MACOSX") or name.startswith("."):
                    continue
                suffix = Path(name).suffix.lower()
                if suffix not in (".csv", ".xlsx", ".xls", ".txt", ".arff", ".data", ".dat", ".tsv", ".mat", ".npz"):
                    continue
                raw = zf.read(name)
                tmp = Path("/tmp") / Path(name).name
                tmp.write_bytes(raw)
                try:
                    frames = _parse_single(tmp)
                    result.update(frames)
                except Exception:
                    pass
                finally:
                    tmp.unlink(missing_ok=True)
        if not result:
            raise ValueError("Le ZIP ne contient aucun fichier lisible (CSV, XLSX, TXT, ARFF, MAT, NPZ)")
        return result
    else:
        return _parse_single(path)
