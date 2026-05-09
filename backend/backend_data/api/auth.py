# backend/api/auth.py
# Routes d'authentification — login, signup, onboarding

import hashlib
import sqlite3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db.database import db_session, rows_to_list

router = APIRouter()


def _hash(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


class LoginReq(BaseModel):
    email: str
    password: str

class SignupReq(BaseModel):
    nom: str
    prenom: str
    email: str
    password: str
    role: str = "admin"


@router.post("/login")
def login(req: LoginReq):
    with db_session() as conn:
        row = conn.execute(
            "SELECT * FROM utilisateur WHERE email = ?",
            (req.email.strip().lower(),)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Aucun compte trouvé avec cet email")
        user = dict(row)
        # Check password (stored in 'service' field as hash for simplicity)
        stored_hash = user.get("service") or ""
        if stored_hash and stored_hash.startswith("sha256:"):
            if stored_hash != f"sha256:{_hash(req.password)}":
                raise HTTPException(status_code=401, detail="Mot de passe incorrect")
        # Check if onboarding is done (has entreprise linked)
        onboarding_done = user.get("id_entreprise") is not None
        return {
            "user": {
                "id": user["id_utilisateur"],
                "nom": user["nom"],
                "prenom": user["prenom"],
                "email": user["email"],
                "role": user["role"],
                "id_entreprise": user.get("id_entreprise"),
                "onboarding_done": onboarding_done,
            }
        }


@router.post("/signup")
def signup(req: SignupReq):
    with db_session() as conn:
        # Check if email exists
        existing = conn.execute(
            "SELECT id_utilisateur FROM utilisateur WHERE email = ?",
            (req.email.strip().lower(),)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email")
        # Insert new user (password hash stored in 'service' field)
        pw_hash = f"sha256:{_hash(req.password)}"
        cur = conn.execute(
            """INSERT INTO utilisateur (nom, prenom, email, role, service, statut, date_embauche)
               VALUES (?, ?, ?, ?, ?, 'actif', datetime('now'))""",
            (req.nom.strip(), req.prenom.strip(), req.email.strip().lower(), req.role, pw_hash)
        )
        user_id = cur.lastrowid
        conn.commit()
        return {
            "user": {
                "id": user_id,
                "nom": req.nom.strip(),
                "prenom": req.prenom.strip(),
                "email": req.email.strip().lower(),
                "role": req.role,
                "id_entreprise": None,
                "onboarding_done": False,
            }
        }


class OnboardingReq(BaseModel):
    user_id: int
    entreprise: dict
    machines: list


@router.post("/onboarding")
def complete_onboarding(req: OnboardingReq):
    with db_session() as conn:
        ent = req.entreprise
        # Insert or update entreprise
        cur = conn.execute(
            """INSERT INTO entreprise (
                nom_entreprise, contact_telephone, contact_email,
                adresse_usine, ville, pays, code_postal,
                domaine_industriel, descriptif_activite, production_principale, site_web
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                ent.get("nom", ""),
                ent.get("telephone", ""),
                ent.get("email", ""),
                ent.get("adresse", ""),
                ent.get("ville", ""),
                ent.get("pays", "Maroc"),
                ent.get("code_postal", ""),
                ent.get("domaine", "autre"),
                ent.get("descriptif", ""),
                ent.get("production", ""),
                ent.get("site_web", ""),
            )
        )
        ent_id = cur.lastrowid

        # Link user to entreprise
        conn.execute(
            "UPDATE utilisateur SET id_entreprise = ? WHERE id_utilisateur = ?",
            (ent_id, req.user_id)
        )

        # Create default usine + atelier
        cur2 = conn.execute(
            """INSERT INTO usine (id_entreprise, nom_usine, adresse, ville, pays)
               VALUES (?, ?, ?, ?, ?)""",
            (ent_id, f"Usine {ent.get('ville', 'Principale')}",
             ent.get("adresse", ""), ent.get("ville", ""), ent.get("pays", "Maroc"))
        )
        usine_id = cur2.lastrowid

        cur3 = conn.execute(
            "INSERT INTO atelier (id_usine, nom_atelier, description) VALUES (?, 'Atelier Principal', 'Atelier par défaut')",
            (usine_id,)
        )
        atelier_id = cur3.lastrowid

        # Insert machines and capteurs
        for m in req.machines:
            nom = m.get("nom", "").strip()
            if not nom:
                continue
            code = nom.upper().replace(" ", "-")[:10]
            cur_m = conn.execute(
                """INSERT INTO machine (id_atelier, code_machine, nom_machine, type_machine,
                   role_machine, puissance_kw, vitesse_rotation_nominale_rpm, statut)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 'en_service')""",
                (
                    atelier_id, code, nom,
                    m.get("type", "autre"),
                    m.get("role", ""),
                    float(m["puissance_kw"]) if m.get("puissance_kw") else None,
                    float(m["vitesse_rpm"]) if m.get("vitesse_rpm") else None,
                )
            )
            machine_id = cur_m.lastrowid

            for ci, c in enumerate(m.get("capteurs", [])):
                cap_code = f"{code}-C{ci+1:02d}"
                try:
                    conn.execute(
                        """INSERT INTO capteur (id_machine, code_capteur, type_capteur,
                           position_montage, unite_mesure, statut, date_installation, niveau_batterie_pct)
                           VALUES (?, ?, ?, ?, ?, 'actif', datetime('now'), 100)""",
                        (machine_id, cap_code, c.get("type", "accelerometre"),
                         c.get("position", ""), c.get("mesure", "mm/s"))
                    )
                except sqlite3.IntegrityError:
                    pass  # skip duplicates

        conn.commit()
        return {"success": True, "entreprise_id": ent_id}
