# backend/schemas/admin_schemas.py
# Schémas Pydantic pour la page Paramètres / Administration
# Classes prévues :
#   - EntrepriseBase         : champs communs (nom, tel, email, adresse, domaine, etc.)
#   - EntrepriseOut          : réponse API lecture (+ logo_url, document_url)
#   - EntrepriseUpdate       : body requête PUT (tous champs optionnels)
#   - CapteurBase            : type, position, acquisition, marque, modele
#   - CapteurOut             : + id_capteur, code_capteur, statut
#   - MachineBase            : code, nom, type, role, puissance, fabricant
#   - MachineOut             : + id_machine, statut, document_url, capteurs: list[CapteurOut]
#   - MachineCreate          : MachineBase + capteurs: list[CapteurBase] optionnel
#   - MachineUpdate          : tous champs optionnels
