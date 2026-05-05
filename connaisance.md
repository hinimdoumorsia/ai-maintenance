# Analyse Vibratoire des Machines Tournantes & Maintenance Conditionnelle
## Document de Référence Exhaustif — Opérateurs & Ingénieurs

> **Sources consolidées :** Cours ENSAM (ALAEDDINE CHAFAI), Manuel BTS MI (Hubert Faigner), TP1 Falcon (Prof. Smail ZAKI), Manuel Vibrations & Ondes (Pr. DJELOUAH Hakim, USTHB), Présentation Surveillance Vibratoire.

---

## Table des Matières

1. [Introduction & Contexte Industriel](#1-introduction--contexte-industriel)
2. [Les Différentes Formes de Maintenance](#2-les-différentes-formes-de-maintenance)
3. [Fondements Théoriques des Vibrations](#3-fondements-théoriques-des-vibrations)
4. [Principe de l'Analyse Vibratoire des Machines Tournantes](#4-principe-de-lanalyse-vibratoire-des-machines-tournantes)
5. [Capteurs et Matériel de Mesure](#5-capteurs-et-matériel-de-mesure)
6. [Grandeurs Vibratoires et Traitement du Signal](#6-grandeurs-vibratoires-et-traitement-du-signal)
7. [Les Principaux Défauts et leurs Signatures Spectrales](#7-les-principaux-défauts-et-leurs-signatures-spectrales)
8. [Indicateurs de Surveillance](#8-indicateurs-de-surveillance)
9. [Outils de Diagnostic Avancés](#9-outils-de-diagnostic-avancés)
10. [Avantages et Inconvénients de la MPC](#10-avantages-et-inconvénients-de-la-mpc)
11. [Méthodologie Pratique — TP Falcon](#11-méthodologie-pratique--tp-falcon)
12. [Fréquences Cinématiques — Calculs et Applications](#12-fréquences-cinématiques--calculs-et-applications)
13. [Fondements Mathématiques Avancés](#13-fondements-mathématiques-avancés)
14. [Synthèse : Développer une Solution de Maintenance Vibratoire](#14-synthèse--développer-une-solution-de-maintenance-vibratoire)

---

## 1. Introduction & Contexte Industriel

### 1.1 Définition de l'Analyse Vibratoire

L'analyse vibratoire est un des moyens utilisés pour **suivre la santé des machines tournantes en fonctionnement**. Elle s'inscrit dans le cadre d'une politique de **maintenance prévisionnelle** de l'outil de production industrielle.

À partir des vibrations régulièrement recueillies sur une machine tournante, l'analyse vibratoire consiste à :
- **Détecter** d'éventuels dysfonctionnements,
- **Suivre leur évolution** dans le but de planifier ou reporter une intervention mécanique.

Les vibrations et les bruits sont des **indicateurs objectifs de l'état de santé** des matériels comportant au moins une pièce en mouvement.

### 1.2 Objectifs de la Démarche

- Réduire le nombre d'arrêts sur casse (arrêts non planifiés)
- Fiabiliser l'outil de production
- Augmenter le taux de disponibilité
- Mieux gérer le stock de pièces détachées
- Diminuer les coûts directs et indirects de maintenance
- Détecter précocement les risques de défaillance
- Mieux planifier les interventions
- Réduire la durée et l'importance des interventions

### 1.3 Deux Technologies de Surveillance Vibratoire

**A. Par mesure directe du déplacement des parties tournantes (arbres)**

- Réalisée à l'aide de **capteurs à courants de Foucault**
- Technologie lourde et coûteuse
- Application courante : surveillance des machines à **paliers hydrauliques (à coin d'huile)**
- Surveillance quasi-exclusivement **on-line** (temps réel)
- Les capteurs mesurent en permanence les déplacements des arbres et permettent le déclenchement immédiat d'alarmes

**B. Par mesure de l'accélération subie par les parties fixes (carters)**

- Réalisée à l'aide d'**accéléromètres** reliés à un collecteur de données
- Moyens beaucoup plus accessibles aux petites structures (PMI)
- Se prête à la surveillance **on-line** et à la surveillance **périodique** (rondes)
- Coûts de préparation et de mise en œuvre très largement inférieurs

> **Note industrielle :** L'industrie lourde (turbomachines) a souvent recours à l'ensemble des deux technologies afin de réaliser une surveillance vibratoire performante. Pour les machines sur roulements (majorité), la surveillance périodique sur parties fixes permet une analyse très fine.

---

## 2. Les Différentes Formes de Maintenance

### 2.1 Arbre des Types de Maintenance

```
                         MAINTENANCE
                        /           \
           Préventive               Corrective
          /         \                    |
   Systématique   Conditionnelle   (après panne)
       |                |
  (intervalles      (état du
   réguliers)       matériel)
```

### 2.2 Maintenance Corrective

**Principe :** Réparation après l'incident (après arrêt ou casse).

**Caractéristiques :**
- Nécessite une équipe d'entretien surdimensionnée
- Ne permet pas de maîtriser la disponibilité des équipements
- Coûts de réparation élevés (dommages secondaires possibles)

**Diagramme temporel :**
```
Production → [PANNE] → Réparation → Production → [PANNE] → ...
```

### 2.3 Maintenance Préventive Systématique

**Principe :** Intervention à intervalles réguliers selon un échéancier préétabli.

**Caractéristiques :**
- N'évite pas certains incidents (une panne peut survenir juste après une révision)
- Engendre le remplacement prématuré de composants encore en bon état
- Ne permet pas de prendre en compte l'évolution réelle de l'état

**Diagramme temporel :**
```
Production → Révision → Production → Révision → Production → [PANNE] → Réparation
```

### 2.4 Maintenance Préventive Conditionnelle (MPC)

**Définition :** Maintenance préventive subordonnée au franchissement d'un seuil prédéterminé d'un paramètre significatif de l'état de dégradation du bien.

**Principe de fonctionnement :**
- Mesures à intervalles réguliers
- Détection du problème **avant** la défaillance prévue
- Dépassement du seuil d'alerte → Préparation d'une intervention
- Dépassement du seuil de danger → Intervention immédiate

**Diagramme temporel :**
```
─────────────────────── Seuil de danger ─────────────
─── Seuil d'alarme ──────────────────────────────────
Production ─────→ [alerte] → Intervention → Production
```

La MPC est une maintenance qui se fait **avant la panne** (Préventive) et qui est **conditionnée** (Conditionnelle) par l'état de la machine.

### 2.5 Maintenance Prévisionnelle

**Définition :** Maintenance préventive subordonnée à l'analyse de l'évolution surveillée de paramètres significatifs de la dégradation du bien, permettant de **retarder** et **planifier** les interventions.

### 2.6 Avantages de la Maintenance Conditionnelle

- Diminution des arrêts de production
- Diminution du nombre d'arrêts intempestifs (augmentation de la disponibilité des équipements)
- Suppression des arrêts systématiques
- Limitation de la gravité des dégradations → réduction des coûts de réparation et amélioration de la sécurité
- Programmation des réparations à la convenance de la production
- Approvisionnement des pièces de rechange en fonction des besoins réels → réduction des coûts de stockage
- Planification des interventions → organisation optimale, motivation du personnel
- Interventions plus ciblées → localisation préalable des pannes, amélioration de la qualité des réparations

### 2.7 Les 3 Techniques Principales de MPC

**1. Thermographie infrarouge**
- Mesure la température de composants sans contact
- Tout défaut se traduisant par une élévation de température peut être détecté
- Coût : de 7 000 € (modèle de base) à 60 000 € (analyse poussée)

**2. Analyse des huiles**
- Surveille l'état de l'huile (ne la changer que lorsqu'elle est dégradée)
- Mesure l'état de santé de la machine (à l'instar d'une analyse de sang)
- Spectromètre mesurant plusieurs éléments (Fe, Zn, ...) : plusieurs dizaines de k€

**3. Analyse vibratoire**
- Principalement utilisée pour la surveillance des machines tournantes
- Toute machine tournante vibre → les vibrations sont conséquences de défauts
- Plus la machine vibre → plus les défauts sont importants
- Coût : à partir de 1 500 € (collecteur niveau global) à plus de 30 000 € (collecteur + logiciel d'analyse)

---

## 3. Fondements Théoriques des Vibrations

### 3.1 Définition d'une Vibration

> **Une vibration est un mouvement autour d'une position d'équilibre.**

Les vibrations sont présentes partout dans la vie quotidienne :
- **Utile :** rasoir électrique, haut-parleur
- **Agréable :** balançoire, instrument de musique
- **Désagréable :** marteau-piqueur, mal de mer
- **Fatigante ou nuisible :** machines industrielles, tremblements de terre

### 3.2 L'Oscillateur Harmonique Simple — Équation de Base

Pour tout système oscillant à un degré de liberté, le mouvement vibratoire **linéaire** est régi par l'équation différentielle :

```
q̈ + ω₀² q = 0
```

où :
- `q` = coordonnée généralisée (écart par rapport à la position d'équilibre)
- `ω₀` = pulsation propre du système (rad/s)

**Solution :**
```
q(t) = A·cos(ω₀·t + φ)
```
- `A` = amplitude des oscillations
- `φ` = phase initiale
- Les conditions initiales q(t=0) = q₀ et q̇(t=0) = q̇₀ déterminent A et φ

**Pulsation propre ω₀ :**
```
ω₀ = √(b₀/a₀) = √(k/m)
```
où `k` est la raideur du ressort et `m` la masse.

> **Important :** La pulsation propre ω₀ ne dépend que des caractéristiques du système (masse, raideur), pas des conditions initiales.

### 3.3 Système Masse-Ressort-Amortisseur

L'équation différentielle du mouvement d'un système masse-ressort avec amortissement visqueux s'écrit :

```
m·ẍ + α·ẋ + k·x = 0
```

ou sous forme normalisée :

```
ẍ + 2δẋ + ω₀²x = 0
```

avec :
```
δ = α/(2m)      (facteur d'amortissement)
ω₀ = √(k/m)    (pulsation propre)
```

### 3.4 Régimes d'Amortissement Libre

**Cas 1 : Système suramorti (δ > ω₀)**

Le système est apériodique — retour à l'équilibre sans oscillation :

```
q(t) = A₁·exp[(-δ - √(δ²-ω₀²))t] + A₂·exp[(-δ + √(δ²-ω₀²))t]
```

**Cas 2 : Amortissement critique (δ = ω₀)**

Retour le plus rapide possible sans oscillation :

```
q(t) = (A₁ + A₂·t)·e^(-δt)
```

**Cas 3 : Système sous-amorti (δ < ω₀) — LE CAS PRATIQUE DES MACHINES**

Oscillations amorties — le cas le plus courant en pratique industrielle :

```
q(t) = A·e^(-δt)·cos(ωₐt + φ)
```

avec :
```
ωₐ = √(ω₀² - δ²)    (pseudo-pulsation)
Tₐ = 2π/ωₐ           (pseudo-période)
```

> Pour les systèmes faiblement amortis (δ << ω₀) : ωₐ ≈ ω₀ (comme dans les machines bien équilibrées).

### 3.5 Oscillations Forcées — Réponse à une Excitation Harmonique

L'équation différentielle avec excitation sinusoïdale A(t) = A₀·cos(Ωt) :

```
ẍ + 2δẋ + ω₀²x = A₀·cos(Ωt)
```

**Solution permanente (régime stationnaire) :**

```
x(t) = X₀·cos(Ωt + φ)
```

avec :
```
             A₀
X₀ = ────────────────────────
     √[(ω₀²-Ω²)² + 4δ²Ω²]


φ = -arctan(2δΩ / (ω₀²-Ω²))
```

**Résonance :** La résonance en amplitude se produit à :
```
Ω_R = √(ω₀² - 2δ²)
```

À la résonance (pour faibles amortissements : δ << ω₀) :
```
X₀_max = A₀ / (2δ·ω₀)
```

> **Implication pratique :** Lors du démarrage d'une machine, si la vitesse de rotation passe par la vitesse critique (fréquence propre de la structure), une amplification importante des vibrations se produit. Il faut franchir cette vitesse rapidement.

### 3.6 Excitation Périodique et Décomposition de Fourier

Toute excitation périodique A(t) de période T peut se décomposer en série de Fourier :

```
A(t) = a₀/2 + Σ [aₙ·cos(nωt) + bₙ·sin(nωt)]
              n=1
```

La réponse du système est alors la **superposition** des réponses à chaque composante harmonique.

> **Application directe à l'analyse vibratoire :** Le signal vibratoire d'une machine tournante est une somme de sinusoïdes (série de Fourier). Chaque fréquence présente dans le spectre correspond à une source d'excitation spécifique dans la machine. C'est le principe fondamental de l'analyse spectrale.

### 3.7 Coefficient de Qualité d'un Oscillateur

```
Q = ω₀/B = ω₀/(2δ)
```

où B = Ω₂ - Ω₁ est la **bande passante** (plage de fréquences pour lesquelles la puissance est ≥ P_max/2).

Un coefficient Q élevé indique un système peu amorti, très sélectif en fréquence.

### 3.8 Systèmes à Deux Degrés de Liberté — Modes Propres

Pour un système à deux degrés de liberté (masses m₁, m₂ ; ressorts k₁, k₂ ; ressort de couplage K), les deux **pulsations propres** ω₁ et ω₂ sont solutions de l'équation caractéristique :

```
ω⁴ - ω²·[(k₁+K)/m₁ + (k₂+K)/m₂] + (k₁k₂+k₁K+k₂K)/(m₁m₂) = 0
```

**Modes propres :**
- **Mode 1 (fondamental) :** les deux masses oscillent **en phase** à ω₁
- **Mode 2 (harmonique) :** les deux masses oscillent **en opposition de phase** à ω₂

> **Extension aux machines réelles :** Une machine industrielle est un système à N degrés de liberté possédant N modes propres. Le spectre de vibration reflète l'excitation de ces modes par les défauts mécaniques.

### 3.9 Phénomène d'Antirésonance — Étouffeur Dynamique

Pour un système à deux degrés de liberté, il existe une **pulsation d'antirésonance** ΩA telle que la masse principale reste immobile :

```
ΩA = √(K/M)
```

**Application pratique :** Si on choisit K et M tels que k/m = K/M, on annule la vibration de la masse principale à la pulsation d'excitation. C'est le principe des **étouffeurs dynamiques de vibrations** utilisés dans l'industrie.

### 3.10 Impédance Mécanique

L'impédance mécanique est définie comme :
```
ZE = F̄/V̄   (rapport des amplitudes complexes de la force et de la vitesse)
```

Impédances des éléments de base :
```
Amortisseur : Z_α = α
Masse :        Z_m = jmΩ
Ressort :      Z_k = k/(jΩ) = -jk/Ω
```

---

## 4. Principe de l'Analyse Vibratoire des Machines Tournantes

### 4.1 Structure d'une Machine Tournante

Une machine tournante se décompose en trois éléments fondamentaux :
- **Un rotor :** tourne autour d'une ligne de rotation à la vitesse angulaire Ω
- **Une structure :** constituée du carter, des paliers (coussinet, stator) et du bâti
- **Des liaisons :** roulements ou paliers lisses entre le rotor et la structure

```
     Ligne de rotation
          |
    ─────────────   ← Liaison (roulement)
    | ROTOR      |
    ─────────────
    Palier/Coussinet (Structure)
```

### 4.2 Origine Physique des Vibrations

**Vibration = Force × Mobilité**

```
     défaut = force           vibrations = symptôme
          ↓                          ↑
   Forces Internes  ──────→   Mobilité de la structure
   (défauts mécaniques)       (jeux, manque de rigidité)
```

- La rotation du rotor engendre des forces qui dépendent de l'état de la machine
- Ces efforts se répercutent sur tous les éléments de la machine
- Des vibrations sont créées si ces efforts rencontrent une **mobilité** (jeu ou élément peu rigide)
- Les vibrations sont proportionnelles à la sévérité des défauts

> **Principe fondamental :** Toute machine tournante vibre. Les vibrations sont le **symptôme** des défauts (la force) combiné à la **mobilité** de la structure. Les machines réelles ne sont jamais parfaites : défauts de fabrication, jeux de fonctionnement, paramètres de fonctionnement (température, vitesse).

### 4.3 La Signature Vibratoire

Le **signal vibratoire** contient des informations sur :
- Les efforts engendrés par le fonctionnement de la machine
- L'état mécanique des structures
- Les défauts présents

Il permet d'avoir une image des contraintes internes et de diagnostiquer les défauts de fonctionnement. Cependant, ce signal est riche en informations et n'est pas directement utilisable : il contient trop d'informations qu'il faut traiter et trier.

**Ces vibrations/bruits sont en étroite corrélation avec :**
- Les balourds
- Les désalignements
- Les défauts d'entraînement (courroies, engrenages)
- Les usures et déformations

### 4.4 Suivi Vibratoire — Ce qu'il Permet

Le suivi vibratoire apporte la connaissance de l'état réel de la machine. À tout moment, il permet de suivre son évolution pour programmer l'arrêt du système en tenant compte de :
- La production
- La disponibilité de l'équipe d'intervention
- L'approvisionnement des pièces de rechange

Ce suivi permet également de :
- Supprimer les arrêts pour inspections et visites
- Détecter précocement les risques de défaillance
- Mieux planifier les interventions
- Réduire la durée et l'importance des interventions → réduction des coûts directs et indirects

### 4.5 Surveillance On-line vs Off-line

**Surveillance On-line (continue)**
- La machine est surveillée en permanence par un **moniteur de vibrations**
- Données continues transmises à une station de surveillance
- Détection immédiate des anomalies → alarmes et déclenchements automatiques
- Plus coûteux mais indispensable pour les machines critiques

**Surveillance Off-line (périodique)**
- Mesures effectuées lors de **rondes** à intervalles réguliers selon un calendrier préétabli
- Utilisation d'un **collecteur de données** portable
- Les collecteurs modernes permettent également d'analyser les mesures
- Données déchargées sur PC équipé de logiciels spécifiques
- Convient aux PMI et aux machines non critiques

---

## 5. Capteurs et Matériel de Mesure

### 5.1 La Chaîne de Mesure

```
Vibration de la machine
        ↓
   CAPTEUR (accéléromètre)
        ↓
Signal électrique (mV AC)
        ↓
COLLECTEUR / ANALYSEUR
        ↓
Traitement et stockage
        ↓
Diagnostic
```

### 5.2 Le Capteur — Rôle et Types

**Rôle :** Transformer la vibration mécanique en signal électrique exploitable.

Les 3 grandeurs mesurables en technique vibratoire sont :
- Le **déplacement** (µm ou mm crête-à-crête)
- La **vitesse** (mm/s efficace)
- L'**accélération** (m/s² ou g ou mg)

**En analyse vibratoire des machines tournantes, on utilise principalement des accéléromètres** positionnés au niveau des paliers.

### 5.3 Positionnement des Capteurs

Positionnement **correct :**
- Capteur **A** : position **radiale** (perpendiculaire à l'axe de rotation)
- Capteur **C** : position **axiale** (parallèle à l'axe de rotation)

Positionnement **incorrect :**
- Capteur **B** : trop loin du palier → signal atténué
- Capteur **D** : sur structure non rigide → résultats faussés

> **Règle fondamentale :** Les capteurs doivent être positionnés **au plus près des paliers** sur des **structures rigides**.

### 5.4 Modes de Fixation (Par ordre croissant de qualité de mesure)

| Mode de fixation | Gamme de mesure | Qualité |
|---|---|---|
| Pointe de touche | Limitée | Faible |
| Aimant | Moyenne | Moyenne |
| Collage direct | Bonne | Bonne |
| Pastilles à coller | Très bonne | Très bonne |
| **Goujon (vissé)** | **Maximale** | **Excellente** |

> **La fixation par goujon** est la solution donnant le résultat le plus fidèle à la réalité : c'est la solution de montage la plus rigide et provoquant le moins de pertes du signal.

### 5.5 Collecteur de Données

Le collecteur de données est un instrument portable qui :
- Enregistre et stocke les signaux vibratoires
- Peut analyser les mesures (certains modèles)
- Suit des **rondes programmées** (points de mesure, paramètres associés)
- Se connecte à un PC pour décharger les données dans une base de données

**Organisation d'une ronde :**
1. Programmer les points de mesure dans le logiciel
2. Charger la ronde dans le collecteur
3. Effectuer les mesures selon la ronde définie
4. Décharger les données dans le PC
5. Analyser et comparer avec les mesures précédentes

---

## 6. Grandeurs Vibratoires et Traitement du Signal

### 6.1 Les Trois Grandeurs Fondamentales

Pour un mouvement vibratoire x(t) = X·sin(ωt + φ), les trois grandeurs caractéristiques sont liées entre elles par :

```
Déplacement x(t) = X·sin(ωt + φ)          [µm, mm]
Vitesse     ẋ(t) = Xω·cos(ωt + φ)         [mm/s]
Accélération ẍ(t) = -Xω²·sin(ωt + φ)      [m/s², g, mg]
```

Par analogie avec le système masse-ressort :
- **Déplacement :** La position de la masselotte varie de part et d'autre du point d'équilibre
- **Vitesse :** Nulle aux extrémités, maximale au point d'équilibre
- **Accélération :** Permet à la masselotte de passer de sa vitesse minimale à maximale

### 6.2 Indicateurs d'Amplitude

**Valeur Efficace (RMS — Root Mean Square) :**
```
X_eff = √(1/T · ∫₀ᵀ x²(t)dt)
```
C'est la grandeur la plus couramment utilisée pour la surveillance.

**Valeur Moyenne :**
```
X_moy = 1/T · ∫₀ᵀ |x(t)| dt
```

**Valeur Crête :**
```
X_crête = valeur maximale du signal
```

**Valeur Crête-à-crête :**
```
X_cc = X_crête_max - X_crête_min
```

**Facteur de Crête (Crest Factor) :**
```
FC = X_crête / X_eff
```
Le facteur de crête est particulièrement utilisé pour la détection des défauts de roulements (impacts ponctuels). Un FC élevé indique des chocs dans le signal.

### 6.3 Décomposition de Fourier et Spectre de Fréquences

**Principe fondamental :**
Tout signal périodique peut, selon Fourier, se décomposer en une somme de sinusoïdes (série de Fourier) :

```
S(t) = Σ Sₙ·sin(ωₙ·t + φ)
```

> **Le spectre est une représentation de l'amplitude d'une grandeur en fonction de la fréquence.**

Le spectre d'un signal sinusoïdal est un **pic unique** à la fréquence du signal.

Un signal vibratoire étant la somme de plusieurs sinus, son spectre sera une **succession de pics** aux différentes fréquences caractéristiques du signal.

**Transformée de Fourier (FFT — Fast Fourier Transform) :**
La FFT est l'outil mathématique qui transforme le signal temporel x(t) en spectre fréquentiel X(f). Elle est la base de toute l'analyse spectrale vibratoire.

### 6.4 Résolution Spectrale

Avec la technologie numérique actuelle, les collecteurs décomposent le spectre en un certain nombre de **lignes** (typiquement 800 lignes).

```
Résolution spectrale = Δf/800
```

Exemples :
- Spectre BF [0-200 Hz] → résolution = 200/800 = **0,25 Hz**
- Spectre MF [0-2000 Hz] → résolution = 2000/800 = **2,5 Hz**
- Spectre HF [0-20000 Hz] → résolution = 20000/800 = **25 Hz**
- Spectre Zoom [98-102 Hz] → résolution = 4/800 = **0,005 Hz**

**Types de spectres utilisés :**
- Spectres **BF** (Basses Fréquences) : entre 0 et 200 Hz — phénomènes basse fréquence (balourd, désalignement)
- Spectres **MF** (Moyennes Fréquences) : entre 0 et 2000 Hz
- Spectres **HF** (Hautes Fréquences) : entre 0 et 20000 Hz — défauts de roulements, engrenages
- Spectres **Zoom** haute résolution [f1-f2]

### 6.5 Représentation des Spectres — Choix des Échelles

**Échelle linéaire d'amplitude et de fréquence :**
- Intéressante pour les gammes d'analyse restreintes
- Inadaptée aux spectres étendus
- Seuls les défauts de haute fréquence sont repérables facilement

**Échelle linéaire d'amplitude et logarithmique de fréquence :**
- Les phénomènes basses et moyennes fréquences sont bien visibles
- La HF reste discernable

**Échelle logarithmique d'amplitude et de fréquence (recommandée) :**
- Les pics de faibles importances apparaissent parfaitement
- Les modulations de chocs périodiques visibles
- L'importance du bruit de fond aussi visible
- **C'est la représentation de base à utiliser pour visualiser tous les phénomènes**

### 6.6 Le Décibel en Vibratoire

L'amplitude en décibels est définie par :

```
A(dB) = 20·log(A/A₀)
```

où A₀ est la **valeur de référence** (première mesure de la campagne de surveillance).

**Tableau de correspondance dB / rapport d'amplitudes :**

| A/A₀ | 0,10 | 0,32 | **1 (réf.)** | 1,12 | 1,41 | **2,00** | 2,51 | 3,16 | **10,00** |
|------|------|------|------|------|------|------|------|------|------|
| A (dB) | -20 | -10 | **0** | 1 | 3 | **6** | 8 | 10 | **20** |

**Niveaux de référence pour les seuils :**

| Niveau | Référence | Alerte | Danger |
|--------|-----------|--------|--------|
| A/A₀ | 1 | **2,00** | **10,00** |
| A (dB) | 0 | **6 dB** | **20 dB** |

> **Interprétation :** Une amplitude vibratoire 2 fois plus grande que la référence correspond à +6 dB → niveau d'alerte. Une amplitude 10 fois plus grande → +20 dB → niveau de danger.

---

## 7. Les Principaux Défauts et leurs Signatures Spectrales

> **Rappel important :** Les pics observés sur les spectres ne sont pas tous des défauts. Il existe dès l'origine du balourd, du désalignement, des moteurs imparfaits, des pics d'engrenement, etc. L'analyse consiste à identifier les **évolutions anormales** de ces composantes.

### 7.1 Déséquilibre — Défaut de Balourd

#### 7.1.1 Définition et Types

Le balourd est lié à une **répartition non homogène de la masse autour de l'axe de rotation** : l'axe d'inertie de l'arbre n'est pas confondu avec l'axe de rotation.

| Type | Description |
|------|-------------|
| **Balourd statique** | L'axe d'inertie de l'arbre est parallèle à l'axe de rotation |
| **Balourd de couple** | L'axe d'inertie n'est plus colinéaire à l'axe de rotation (ils forment un angle) |
| **Balourd dynamique** | Combinaison des deux précédents — cas le plus courant |

#### 7.1.2 Physique du Balourd

En ajoutant une masse M en un point du rotor, lors de la rotation, elle exerce une force radiale centrifuge :

```
F = M·r·ω²
```

Le signal vibratoire aura une période de **1 tour** de rotor.

**Calcul de la fréquence :**
```
f = N/60   [Hz]
```
où N est la vitesse de rotation en tr/min.

*Exemple : Pour N = 1500 tr/min → f = 1500/60 = **25 Hz***
*Pour N = 2925 tr/min → f = 2925/60 = **48,75 Hz***

#### 7.1.3 Balourd Statique vs Dynamique

- **Balourd statique :** Les signaux aux points P1 et P2 (deux paliers) sont **en phase**
- **Balourd dynamique :** Les signaux en P1 et P2 sont **déphasés de 180°** (forces centrifuges alternées)

#### 7.1.4 Signature Spectrale du Balourd

Le balourd se manifeste par une énergie vibratoire localisée **à la fréquence de rotation F₀** et ses harmoniques (2F₀, 3F₀, ...) :

```
Amplitude
    |
    |█                         (pic dominant à F₀)
    |  ▄       ▂
    |────────────────────────→ Fréquence
        F₀    2F₀   3F₀
```

**Caractéristique :** Présence d'un pic prépondérant à la fréquence de rotation F₀.

*Exemple réel : Spectre d'un ventilateur tournant à 2925 tr/min → pic à 48,75 Hz traduisant la présence d'un balourd.*

### 7.2 Défaut d'Alignement (Désalignement)

#### 7.2.1 Définition et Types

Un défaut d'alignement apparaît lorsqu'un arbre doit entraîner un autre arbre, souvent par l'intermédiaire d'un accouplement.

| Type | Description |
|------|-------------|
| **Décalage d'axe** | Les axes sont parallèles mais non concentriques |
| **Désalignement angulaire** | Les axes ne sont pas parallèles |

En réalité, les défauts d'alignement sont une **combinaison** des deux.

**Autres causes d'un désalignement :**
- Défaut de montage d'un palier
- Mauvais calage des pattes de fixation
- Déformation du châssis (contraintes thermiques) → flexion de l'arbre

#### 7.2.2 Conséquences

Le défaut d'alignement est l'une des **principales causes de réduction de la durée de vie des équipements**. Il crée des efforts importants qui entraînent la dégradation rapide des accouplements et des paliers.

**Remède :** Lignage laser — quelques heures d'immobilisation seulement.

#### 7.2.3 Physique du Désalignement

Le signal temporel d'un défaut d'alignement présente un phénomène périodique à la fréquence de rotation **mais aussi** des phénomènes se répétant chaque **½ tour** et **⅓ tour**.

#### 7.2.4 Signature Spectrale du Désalignement

Un défaut d'alignement est révélé par un pic d'amplitude prépondérant à généralement **2 fois la fréquence de rotation** (parfois 3 ou 4 fois) :

```
Amplitude
    |
    |    █
    |▄       ▂
    |────────────────────────→ Fréquence
        F₀   2F₀   3F₀
             ↑
          pic dominant
```

**Caractéristique :** Présence de composantes d'ordre 2, 3 ou même 4 de la fréquence de rotation avec des amplitudes supérieures à celle d'ordre 1.

*Exemple réel : Spectre d'un compresseur à 1500 tr/min → Fo = 25 Hz, 2Fo = 50 Hz, 3Fo = 75 Hz. On observe un pic à 25 Hz (point A) et un pic plus important à 50 Hz (2×Fo) traduisant le désalignement.*

### 7.3 Défaut de Desserrage et de Jeu

#### 7.3.1 Définition

Par desserrage, on entend un manque de rigidité de montage sur une structure. Cela peut être dû à :
- Un desserrage effectif des vis de fixation
- Une fissuration d'ancrage ou de bâti
- Des défauts comme le balourd qui entraînent le bâti à se désolidariser de la structure

Cela entraîne un **signal temporel écrêté** (à cause de l'impact du palier).

#### 7.3.2 Signature Spectrale du Desserrage

```
Amplitude
    |
    |█
    |   ▄
    |      ▄  █  ▄     ▄
    |────────────────────────→ Fréquence
     0,5Fo  Fo 1,5Fo 2Fo 3Fo 4Fo 5Fo
```

Le spectre fait apparaître :
- Des harmoniques de la fréquence de rotation (comme les autres défauts)
- **Des sous-harmoniques à ½ et ⅓ de la fréquence de rotation**

#### 7.3.3 Jeu dans les Roulements

Le jeu se retrouve en général dans le roulement :
- **Jeu de fondation :** souvent de nombreuses harmoniques + parfois des sous-harmoniques
- **Jeu d'arbre :** séries de composantes sous-harmoniques à ½, ⅓, ... 1/RPM

### 7.4 Défauts de Transmission par Courroies

#### 7.4.1 Physique

Le principal défaut rencontré dans ce type de transmission est lié à une **détérioration localisée de la courroie** (partie arrachée, défaut de jointure, ...) impliquant un effort ou un choc particulier à la fréquence de passage de ce défaut (Fc).

#### 7.4.2 Calcul de la Fréquence de Passage de la Courroie

```
Fc₁ = (N₁/60)·(π·D₁/L)    [pour la poulie 1]
Fc₂ = (N₂/60)·(π·D₂/L)    [pour la poulie 2]
```

où :
- N₁, N₂ = vitesses de rotation des roues (tr/min)
- D₁, D₂ = diamètres des poulies
- L = longueur de la courroie

#### 7.4.3 Signature Spectrale des Défauts de Courroies

```
Amplitude
    |█
    |   ▄▄         ▄
    |   Fp 2Fp     F₀
    |────────────────────────→ Fréquence
   Fp           F₀
(fréquence   (fréquence
  passage)    rotation)
```

L'image vibratoire donne un **pic d'amplitude importante à la fréquence de passage des courroies**, ou de ses harmoniques.

> **Note :** C'est un défaut peu évident à localiser. Seule l'expérience acquise permet une bonne analyse.

### 7.5 Défauts de Denture d'Engrenages

#### 7.5.1 Fréquence d'Engrènement

Un engrenage est composé de deux roues dentées de Z₁ et Z₂ dents tournant à des fréquences de rotation F₁ et F₂. L'engrènement se fait au rythme d'engagement des dents selon la **fréquence d'engrènement Fe** :

```
Fe = Z × Frot
```

> **Propriété importante :** Il n'y a qu'une seule fréquence d'engrènement pour un engrenage, quelle que soit la roue considérée :

```
Fe = Z₁ × F₁ = Z₂ × F₂
```

*Exemple : Z₁ = 60, Z₂ = 48, F₁ = 25 Hz → Fe = 60 × 25 = 1500 Hz*

#### 7.5.2 Spectre d'un Engrenage Sain

Si la denture est correcte et sans phénomène parasite, le spectre vibratoire est constitué de composantes dont les fréquences correspondent à la **fréquence d'engrènement Fe et ses harmoniques** :

```
Amplitude
    |
    |   █
    |      ▄
    |         ▂
    |────────────────────────→ Fréquence
        Fe   2Fe   3Fe
```

#### 7.5.3 Signature d'une Détérioration de Dent

Si l'une des roues possède une dent détériorée, il se produit un choc périodique à la fréquence de rotation de la roue considérée (F₁ ou F₂). Le spectre montre :
- La fréquence d'engrènement Fe
- **Un pic à la fréquence de rotation de la roue défectueuse**
- Un **peigne de raie** (nombreuses harmoniques) dû au phénomène de choc

```
Amplitude
    |
    |               █         (Fe)
    |█  █  █  █  █           ← Peigne à F1 (dent défectueuse)
    |────────────────────────→ Fréquence
     F1            Fe
```

Les harmoniques de la fréquence de la dent constituent un **peigne de raie** dont la fréquence est celle du défaut.

#### 7.5.4 Signature d'un Défaut d'Excentricité (Faux Rond)

Si l'arbre ou le pignon présente un défaut d'excentricité, une **modulation d'amplitude** apparaît à la fréquence d'engrènement. L'image vibratoire présente autour de Fe (ou de ses harmoniques) des **raies latérales** (bandes latérales de modulation d'amplitude) dont le pas correspond à la fréquence de rotation de l'arbre portant le défaut :

```
Amplitude
    |
    |     ▄▄█▄▄              ← Bandes latérales espacées de F1
    |                 ▄▄█▄▄
    |────────────────────────→ Fréquence
     F1   Fe          2Fe
```

Les amplitudes des bandes latérales sont généralement très faibles devant l'amplitude de Fe.

#### 7.5.5 Évaluation de la Gravité des Défauts d'Engrenages

Deux règles toujours vérifiées :
1. Si les amplitudes du peigne de raies ne dépassent pas celle de la fréquence d'engrènement, l'engrènement peut être considéré comme bon.
2. Une image **dissymétrique** des modulations autour de Fe est caractéristique d'un engrènement dégradé.

*Exemple réel : Pignon à 1500 tr/min avec 33 dents → Fe = 25 × 33 = 825 Hz. On observe des bandes latérales espacées de 25 Hz autour de 825 Hz.*

### 7.6 Défauts Électriques

Pour les machines électriques, les fréquences significatives d'une anomalie électromagnétique sont des **multiples de la fréquence du courant d'alimentation Fa** (50 Hz en Europe).

**Caractéristique :** La plupart des défauts électriques se traduisent par un **pic important à 2 fois la fréquence d'alimentation** (2 × 50 = **100 Hz**).

> **Attention :** Pour bien identifier ce défaut, il est parfois nécessaire de faire un **zoom** sur cette fréquence pour le différencier d'une harmonique de la fréquence de rotation. Exemple : pour un rotor à 1500 tr/min → Frot = 25 Hz → 4ème harmonique = 100 Hz.

### 7.7 Circuits Hydrauliques — Passages d'Aubes

#### 7.7.1 Pompes et Ventilateurs

Le passage des aubes devant le bec de la volute d'une pompe (ou le passage des pales d'un ventilateur) provoque un pic à la **fréquence de passage des aubes** :

```
f_aubes = n × fr
```

où n est le nombre d'aubes/pales et fr la fréquence de rotation.

Ce défaut n'est **pas directionnel** — il se repère aussi bien en radial qu'en axial.

**Origines possibles :**
- Mécaniques : mauvais calage axial de l'impulseur, jeu de bec de volute insuffisant
- Hydrauliques : débit trop bas
- Encrassement des aubes ou pales (peut aussi provoquer du balourd)

#### 7.7.2 Cavitation

La cavitation se manifeste par l'apparition de bulles de vapeur dans l'écoulement du liquide. Lorsqu'elles implosent sur les rotors des pompes ou sur les aubages des turbines, elles peuvent provoquer l'érosion des pièces en métal.

**Signature :** La cavitation se traduit par une **augmentation générale du bruit de fond** — il n'y a pas de raie caractéristique. Toutes les fréquences sont excitées de manière aléatoire.

### 7.8 Défauts Spécifiques aux Roulements

Les roulements sont des composants critiques dont la surveillance est un enjeu majeur de la maintenance vibratoire.

#### 7.8.1 Durée de Vie des Roulements

La durée de vie théorique des roulements est donnée par la formule :

```
L₁₀ = (C/P)ᵖ
```

où :
- L₁₀ = durée de vie en 10⁶ tours
- C = charge nominale (donnée constructeur)
- P = charge dynamique appliquée au roulement
- p = 3 pour les roulements à billes, 3,33 pour les roulements à rouleaux

> La durée de vie d'un roulement sera fortement réduite par les efforts dynamiques. Il est important de corriger les problèmes de délignage, balourd, serrage, etc.

#### 7.8.2 Processus de Dégradation d'un Roulement

**Phase 1 : Bruit de fond aléatoire**
- Lors du fonctionnement normal, les contacts métalliques entre éléments roulants et cages créent un bruit de fond aléatoire → spectre plat

**Phase 2 : Début d'usure — Fêlure**
- La plupart des usures débutent par une fêlure qui se transforme en craquelure
- La craquelure produit des impacts énergétiques en haute fréquence

**Phase 3 : Usure développée**
- Les défauts tendent à se lisser
- Il y a moins d'impacts
- Le bruit de fond de la bonne piste devient modulé
- Dès que le défaut est significatif, les billes vont éroder la cage interne en sautant

#### 7.8.3 Géométrie et Fréquences Caractéristiques

Pour un roulement de diamètre primitif DR = (D1+D2)/2, de diamètre de bille DB, d'angle de contact β et de n billes :

```
BPFO (Ball Pass Frequency Outer race — bague externe) :
= n/2 × fr × (1 - DB/DR × cos β)

BPFI (Ball Pass Frequency Inner race — bague interne) :
= n/2 × fr × (1 + DB/DR × cos β)

BSF (Ball Spin Frequency — bille) :
= fr × DR/DB × [1 - (DB/DR × cos β)²]

FTF (Fundamental Train Frequency — cage) :
= 1/2 × fr × (1 - DB/DR × cos β)
```

**Signification des fréquences :**
- **BPFO** = fréquence de passage d'une bille sur un défaut de piste externe
- **BPFI** = fréquence de passage d'une bille sur un défaut de piste interne
- **FTF** = fréquence de passage d'un défaut de cage
- **BSF** = fréquence de passage d'un défaut de bille sur les bagues

> **Remarque :** La formule de FTF dépend du montage. Si la bague interne est fixe et la bague externe tourne, la formule de FTF devient : FTF = 0,5 × fr × (1 + DB/DR × cos β).

#### 7.8.4 Modulation d'Amplitude des Fréquences Roulement

**Pour la BPFI (bague interne tournante solidaire de l'arbre) :**
La charge appliquée au roulement reste dans la même direction. Le défaut tourne avec la bague interne → l'amplitude de la vibration est **modulée par la fréquence de rotation** (le défaut passe dans la zone la plus chargée une fois par tour).

**Pour la BPFO (bague externe fixe) :**
Le balourd tourne à la vitesse de rotation. La bague externe est fixe → l'amplitude est modulée par le balourd → **modulation à la fréquence de rotation**.

#### 7.8.5 Signatures Vibratoires des Défauts d'Écaillage

Les défauts de type écaillage (bague externe, interne, ou élément roulant) génèrent :
- Un **peigne de raies** à la fréquence du défaut (Fdéfaut = BPFI, BPFO, FTF ou BSF)
- Des **bandes latérales** espacées de la fréquence de rotation à chaque composante du peigne

```
Amplitude
    |
    |▄     ▄███▄     ▄     ▄███▄          ▄███▄
    |───────────────────────────────────────────→ Fréquence
     Fo   Fdéfaut   2Fdéfaut            k×Fdéfaut
           ↑ bandes latérales à Fo
```

#### 7.8.6 Défaut de Billes

Un défaut de billes génère plusieurs groupes de pics composés d'un **pic central** et de **modulations** autour de ce pic central :
- Le pic central correspond généralement à BSF
- La modulation correspond au défaut de cage (FTF)

*La fréquence à laquelle les billes tournent autour de leur propre axe dans la cage est BSF.*

#### 7.8.7 Rupture de Cage

Lorsque la cage d'un roulement casse, les billes ne sont plus maintenues à égale distance et se regroupent → excentricité de l'arbre et balourd tournant à la vitesse de la cage.

**Signature :** Raie unique à la **fréquence FTF** ≈ 0,4 × vitesse de rotation.

> Ce type de défaut est très difficilement détectable car un roulement dont la cage est rompue se détériore très rapidement.

#### 7.8.8 Défauts de Déversement

Le déversement de bague (interne ou externe) peut être la conséquence d'un désalignement :

- **Déversement de bague externe :** Présence de fₒₑₛ, fₒₑ, 2fₒₑ, 3fₒₑ
- **Déversement de bague interne :** Présence de fₘₙ et fₐ
- **Déversement simultané :** Présence des deux types de fréquences

#### 7.8.9 Quand Changer les Roulements ?

L'information la plus importante est la **courbe de tendance** (suivi de l'évolution des indicateurs dans le temps).

Règles pratiques :
- S'il y a peu de différences entre deux mesures successives → pas d'action immédiate nécessaire
- Le remplacement dépend de l'importance de la machine et de sa disponibilité pour la maintenance
- Il est préférable de **ne pas chercher à atteindre la durée de vie maximale**
- Quand un défaut est clairement détecté → procéder au remplacement pour éviter toute perte de production

---

## 8. Indicateurs de Surveillance

### 8.1 Surveillance vs Diagnostic

**La surveillance :**
- But : suivre l'évolution d'une machine par comparaison des relevés successifs de ses vibrations
- Une tendance à la hausse de certains indicateurs par rapport à des valeurs de référence alerte le technicien
- La valeur de référence est souvent établie lors de la première campagne de mesure sur machine neuve ou révisée
- Peut être confiée à du personnel peu qualifié

**Le diagnostic :**
- Met en œuvre des outils mathématiques plus élaborés
- Permet de désigner l'élément de la machine défectueux suite à une évolution anormale des vibrations
- N'est réalisé que lorsque la surveillance a permis de détecter une anomalie
- Demande de solides connaissances mécaniques et une formation pointue en analyse du signal

### 8.2 Indicateurs Scalaires — Niveaux Globaux (NG)

Ces indicateurs sont utilisés régulièrement pour surveiller les installations. Leur évolution alerte le technicien d'une dégradation.

On distingue deux types d'indicateurs scalaires :
1. **Indicateurs scalaires ou niveaux globaux (NG)**
2. **Indicateurs spectraux de forme ou spectres**

#### 8.2.1 Indicateurs Basses Fréquences

**Déplacement crête-à-crête entre 10 et 100 Hz : Dcc [10-100 Hz] en µm**

C'est l'indicateur utilisé par l'**API (American Petroleum Institute)**. Utilisé par tout industriel intervenant en pétrochimie. Sensible aux phénomènes "basses fréquences".

Le niveau acceptable maximal est donné par :

```
Dcc_max = 25,4 × (12000/N)^0,5   [µm]
```

où N est la vitesse de rotation en tr/min.

**Vitesse efficace entre 10 et 1000 Hz : Veff [10-1000 Hz] en mm/s**

- Révélateur des phénomènes "basses fréquences" (BF)
- Ces phénomènes sont les plus énergétiques, donc les plus destructeurs
- Une augmentation du balourd ou un défaut d'alignement → augmentation anormale de cet indicateur
- Référence dans la **norme ISO 10816**

**Norme ISO 10816 — Classification des machines :**

| Groupe | Description |
|--------|-------------|
| Groupe 1 | Petites machines tournantes (< 15 kW) |
| Groupe 2 | Machines de taille moyenne (15 à 75 kW) |
| Groupe 3 | Grosses machines motrices avec masses en rotation montées sur assises lourdes et rigides |
| Groupe 4 | Grosses machines motrices sur assises relativement souples (turboalternateurs, turbines à gaz > 10 MW) |

**Seuils Veff selon ISO 10816 (mm/s) :**

| Zone | Groupe 1 | Groupe 2 | Groupe 3 | Groupe 4 |
|------|----------|----------|----------|----------|
| Bon | < 0,71 | < 1,12 | < 1,8 | < 3,5 |
| Admissible | 0,71 - 1,8 | 1,12 - 2,8 | 1,8 - 4,5 | 3,5 - 7,1 |
| Encore admissible | 1,8 - 4,5 | 2,8 - 7,1 | 4,5 - 11 | 7,1 - 18 |
| Inadmissible | > 4,5 | > 7,1 | > 11 | > 18 |

#### 8.2.2 Indicateurs Hautes Fréquences

**Accélération efficace entre 2 Hz et 20 kHz : Acceff [2-20000 Hz] en g ou mg**

- Révélateur des phénomènes "hautes fréquences" (HF) : défauts de roulements, de dentures
- Une élévation anormale de l'accélération révèle généralement une dégradation avancée des roulements
- En basse fréquence, le peigne de raies créé par les défauts de roulements est masqué par les phénomènes comme le balourd ou le délignage

#### 8.2.3 Indicateurs Spécifiques aux Roulements

**Facteur de Crête entre 1 kHz et 20 kHz : FC [1000-20000 Hz] (sans unité)**

```
Fc = Acc_crête / Acc_eff
```

**Comportement du FC au cours de la dégradation d'un roulement :**

| Phase | FC | Interprétation |
|-------|-----|----------------|
| Roulement neuf | ~3 | État normal |
| Écaillage localisé | Augmente jusqu'à ~12 | Dégradation en cours |
| Écaillage généralisé | Redescend vers 3 | En fin de vie |

> **Important :** Le FC présente environ les mêmes valeurs à l'état neuf et en fin de vie. Seule l'évolution dans le temps est utilisable : Si FC augmente → situation non alarmante. Si FC **diminue** après avoir augmenté → roulement en fin de vie.

**Facteur K entre 1 kHz et 20 kHz : K [1000-20000 Hz] en g² ou mg²**

```
K = Acc_crête × Acc_eff
```

Le facteur K est **plus sûr** pour effectuer une analyse ponctuelle des roulements. Sa valeur est directement liée à l'état du roulement :
- Bon état : K ≈ 0,8 g²
- Fin de vie : K ≈ 8 g²
- Rupture : K > 8 g²

**Sa valeur est croissante sur les 3 phases de la dégradation** (contrairement au FC).

**Facteur de Défaut Roulement : FD**

```
FD = a·FC + b·ARMS
```

avec Fc = Ac/Arms (Facteur de crête)

Le FD combine les avantages du FC et de la valeur efficace (ARMS). Il présente les avantages suivants :
- Détection précoce
- Peu sensible aux conditions de fonctionnement
- Valeur croissante sur les 3 phases de la dégradation
- Utilisation simple et adaptée au diagnostic automatique

| Étape dégradation | Aspect signal | Valeur Crête | Valeur RMS | Facteur Crête | Facteur Défaut |
|---|---|---|---|---|---|
| Début Écaillage | choc isolé | ↗ | → | ↗ | ↗ |
| Développement | chocs multiples | ↗ | ↗ | → | ↗ |
| Extension | signal bruité | → | ↗ | ↘ | ↗ |

**Niveaux d'alarme recommandés pour machines 600 à 6000 RPM :**
- Alerte à FD = **6**
- Danger à FD = **9**

### 8.3 Indicateurs Spectraux — Bandes Fines

Les bandes fines sont des indicateurs intermédiaires entre les niveaux globaux et l'analyse spectrale complète. Elles permettent de mesurer l'amplitude vibratoire sur un spectre à une fréquence donnée (avec une plage de ±2 fois la résolution spectrale).

**Exemple :** Une bande fine placée autour de la fréquence de rotation permet de détecter l'aggravation d'un défaut de balourd.

---

## 9. Outils de Diagnostic Avancés

### 9.1 Analyse Spectrale Complète

Le principal outil de diagnostic est l'**examen approfondi du spectre de l'amplitude vibratoire en accélération**.

Résolution spectrale :
```
Résolution = Δf/N_lignes
```

Types de spectres utilisés en diagnostic :
- BF [0-200 Hz] : résolution 0,25 Hz
- MF [0-2000 Hz] : résolution 2,5 Hz
- HF [0-20000 Hz] : résolution 25 Hz
- Zoom haute résolution

### 9.2 Indicateur Bande Fine

Mesure de l'amplitude vibratoire sur une bande étroite autour d'une fréquence caractéristique. Seuils définis de la même manière que pour les indicateurs globaux.

**Règle de bande :** La largeur de bande fine recommandée est ±2 fois la résolution spectrale. Elle ne doit pas être trop petite (risque de passer à côté du défaut) ni trop grande (risque de détecter plusieurs défauts).

### 9.3 Spectre PBC et Outils Intermédiaires

Pour les analyses nécessitant des connaissances pointues en traitement du signal, des outils intermédiaires ont été développés : indicateurs bandes fines et spectre PBC permettent de faire ressortir les fréquences caractéristiques sans nécessiter une analyse spectrale complète.

### 9.4 Détection d'Enveloppe

Technique spécifique pour la mise en évidence des défauts de roulements. Cet outil de traitement du signal permet de faire ressortir les fréquences cinématiques propres aux défauts de roulements (BPFI, BPFO, FTF, BSF) qui peuvent être noyées dans le bruit de fond en analyse spectrale classique.

**Principe :**
- Filtrage du signal en haute fréquence (là où les impacts de roulement sont présents)
- Démodulation d'amplitude (extraction de l'enveloppe)
- Analyse spectrale de l'enveloppe → les fréquences de défaut apparaissent clairement

---

## 10. Avantages et Inconvénients de la MPC

### 10.1 Avantages

- Évite les arrêts machines dus aux pannes
- Permet de mesurer l'état de la machine **sans l'arrêter**
- Espace les maintenances (optimisation des intervalles)
- Réduit la durée des interventions
- Réduit les stocks de rechange
- Améliore la qualité des réparations et du montage
- Réduit le coût des pannes
- Élimine les dommages secondaires
- Réduit les indisponibilités

### 10.2 Inconvénients et Contraintes

**1. Coûts d'achat :** Systèmes souvent onéreux
- Caméra infrarouge : de 7 000 € à 60 000 €
- Spectromètre d'huile : plusieurs dizaines de k€
- Système d'analyse vibratoire : 1 500 € à 30 000 €+

**2. Formation du personnel :**
- Ces techniques exigent un haut niveau de formation
- Il faut libérer du temps de formation et trouver du personnel compétent
- Le personnel doit être capable de s'adapter aux évolutions rapides des techniques

**3. Mise en place :**
- La difficulté principale est la **définition des seuils d'alarme et de danger**
- Ces seuils nécessitent un temps de mise en place de 1 à 3 ans pendant lequel la MPC n'est pas forcément rentable
- Si on surestime les seuils → panne bien avant de les atteindre
- Si on sous-estime → fausses alarmes → actions MPC non justifiées

### 10.3 Bilan — Décision de Mise en Place

La décision de mise en place de la MPC doit résulter d'une analyse coûts/bénéfices en pesant :

```
     CONTRAINTES                    AVANTAGES
         |                              |
  Choix et achat ─────────────── Espacer maintenances
  Choix des points ─────────── Réduire interventions
  Formation ────────────────── Réduire stocks
                                Améliorer qualité
                                Réduire coûts pannes
                                Éliminer dommages secondaires
                                Réduire indisponibilités
```

---

## 11. Méthodologie Pratique — TP Falcon

### 11.1 Description du Banc d'Essai

Le banc d'essai Falcon présente des éléments couramment rencontrés dans la conception de machines tournantes industrielles. Il permet de simuler la plupart des défauts classiques rencontrés sur les machines :
- Balourd
- Lignage (désalignement)
- Défauts de roulements
- Engrènement
- Courroie

**Constitution du banc :**

```
Moteur → Accouplement → ARBRE 1 → Pignon Z1=60 dents
                         (paliers 2,3,4)
                                  ↓ engrènement
                         ARBRE 2 → Pignon Z2=48 dents
                         (paliers 5,6)    Poulie P2=30 crans
                                          ↓ courroie C1=63 crans
                         ARBRE 3 → Poulie P3=24 crans
                         (paliers 7,8)
```

**Paramètres du banc :**

| Composant | Paramètre |
|-----------|-----------|
| Pignon arbre 1 | Z1 = 60 dents |
| Pignon arbre 2 | Z2 = 48 dents |
| Poulie arbre 2 | P2 = 30 crans |
| Poulie arbre 3 | P3 = 24 crans |
| Courroie | C1 = 63 crans |
| Variateur de fréquence | 37,5 Hz (réglage typique) |

**Points de mesure :** Points 2 à 8 sur les paliers de chaque arbre.

### 11.2 État Initial (Machine Bien Réglée)

**Description :** Correspond à une machine correctement réglée. Sert de référence pour toutes les comparaisons.

**Mise en œuvre :**
- Utiliser la cale de réglage entre les butées et les paliers pour garantir la référence
- Les butées en aluminium ne doivent pas être déplacées

**Mesures :**
- Niveau global (NG) sur tous les points de la ronde "Banc"
- Analyse spectrale (AS)

**Interprétation :** Ce spectre de référence montre les fréquences cinématiques normales de la machine.

### 11.3 Expérience 1 : Balourd

**Description du défaut :** Ajout d'une masse sur le plateau rainuré de l'arbre 1 (ex : vis + écrou) → déséquilibre de masse.

**Mise en œuvre :**
- Dégager l'arbre 1 (seul arbre 1 entraîné par le moteur)
- Régler le variateur à 50 Hz
- Ajouter la masse de déséquilibre

**Ronde :** "Balourd1" (avant) et "Balourd2" (après ajout de masse)

**Analyse attendue :**
- Augmentation du niveau global
- Apparition/augmentation du pic à F₀ (fréquence de rotation)
- Évaluer quelle direction et localisation de capteur montre l'évolution la plus marquée
- Observer la relation entre niveau global et fréquence de rotation

### 11.4 Expérience 2 : Engrènement

**Mise en œuvre :**
- Positionner arbre 1 avec la cale de réglage
- Positionner arbre 2 pour réaliser l'engrènement des 2 pignons (réduire au max le jeu de fond de denture)
- Positionner arbre 3 pour tendre la courroie au maximum (génère une charge sur les pignons)
- Variateur à 50 Hz

**Analyse attendue :**
- Constater la présence de la raie d'engrènement : Fe = 60·F₀
- *Pour F₀ = 24,7 Hz → Fe = 60 × 24,7 = 1480 Hz*
- Présence de l'harmonique 2 : 2Fe = 2975 Hz
- Observer les niveaux vibratoires importants résultants

### 11.5 Expérience 3 : Courroie

**Mise en œuvre :** Identique à l'engrènement (même configuration).

**Analyse attendue :**
- Constater la présence de la fréquence de courroie (Fc) sur les rapports de mesures et les spectres
- Fc = 24/63 × F₂ = 0,38 × F₂ = 0,48 × F₁ = 0,59 × F₀

### 11.6 Expérience 4 & 5 : Délignage Angulaire et Parallèle

**Description des défauts :**
- **Délignage angulaire :** Ne bouger que le palier 4 (dégager l'arbre 1 seul)
- **Délignage parallèle :** Bouger parallèlement les paliers 3 et 4

**Ronde :** "Délignage 1" (sans), "Délignage 2" (angulaire), "Délignage 3" (parallèle)

**Analyse attendue :**
- Constater l'augmentation du niveau vibratoire des harmoniques **2 et/ou 3** (50 Hz et 75 Hz) de la fréquence de rotation F₀ (25 Hz)
- Noter les directions et/ou localisations des capteurs où l'évolution est la plus marquée

### 11.7 Expérience 6 : Défaut de Roulement

**Description :** Défaut localisé sur la **bague externe** du roulement du palier 8.

**Fréquence du défaut :** Fe = 4,83 × F₀ = **120 Hz** pour F₀ = 24,8 Hz

**Points de mesure :** Points 7 et 8

**Analyse attendue :**
- Constater la présence de la raie de défaut de roulement et de ses harmoniques
- Utiliser le spectre de détection d'enveloppe si disponible

---

## 12. Fréquences Cinématiques — Calculs et Applications

### 12.1 Tableau des Fréquences du Banc Falcon

*(Pour une fréquence F₀ donnée sur l'arbre 1/moteur)*

| Arbre | Défaut | Fréquence |
|-------|--------|-----------|
| 1 (Moteur) | Balourd | F₀ |
| 1 | Lignage | 2F₀, 3F₀ avec Amp(2F₀, 3F₀) > Amp(F₀) |
| 1 & 2 | Engrènement | FG = 60×F₀ = 48×F₁ |
| 1 & 2 | 2e harmonique engrènement | 2FG = 120×F₀ |
| 2 | Balourd | F₁ = 60/48×F₀ = **1,25×F₀** |
| 2 | Lignage | 2F₁ = 2,5F₀ ; 3F₁ = 3,75F₀ |
| 3 | Balourd | F₂ = 30/24×F₁ = **1,5625×F₀** |
| 3 | Lignage | 2F₂ = 3,125F₀ ; 3F₂ = 4,6875F₀ |
| 3 | Courroie | FP = 24/63×F₂ = **0,59×F₀** |
| 8 | Défaut bague ext. | F₃ = 3,05×F₂ = **4,77×F₀** |

### 12.2 Application Numérique (Variateur à 50 Hz → F₀ ≈ 25 Hz)

| Grandeur | Calcul | Valeur |
|----------|--------|--------|
| F₀ | Fréquence moteur | ~25 Hz |
| F₁ | 1,25×25 | 31,25 Hz |
| F₂ | 1,5625×25 | 39,06 Hz |
| FG (engrènement) | 60×25 | **1500 Hz** |
| 2FG | 120×25 | **3000 Hz** |
| FP (courroie) | 0,59×25 | ~14,75 Hz |
| F₃ (roulement) | 4,77×25 | **~119 Hz** |
| 2F₀ (désalignement) | 2×25 | **50 Hz** |
| 3F₀ (désalignement) | 3×25 | **75 Hz** |

### 12.3 Formule Générale pour la Fréquence de Rotation

```
f_rotation [Hz] = N [tr/min] / 60
```

*Exemple : N = 1500 tr/min → f = 25 Hz ; N = 2925 tr/min → f = 48,75 Hz ; N = 3000 tr/min → f = 50 Hz*

### 12.4 Récapitulatif des Signatures Vibratoires par Défaut

| Défaut | Fréquences caractéristiques | Signal temporel |
|--------|---------------------------|-----------------|
| Balourd | F₀ dominant | Sinusoïdal périodique |
| Désalignement | 2F₀, 3F₀ dominants | Harmoniques riches |
| Desserrage/Jeu | F₀, sous-harmoniques ½F₀, ⅓F₀ | Signal écrêté |
| Courroie | Fc = passage courroie | Pic à Fc |
| Engrenage sain | Fe = Z×Frot | Pics à Fe, 2Fe, 3Fe |
| Dent détériorée | Fe + peigne à F_roue | Peigne de raies |
| Excentricité pignon | Bandes latérales ±F_roue autour de Fe | Modulation amplitude |
| Défaut roulement | BPFO, BPFI, BSF, FTF + harmoniques | Impacts, peigne + bandes latérales |
| Défaut électrique | 2×Fa (100 Hz) | Pic à 100 Hz |
| Cavitation | Bruit de fond général | Bruit large bande |

---

## 13. Fondements Mathématiques Avancés

### 13.1 Équations de Lagrange

Les équations de Lagrange permettent d'écrire les équations du mouvement de manière systématique, quel que soit le système mécanique.

**Pour un système à un degré de liberté :**
```
d/dt(∂L/∂q̇) - ∂L/∂q = Fq
```

avec L = T - U (Lagrangien = Énergie cinétique - Énergie potentielle)

**Pour un système avec amortissement et excitation :**
```
d/dt(∂L/∂q̇) - ∂L/∂q + ∂D/∂q̇ = Fe,q
```

où D = ½·β·q̇² est la fonction dissipation (β = coefficient de frottement).

**Pour un système à N degrés de liberté :**
```
d/dt(∂L/∂q̇ᵢ) - ∂L/∂qᵢ + ∂D/∂q̇ᵢ = Fe,qᵢ    (i = 1, 2, ..., N)
```

### 13.2 Équation Différentielle Normalisée du 2e Ordre

L'équation fondamentale de tout système vibratoire à 1 DDL :

```
ẍ + 2δẋ + ω₀²x = A(t)
```

**Solution générale = Solution homogène + Solution particulière :**
```
x(t) = x_H(t) + x_P(t)
```

- x_H → régime transitoire (s'annule après un temps ≈ 3/δ à 4/δ)
- x_P → régime permanent (stationnaire)

### 13.3 Résonance — Conditions et Amplitude

**Pulsation de résonance en amplitude :**
```
Ω_R = √(ω₀² - 2δ²)   (existe seulement si δ < ω₀/√2)
```

**Amplitude à la résonance :**
```
X₀_max = A₀ / (2δ·√(ω₀² - δ²))
```

**Pour faibles amortissements (δ << ω₀) :**
```
X₀_max ≈ A₀ / (2δω₀)
```

**Résonance en vitesse :** Toujours à Ω = ω₀ quelle que soit la valeur de δ.

**Résonance en puissance :** Toujours à Ω = ω₀ quelle que soit la valeur de δ.

**Bande passante :**
```
B = Ω₂ - Ω₁ = 2δ
```

**Coefficient de qualité :**
```
Q = ω₀/B = ω₀/(2δ)
```

### 13.4 Système Masse-Ressort-Amortisseur — Valeurs Numériques

Pour le système mécanique classique :

```
m·ẍ + α·ẋ + k·x = F(t)
```

Paramètres :
```
ω₀ = √(k/m)      [pulsation propre, rad/s]
δ = α/(2m)        [facteur d'amortissement, rad/s]
f₀ = ω₀/(2π)     [fréquence propre, Hz]
Q = mω₀/α        [coefficient de qualité]
```

Impédances complexes élémentaires :
```
Masse :        Z_m = j·m·Ω
Ressort :      Z_k = k/(j·Ω) = -jk/Ω
Amortisseur :  Z_α = α
```

### 13.5 Systèmes à Deux Degrés de Liberté

Équations différentielles couplées :
```
m₁ẍ₁ + (k₁+K)x₁ - Kx₂ = F₁(t)
m₂ẍ₂ + (k₂+K)x₂ - Kx₁ = F₂(t)
```

Équation caractéristique (déterminant nul) :
```
[(k₁+K-m₁ω²)]·[(k₂+K-m₂ω²)] - K² = 0
```

Solutions : pulsations propres ω₁ < ω₂

**Mode 1 :** Masses en phase, pulsation ω₁
**Mode 2 :** Masses en opposition de phase, pulsation ω₂

**Étouffeur dynamique de vibrations :**
```
Si k/m = K/M → ΩA = √(K/M) = ω₀
→ La masse principale est immobile à la pulsation d'excitation ω₀
```

---

## 14. Synthèse : Développer une Solution de Maintenance Vibratoire

### 14.1 Architecture d'une Solution Complète

```
┌─────────────────────────────────────────────────────────────┐
│              SOLUTION DE MAINTENANCE VIBRATOIRE             │
├─────────────┬──────────────────────────────────────────────┤
│   CAPTEURS  │  Accéléromètres (fixés par goujon de préf.)  │
│   & POINTS  │  Radial + Axial sur chaque palier            │
│   MESURE    │  Positionnés sur structures rigides           │
├─────────────┼──────────────────────────────────────────────┤
│  ACQUISITION│  On-line (moniteur permanent) ou             │
│   DES       │  Off-line (collecteur de données portatif)   │
│   DONNÉES   │  Rondes programmées avec points et paramètres│
├─────────────┼──────────────────────────────────────────────┤
│  TRAITEMENT │  FFT, Analyse spectrale                       │
│   DU SIGNAL │  Détection d'enveloppe (roulements)          │
│             │  Indicateurs : Veff, Acceff, FC, K, FD       │
├─────────────┼──────────────────────────────────────────────┤
│  BASE DE    │  Historique des mesures par point            │
│   DONNÉES   │  Courbes de tendance                          │
│             │  Spectres de référence                        │
├─────────────┼──────────────────────────────────────────────┤
│  SEUILS     │  Alerte : A/A₀ = 2 (+6 dB)                   │
│   D'ALARME  │  Danger : A/A₀ = 10 (+20 dB)                 │
│             │  ISO 10816 pour Veff                          │
│             │  FD : Alerte=6, Danger=9 (600-6000 RPM)      │
├─────────────┼──────────────────────────────────────────────┤
│  DIAGNOSTIC │  Identification des fréquences caractérist.  │
│             │  Comparaison avec spectres de référence       │
│             │  Calcul des fréquences cinématiques           │
│             │  Localisation du défaut                       │
├─────────────┼──────────────────────────────────────────────┤
│  DÉCISION   │  Continuer production / Planifier arrêt /    │
│             │  Arrêt immédiat                               │
└─────────────┴──────────────────────────────────────────────┘
```

### 14.2 Étapes de Mise en Place d'un Programme de Surveillance

**Étape 1 : Inventaire des machines**
- Identifier les machines critiques à surveiller
- Classifier par criticité (impact sur la production, sécurité, coût de réparation)

**Étape 2 : Définir les points de mesure**
- Choisir les positions radiale et axiale sur chaque palier
- Vérifier la rigidité et l'accessibilité des points

**Étape 3 : Choisir les paramètres de mesure**
- Gammes spectrales adaptées aux machines (BF, MF, HF)
- Indicateurs globaux (Veff, Acceff, FC, K, FD)
- Bandes fines pour les fréquences caractéristiques connues

**Étape 4 : Établir les valeurs de référence**
- Réaliser les premières mesures sur machines en bon état (neuves ou révisées)
- Ces valeurs sont la base de comparaison

**Étape 5 : Définir les seuils d'alarme et de danger**
- Utiliser les normes (ISO 10816) comme point de départ
- Affiner avec l'expérience sur les machines concernées
- Prévoir 1 à 3 ans pour la calibration des seuils

**Étape 6 : Organiser les rondes de surveillance**
- Définir la périodicité (hebdomadaire, mensuelle selon la criticité)
- Former le personnel d'acquisition
- Mettre en place la base de données

**Étape 7 : Surveillance et diagnostic**
- Comparer chaque mesure avec la référence et les mesures précédentes
- Déclencher le diagnostic à la détection d'une anomalie
- Calculer les fréquences cinématiques attendues et les comparer au spectre

### 14.3 Procédure de Diagnostic d'un Défaut

```
1. DÉTECTER : Un indicateur global dépasse le seuil d'alarme
           ↓
2. QUALIFIER : Quel type de défaut ?
   → Calculer les fréquences cinématiques (F₀, Fe, Fc, BPFO, BPFI...)
   → Identifier les pics du spectre
   → Comparer avec les signatures connues
           ↓
3. LOCALISER : Sur quelle machine / quel composant ?
   → Comparer les mesures aux différents points de la machine
   → La fréquence identifiée pointe vers le composant défectueux
           ↓
4. QUANTIFIER : Quelle est la gravité ?
   → Lire la courbe de tendance
   → Comparer avec les seuils de danger
           ↓
5. DÉCIDER : 
   → Surveillance renforcée (mesures plus fréquentes)
   → Planification d'intervention (à la prochaine maintenance planifiée)
   → Arrêt immédiat (si seuil de danger atteint ou évolution rapide)
```

### 14.4 Formulaire de Calcul Rapide — Référence Terrain

**Fréquence de rotation :**
```
f [Hz] = N [tr/min] / 60
```

**Fréquence d'engrènement :**
```
Fe = Z × f_rotation
```

**Fréquence de passage de courroie :**
```
Fc = (N/60) × (π×D/L)
```

**Fréquence de passage des aubes :**
```
f_aubes = n × f_rotation
```

**Défauts de roulement (approximation pratique) :**
```
BPFO ≈ 0,4 × n × f_rotation
BPFI ≈ 0,6 × n × f_rotation
BSF ≈ 0,25 × n × f_rotation × (DR/DB)
FTF ≈ 0,4 × f_rotation
```
*(n = nombre de billes)*

**Seuil maximal de déplacement (API) :**
```
Dcc_max [µm] = 25,4 × √(12000/N)
```

**Amplitude en décibels :**
```
A(dB) = 20·log(A/A₀)
```

**Facteur de Défaut Roulement :**
```
FD = a·FC + b·ARMS    avec FC = Acc_crête/Acc_eff
```

### 14.5 Indicateurs d'Alerte — Tableau de Bord Opérateur

| Indicateur | Unité | État Normal | Alerte | Danger |
|-----------|-------|-------------|--------|--------|
| Veff [10-1000 Hz] | mm/s | < seuil ISO | Gr.1 : 1,8 | Gr.1 : 4,5 |
| A(dB) vs référence | dB | 0 | +6 dB (×2) | +20 dB (×10) |
| Facteur de Crête | — | 2–4 (neuf) | ↑ vers 12 | ↓ après pic |
| Facteur K | g² | ~0,8 | En hausse | ~8 |
| FD (600-6000 RPM) | — | < 6 | 6 | 9 |

### 14.6 Résumé des Connaissances Clés pour un Ingénieur en Analyse Vibratoire

1. **Comprendre** que vibration = Force × Mobilité → diagnostiquer à la fois les défauts (forces) et l'état structural (mobilité)

2. **Maîtriser** la décomposition de Fourier : chaque fréquence du spectre est une source d'excitation identifiable

3. **Calculer** les fréquences cinématiques avant toute mesure → avoir les fréquences attendues pour interpréter le spectre

4. **Choisir** le bon capteur, la bonne position (au plus près des paliers, sur structure rigide, fixation rigide), la bonne gamme spectrale

5. **Savoir** que le spectre log-log est la représentation de base pour visualiser tous les phénomènes

6. **Surveiller** les tendances plutôt que les valeurs absolues → la dynamique d'évolution est plus importante que le niveau instantané

7. **Distinguer** la surveillance (peut être déléguée à du personnel peu qualifié) du diagnostic (nécessite expertise)

8. **Appliquer** la norme ISO 10816 pour les seuils de vitesse efficace, et les formules de roulement pour les défauts spécifiques

9. **Utiliser** la détection d'enveloppe pour les défauts de roulements (BPFO, BPFI, etc.) souvent noyés dans le bruit de fond

10. **Ne jamais chercher** à atteindre la durée de vie maximale d'un composant défectueux — remplacer dès que le défaut est clairement identifié

---

*Document consolidé à partir de : Cours Analyse Vibratoire — ALAEDDINE CHAFAI (ENSAM/UMI), Manuel BTS MI — Analyse Vibratoire des Machines Tournantes (Hubert Faigner), TP1 Analyse Vibratoire Machines Tournantes — Prof. Smail ZAKI (ENSAM/UMI, 2021-2022), Vibrations et Ondes — Manuel de Cours Pr. DJELOUAH Hakim (USTHB, 2006-2007), Présentation Surveillance Vibratoire des Machines Tournantes.*

# GUIDE EXHAUSTIF - ANALYSE VIBRATOIRE ET MAINTENANCE PREDICTIVE
## Document de Reference pour Operateurs et Ingenieurs

---

# PARTIE 1 : FONDAMENTAUX DE L'ANALYSE VIBRATOIRE

## 1.1 Introduction et Generalites

### Definition
L'analyse vibratoire est une technique de controle non destructif employee pour realiser, analyser l'etat des installations industrielles dans le but d'operer la maintenance preventive conditionnelle par surveillance. On pourra par exemple optimiser la conception en supprimant les frequences de resonance qui provoquent les deformations de structure, detecter et identifier les defaillances d'un systeme.

### Principe de Base
Toutes les machines vibrent et le spectre des frequences de leurs vibrations a un profil particulier lorsqu'elles sont en etat de "bon fonctionnement". Mais des que les phenomenes d'usure, de fatigue, de vieillissement apparaissent, le profil de ce spectre se modifie.

L'analyse des vibrations ouvre de reelles perspectives de diagnostic et devient par la un element important de la **maintenance conditionnelle**.

Une machine ideale ne vibrerait pas car toute l'energie serait employee pour effectuer le travail. Des vibrations apparaissent, provoquees par des excitations provenant des organes en mouvement. Une partie de l'energie est dissipee dans la structure sous forme de vibrations.

### Interet du Diagnostic Vibratoire
La machine vieillissant, les pieces se deforment et de legers changements dans leurs proprietes dynamiques apparaissent :
- Les arbres se desalignent
- Les paliers et les roulements s'usent
- Les rotors se desequilibrent
- Les jeux augmentent

Tous ces facteurs se traduisent par une augmentation de l'energie vibratoire donc une baisse de l'energie efficace.

**Applications industrielles :**
- Papeteries (ex: Emin Leydier - 110 capteurs SVT-1100 sur machine a papier)
- Industries chimiques (ex: Rhodia - controles vibratoires periodiques mensuels)
- Surveillance de groupes moto-reducteurs

---

## 1.2 Modelisation d'une Vibration

### Definition Physique
Une vibration est un **mouvement repetitif autour d'une position centrale** appelee position d'equilibre. Ce mouvement d'aller et retour est appele **cycle**. Le nombre de cycles par seconde est appele **Frequence d'oscillation** et s'exprime en **HERTZ (Hz)**.

### Systeme Masse-Ressort
Pour modeliser un signal vibratoire, on utilise le systeme masse-ressort :
- En appliquant une impulsion verticale a la masse suspendue au ressort, celle-ci va s'animer d'un mouvement de haut en bas : c'est **l'amplitude vibratoire**
- Ce mouvement va se repeter un certain nombre de fois dans l'unite de temps (seconde) : c'est **la frequence**
- L'amplitude du mouvement s'amortit dans le temps a cause des forces exterieures (resistance de l'air, poids de la masse) et des forces internes (raideur du ressort)

### Amplitude Entretenue
Si nous pouvons appliquer, a intervalles reguliers, une impulsion a la masse suspendue, l'amplitude n'aurait pas le temps necessaire pour s'amortir totalement. Nous aurions une **amplitude entretenue**.

La courbe obtenue represente la position d'un point de la masse en fonction du temps. C'est une **sinusoide**.

### Equation Fondamentale
En realite, un signal vibratoire n'est jamais un sinus pur, mais il peut se ramener a une somme de signaux sinusoidaux de frequences differentes.

On peut a tout moment connaitre l'amplitude de la vibration en fonction du temps par la relation :

```
y = a sin(ωt)
```

Avec :
- **a** : Amplitude maximale du mouvement
- **ω** : Vitesse angulaire en rd/s (pulsation) = 2πf
- **f** : Frequence en Hz
- **T** : Periode en secondes = 1/f

### Grandeurs Caracteristiques d'une Sinusoide

Sur une sinusoide, nous pouvons determiner les grandeurs suivantes :

| Grandeur | Symbole | Definition |
|----------|---------|------------|
| Valeur crete vraie | Cr Vr | Distance entre la valeur moyenne et la valeur maximale |
| Valeur crete a crete vraie | CrCrVr | Distance entre les valeurs maximale et minimale |
| Valeur RMS ou valeur efficace | RMS | Hauteur du rectangle ayant la meme surface que l'arc de sinusoide |

**RMS** : Root Mean Square (racine carree de la moyenne des carrees).

### Signaux Non Sinusoidaux
Un signal vibratoire n'est jamais un sinus parfait. Deux nouvelles valeurs sont definies :
- **Valeur crete equivalente (CrEqu)**
- **Valeur crete a crete equivalente (CrCrEqu)**

Ces valeurs representent les valeurs crete et crete a crete equivalent qu'aurait un signal sinusoidal parfait de valeur RMS.

---

## 1.3 Les Differentes Mesures

### Amplitude vs Frequence
- **L'amplitude des vibrations** informe sur l'importance du defaut surveille
- **L'analyse de la frequence de vibration** informe sur la cause du defaut et permet le diagnostic

### Types de Vibrations

Il existe deux grands types de vibrations :

**1. Vibrations synchrones :**
Elles sont multiples ou sous-multiples de la frequence de rotation, ce sont les divers harmoniques de cette frequence.

**2. Vibrations asynchrones :**
Elles se produisent a des frequences autres que celles liees a la frequence de rotation, elles peuvent etre a des frequences propres aux divers elements du mecanisme.

### Mesure de Niveau Global
Ce type de mesure permet de suivre la valeur de l'energie vibratoire d'un systeme. Ce parametre est caracteristique de l'etat de la machine et permet de suivre la degradation d'un equipement et d'anticiper un probleme.

**Le niveau global ne permet pas le diagnostic.**

Il est represente par :
- Un seuil de maintenance
- Un seuil de panne
- Un delai d'intervention previsionnel avant la panne

### Mesure Spectrale ou Frequentielle
Ce type de mesure permet de repartir l'energie vibratoire en fonction de la frequence. Ce type de mesure permet de donner differentes amplitudes a differentes frequences.

**Principe :** Un type de defaut se produit toujours a une frequence particuliere. Ainsi, en fonction de l'amplitude a une certaine frequence, nous pourrons determiner d'ou provient le defaut. La mesure spectrale est utilisee pour diagnostiquer l'origine de la defaillance.

### Transformation de Fourier (FFT)
Nous passons d'une mesure de niveau global a une mesure spectrale par un calcul mathematique nomme **Transformation de FOURIER (FFT : Fast Fourier Transform)**.

Si le spectre est pratiquement indispensable pour l'etablissement d'un diagnostic, il est par contre impensable de suivre l'ensemble de ses composantes. Seules quelques raies ou groupes de raies significatifs sont suivis.

---

## 1.4 Les Capteurs

### Parametres Mesurables
Les vibrations d'un organe peuvent etre caracterisees indifferemment par l'un des parametres :
- **Deplacement** en mm
- **Vitesse** en mm/s
- **Acceleration** en m/s²

### L'Accelerometre
Le capteur le plus utilise est un **accelerometre**. Il delivre un signal directement proportionnel a l'acceleration.

Par traitement mathematique il est facile de remonter a la vitesse ou au deplacement :
- La derivee du deplacement par rapport au temps nous donnera la vitesse
- La derivee de la vitesse par rapport au temps nous donnera l'acceleration
- Une simple ou double integration nous permettra de definir vitesse et deplacement apres mesure de l'acceleration

### Constitution de l'Accelerometre
L'accelerometre comprend :
- Un ressort pre-soude
- Une masse sismique
- Un element piezo en compression
- Une base
- Une sortie

---

## 1.5 La Chaine de Mesure

### Trois Etapes Fondamentales

**1. Le prelevement de l'information :**
Le capteur (accelerometre ou sonde de proximite) capte les informations et les transmet au collecteur de donnees (Movipack).

**2. Le conditionnement et le traitement du signal :**
C'est le role du collecteur de donnees qui, en plus, affiche les resultats.

**3. La gestion des resultats :**
Un logiciel (eDiag) et un ordinateur permettent de suivre l'evolution et la derive des mesures.

---

## 1.6 Logiciel eDiag - Generalites

### Fonctionnalites
- La machine etudiee est composee de la chaine cinematique
- Le programme etabli permet de mesurer differents defauts
- Nous retrouvons en ligne les differents points de mesure
- Un systeme de couleurs permet de montrer l'etat du systeme par rapport a des seuils pre-programmes
- A chaque point de mesure, on definit les parametres et les signaux a mesurer ou a calculer d'apres les mesures

---

# PARTIE 2 : NORMES ET SEUILS VIBRATOIRES

## 2.1 Norme ISO 10816

### Definition des Zones

| Zone | Description |
|------|-------------|
| **Zone A** | Niveaux vibratoires pour machines neuves |
| **Zone B** | Niveaux vibratoires acceptables pour un service de longue duree sans restrictions |
| **Zone C** | Niveaux vibratoires non acceptables pour un service de longue duree en continu. La machine peut toutefois continuer a fonctionner pendant une duree limitee |
| **Zone D** | Niveaux vibratoires suffisants pour endommager la machine - La machine doit etre arretee |

### Limites des Perimetres de Zones (en mm/s RMS)

| Classe | Zone A | Zone B | Zone C | Zone D |
|--------|--------|--------|--------|--------|
| **Classe 1** | 0.28 | 0.45 | 0.71 | 1.12 |
| **Classe 2** | 0.45 | 0.71 | 1.12 | 1.8 |
| **Classe 3** | 0.71 | 1.12 | 1.8 | 2.8 |
| **Classe 4** | 1.12 | 1.8 | 2.8 | 4.5 |
| **Classe 5** | 1.8 | 2.8 | 4.5 | 7.1 |
| **Classe 6** | 2.8 | 4.5 | 7.1 | 11.2 |
| **Classe 7** | 4.5 | 7.1 | 11.2 | 18 |
| **Classe 8** | 7.1 | 11.2 | 18 | 28 |
| **Classe 9** | 11.2 | 18 | 28 | 45 |

### Classes de Machines
- **Classe 1** : Petites machines (jusqu'a 15 kW)
- **Classe 2** : Machines moyennes (15-75 kW ou jusqu'a 300 kW sur fondations speciales)
- **Classe 3** : Machines lourdes sur fondation rigides (dont la frequence naturelle depasse la vitesse de la machine)
- **Classe 4** : Machines lourdes fonctionnant a des vitesses superieures a la frequence naturelle de leurs fondations (turbo-machines)

### Determination des Seuils

**Seuil Alarme :**
A 25% de la limite superieure de la zone B au-dessus d'un niveau de reference (niveau atteint par la machine en bon etat).
En l'absence de niveaux de reference, entre 1 et 1.25 fois la limite superieure de la zone B.

**Seuil Danger :**
Valeur non liee au niveau de reference : Entre 1 et 1.25 fois la limite superieure de la zone C.

```
Niveau de reference
      |
      |---- 0.25 x limite B/C ----|---- Seuil Alarme
      |                                    |
      |----------------------------- 1-1.25 x limite C/D ----|---- Seuil Danger
```

---

## 2.2 Tableau de Severite Vibratoire - Valeurs Recommandees

### Seuils d'Alarmes Preconises (Vitesse en mm/s RMS)

| Niveau | Description |
|--------|-------------|
| **BON** | Petites machines (jusqu'a 15 kW) |
| **BON** | Machines moyennes (15-75 kW) |
| **PERMIS** | Fonctionnement acceptable |
| **JUSTE TOLERABLE** | Surveillance renforcee necessaire |
| **NON TOLERE** | Arret imperatif |

### Valeurs pour Differentes Classes de Machines

| Valeur efficace vitesse (mm/s) | Petites machines (jusqu'a 15 kW) | Machines moyennes (15-75 kW ou jusqu'a 300 kW sur fondations speciales) | Machines lourdes sur fondation rigides | Machines lourdes a vitesses > frequence naturelle |
|-------------------------------|----------------------------------|------------------------------------------------------------------------|----------------------------------------|---------------------------------------------------|
| 0.28 | BON | BON | BON | BON |
| 0.45 | BON | BON | BON | BON |
| 0.71 | PERMIS | BON | BON | BON |
| 1.12 | JUSTE TOLERABLE | PERMIS | BON | BON |
| 1.8 | NON TOLERE | JUSTE TOLERABLE | PERMIS | BON |
| 2.8 | - | NON TOLERE | JUSTE TOLERABLE | PERMIS |
| 4.5 | - | - | NON TOLERE | JUSTE TOLERABLE |
| 7.1 | - | - | - | PERMIS |
| 11.2 | - | - | - | NON TOLERE |
| 18 | - | - | - | NON TOLERE |
| 28 | - | - | - | NON TOLERE |

### ISO 10816-3 - Evaluation Standard

| Zone | Couleur | Description |
|------|---------|-------------|
| **A** | Vert | New machine condition |
| **B** | Jaune | Unlimited long-term operation allowable |
| **C** | Orange | Short-term operation allowable |
| **D** | Rouge | Vibration causes damage |

---

## 2.3 Seuils pour Parametres Specifiques (Bandes Fines)

### Machines a 1500 Tr/min et 3000 Tr/min

| Parametre | Machine 1500 Tr/min | Machine 3000 Tr/min |
|-----------|---------------------|---------------------|
| **Balourd** | Erreur: 0.001 g / Alarme: 0.050 g / Danger: 0.100 g | Erreur: 0.001 g / Alarme: 0.100 g / Danger: 0.300 g |
| **Impulseur (aubes)** | Erreur: 0.001 g / Alarme: 0.1 g / Danger: 0.3 g | Erreur: 0.001 g / Alarme: 0.3 g / Danger: 0.6 g |
| **Turbine (pales)** | Erreur: 0.001 g / Alarme: 0.030 g / Danger: 0.1 g | Erreur: 0.001 g / Alarme: 0.1 g / Danger: 0.3 g |
| **Engrenement** | Erreur: 0.001 g / Alarme: 0.6 g / Danger: 0.9 g | Erreur: 0.001 g / Alarme: 0.6 g / Danger: 0.9 g |
| **Defaut electrique stationnaire (100 Hz)** | Erreur: 0.001 g / Alarme: 0.1 g / Danger: 0.3 g | Erreur: 0.001 g / Alarme: 0.3 g / Danger: 0.6 g |
| **Passage d'encoches rotor** | Erreur: 0.001 g / Alarme: 0.6 g / Danger: 0.9 g | Erreur: 0.001 g / Alarme: 0.6 g / Danger: 0.9 g |

### Niveaux Globaux et Niveaux d'Energie

| Parametre | Machine 1500 Tr/min | Machine 3000 Tr/min |
|-----------|---------------------|---------------------|
| **Niveau global vitesse (10-1000 Hz)** | Erreur: 0.010 mm/s / Alarme: 3 mm/s / Danger: 6 mm/s | Erreur: 0.010 mm/s / Alarme: 4 mm/s / Danger: 8 mm/s |
| **Niveau global acceleration (2-20000 Hz)** | Erreur: 0.010 g / Alarme: 2 g / Danger: 4 g | Erreur: 0.010 g / Alarme: 3 g / Danger: 5 g |
| **Niveau global basses frequences (2-200 Hz)** | Erreur: 0.010 g / Alarme: 0.150 g / Danger: 0.300 g | Erreur: 0.010 g / Alarme: 0.300 g / Danger: 0.600 g |
| **Niveau global moyennes frequences (200-2000 Hz)** | Erreur: 0.010 g / Alarme: 0.500 g / Danger: 1 g | Erreur: 0.010 g / Alarme: 1 g / Danger: 2 g |
| **Niveau global hautes frequences (2000-20000 Hz)** | Erreur: 0.010 g / Alarme: 2 g / Danger: 4 g | Erreur: 0.010 g / Alarme: 3 g / Danger: 5 g |
| **Facteur defaut roulement** | Erreur: 0 / Alarme: 6 / Danger: 9 | Erreur: 0 / Alarme: 6 / Danger: 9 |

---

## 2.4 Valeurs en Acceleration

### Zone de Fonctionnement (en g SE - Spectre d'Envelope)

| Zone | Description |
|------|-------------|
| **Niveau normal - BON ETAT** | 0.1 g SE |
| **Leger defaut** | 0.2-0.3 g SE |
| **ZONE ACCEPTABLE** | 0.3-0.4 g SE |
| **Debut de deterioration** | 0.4-0.5 g SE |
| **ZONE TOLERABLE** | 0.5-0.8 g SE |
| **ZONE D'ALERTE** | 0.7-0.9 g SE |
| **Deterioration rapide** | 0.8-1.0 g SE |
| **ZONE DE DETERIORATION PROBABLE** | > 0.9 g SE |

---

# PARTIE 3 : ORIGINES DES VIBRATIONS ET DIAGNOSTIC

## 3.1 Tableau d'Analyse Spectrale

### Frequences Fondamentales par Type de Defaut

| Type de Machine / Defaut | Phenomene Vibratoire | Frequence Fondamentale du Defaut |
|--------------------------|----------------------|----------------------------------|
| **Machine electrique** | Electromagnetique | 2 x Frequence reseau |
| **Machine tournante** | Balourd | F0 (frequence de rotation) |
| **Accouplement** | Delignage | F0, 2F0, 3F0 |
| **Pompe** | Cavitation | Large bande moyenne frequence |
| **Roulement (bague externe)** | Defaut BE | f(Hz) = (PD/BD) x fr x [1 - (BD/PD x Cos β)²] |
| **Roulement (bague interne)** | Defaut BI | f(Hz) = (n/2) x fr x (1 + BD/PD x Cos β) |
| **Roulement (bille)** | Defaut bille | f(Hz) = (n/2) x fr x (1 - BD/PD x Cos β) |
| **Engrenage** | Jeu dans la denture | Z1 x F0 |

**Legende :**
- PD = Diametre moyen d'evolution
- BD = Diametre des billes
- n = Nombre de billes
- fr = Frequence de rotation
- β = Angle de contact
- Z1 = Nombre de dents du pignon

---

## 3.2 Le Balourd (Desequilibre)

### Definition
Le balourd se manifeste par une energie vibratoire localisee :
- A la frequence de rotation F0
- Aux frequences des harmoniques 2F0, 3F0...

Il existe toujours un **balourd residuel** sur une machine tournante.

### Typologie du Balourd

**Balourd initial :**
Le balourd se manifeste par une energie vibratoire localisee a la frequence de rotation F0 et aux harmoniques 2F0, 3F0...

**Balourd evolue :**
L'evolution du balourd se manifeste par une augmentation de la raie a F0 et des harmoniques 2F0, 3F0...

### Balourd Statique vs Balourd de Couple

**Balourd statique :**
Le rotor presente un desequilibre meme a l'arret. Des que le rotor est en rotation, la masse M exerce une force radiale proportionnelle a la vitesse de rotation selon la relation :
```
F = M x r x ω²
```
Les efforts aux deux points de mesures sont parfaitement en phase.

**Balourd de couple :**
Le rotor reste en position d'equilibre a l'arret. Quand le rotor est en rotation, les 2 masses generent un couple. Les efforts aux deux points de mesures sont dephases de 180° (en opposition de phases).

**Balourd dynamique :**
Combinaison des deux types de balourd ci-dessus.

### Distinction Balourd / Delignage

| Critere | Balourd | Delignage |
|---------|---------|-----------|
| Amplitudes axiales | Faibles | Importantes |
| Points de mesure autour du palier | En phase | En contre-phase |

### Equilibrage
Lors d'un equilibrage :
- Pour un **balourd statique** : un plan d'equilibrage suffit
- Pour un **balourd de couple** : deux plans d'equilibrage sont necessaires

La norme **ISO 1940** decrit les procedures et le balourd residuel admissible recommande pour differents types de machines et differentes valeurs de vitesse.

---

## 3.3 Le Delignage (Defaut d'Alignement)

### Definition
Il se manifeste par une energie vibratoire localisee a 2F0, 3F0 ou 4F0 dans toutes les directions de mesurages.

### Types de Delignage
- **Delignage angulaire** : angle different de 180° entre les deux axes
- **Delignage parallele** : les deux axes ne se trouvent pas dans un meme plan

### Vibrations Causes par un Delignage
De maniere generale, un delignage provoque un phenomene se repetant a chaque tour de rotation. Le signal temporel est tres repetitif. Le spectre de vibration presente un pic situe a une fois la vitesse de rotation (accompagne de quelques harmoniques).

### Consequences
Un defaut d'alignement peut avoir de consequences graves. L'arbre tournant etant tres rigide, il se cree des efforts importants qui se repercutent dans les paliers. Ces efforts induisent rapidement des defauts de roulements et dans les cas les plus graves, une rupture de la cage du roulement.

### Alignement ou Balourd ?

| Critere | Balourd | Delignage |
|---------|---------|-----------|
| Amplitudes axiales | Faibles | Importantes |
| Points de mesures autour du palier | En phase | En contre-phase |

### Distinction Delignage / Jeu

| Critere | Jeu | Delignage |
|---------|-----|-----------|
| Signal temporel | Irregulier | Repetitif |

---

## 3.4 Jeu et Desserrage

### Definition
Par desserrage, on entend un manque de rigidite de montage sur une structure. Le jeu se retrouve en general presque toujours dans le roulement. Il peut s'agir de :
- Jeu entre la bague exterieure et le palier
- Jeu entre la bague interieure et l'arbre
- Jeu excessif entre les billes/galets et les cages interne et externe

### Caracteristiques Vibratoires
En general, le jeu ou le desserrage se traduit par un signal temporel **irregulier**. La force excitante qui cause la vibration peut etre un balourd sur la partie tournante, mais la reponse non lineaire de la structure donne un signal temporel irregulier. Le signal temporel reste synchrone donc le spectre presente des pics multiples de la vitesse de rotation.

---

## 3.5 Les Phenomenes Magnetiques (Moteur Asynchrone)

### Notations et Formules

| Symbole | Definition | Formule |
|---------|------------|---------|
| **FA** | Frequence d'alimentation | - |
| **FS** | Frequence du champ tournant | FS = FA x p |
| **FR** | Frequence de rotation rotor | - |
| **p** | Nombre de paires de poles | - |
| **g** | Glissement | g = (FS - FR) / FS |
| **Fg** | Frequence de glissement | Fg = ΔF = FS - FR |
| **R** | Nombre d'encoches rotor | - |
| **Fenc** | Frequences principales d'encoches | Fenc = q1 x R x FR ± q2 x 2 x FA (q1 = 1,2,3... ; q2 = 0,1,2...) |

---

## 3.6 Les Engrenages

### Generalites
Les engrenages permettent la transmission d'un couple avec ou sans reduction de vitesse.

Le rapport des vitesses des deux arbres est lie au nombre de dents de chacun des pignons en contact :
```
F2 / F1 = N1 / N2 = N1 x F1 = N2 x F2
```

Avec :
- F1, F2 = Frequences de rotation
- N1, N2 = Nombre de dents

### Frequence d'Engrenement
La frequence d'engrenement de denture FE est egale a :
```
FE = N1 x F1 = N2 x F2
```
Elle correspond au rythme d'engagement des dents.

L'amplitude vibratoire de la raie d'engrenement FE est tres dependante de la charge de la machine puisque l'engrenement assure la transmission du couple.

### Une Dent Deterioree sur Chaque Pignon
Un choc "dur" est genere :
- A chaque passage de la dent du pignon 1
- A chaque passage de la dent du pignon 2
- A chaque rencontre des 2 dents deteriorees

Le spectre resultant est compose de :
- Un peigne de raies harmoniques de la frequence de rotation F1
- Un peigne de raies harmoniques de la frequence de rotation F2
- Un peigne de raies harmoniques de la frequence de coincidence FC

**Frequence de coincidence :**
```
FC = FE / NC
```
Avec NC = ppcm de N1 et N2

### Cas d'Usure des Dents
Le spectre presente toujours un niveau important de vibration autour de la frequence d'engrenement. Cette energie supplementaire provient des bandes laterales de part et d'autre de la frequence d'engrenement. Pour chaque paire de roues dentees, il apparait une serie de bandes laterales dont l'interdistance est egal a la frequence de rotation de chaque roue dentee.

L'usure d'une roue dentee va s'accompagner de :
- Augmentation du niveau de la frequence d'engrenement et surtout du niveau des harmoniques de cette frequence
- Augmentation du niveau des bandes laterales autour de la frequence d'engrenement
- Augmentation du bruit genere et excitation possible de la frequence naturelle des roues dentees

**Excentricite** : L'excentricite d'une roue dentee ou le balourd d'un axe provoque egalement l'apparition de bandes laterales autour de la frequence d'engrenement a un intervalle correspondant a la vitesse de rotation de l'arbre.

**Mesalignement** : Un mesalignement fera apparaitre des bandes laterales autour de la frequence d'engrenement a 2x la vitesse de rotation de l'arbre.

---

## 3.7 Les Transmissions par Courroie

### Courroies Trapezoidales

**Frequence de passage de la courroie FP :**
```
FP = (π x D1 x F1) / (D1 + D2 + 2E) = (π x D2 x F2) / (D1 + D2 + 2E)
```
Avec :
- D1, D2 = Diametres des poulies
- F1, F2 = Frequences de rotation
- E = Entraxe des poulies
- L = Longueur de la courroie

### Courroies Crantees

**Frequence de passage FP :**
```
FP = FE / N = N1 x F1 / N = N2 x F2 / N
```
Avec :
- N = Nombre de dents courroie
- N1 = Nombre de dents poulie 1
- N2 = Nombre de dents poulie 2
- FE = Frequence d'engrenement

Les problemes de courroies (deformation, point dur, crevasse) generent des vibrations a la frequence de passage.

### Defauts de Tension et/ou d'Alignement de Courroie

**Un defaut d'alignement ou une tension trop elevee genere :**
- De hauts niveaux vibratoires a la vitesse du moteur et/ou de l'organe entraine
- Forte vibration du moteur sur l'organe entraine et vice-versa
- Haut niveau vibratoire du cote des courroies
- Niveaux vibratoires plus importants dans le sens des courroies
- Niveaux axiaux relativement plus eleves

---

## 3.8 Les Roulements

### Generalites et Constitution
Les roulements realisent le positionnement de l'arbre dans les paliers en assurant la transmission des efforts vers la structure.

**Constitution :**
- Bague externe
- Bague interne
- Elements roulants (billes ou galets)
- Cage

### Frequences Cinematiques des Roulements

**Notations :**
- d = diametre des elements roulants
- Z = nombre d'elements roulants
- De = diametre du chemin de roulement de la bague externe
- Di = diametre du chemin de roulement de la bague interne
- Dm = diametre primitif du roulement = (De + Di) / 2
- α = angle de contact (roulement a contact oblique)
- F0 = frequence de rotation de l'arbre (la bague externe est supposee fixe)

### Formules des Frequences de Defaut

| Type de Defaut | Formule |
|----------------|---------|
| **Cage (FC)** | FC = (1/2) x [1 - (d/Dm) x cos(α)] x F0 |
| **Bague externe (FBE)** | FBE = (Z/2) x [1 - (d/Dm) x cos(α)] x F0 |
| **Elements roulants (FB)** | FB = (Dm / 2d) x [1 - (d/Dm x cos(α))²] x F0 |
| **Bague interne (FBI)** | FBI = (Z/2) x [1 + (d/Dm) x cos(α)] x F0 |

**Relation fondamentale :**
```
FBE + FBI = Z x F0
```

### Phases de Degradation d'un Roulement

**Phase 1 - Debut d'ecaillage :**
Le defaut presente une microcavite ou une microfissuration. Il n'y a pas encore de changement de la surface de la piste. Chaque element en passant sur le defaut provoque un impact dans la bague presentant le defaut et en excite sa frequence propre. La frequence de resonance d'une bague se situe en general entre 2 et 3 kHz.

**Phase 2 - Developpement d'ecaillage :**
L'aggravation du defaut se traduit par un arrachement de matiere. Les elements roulants roulent successivement dans et hors de la cavite. Le choc cree a l'entree et a la sortie de l'element roulant excite les vibrations de la frequence BPFO ou BPFI.

**Phase 3 - Extension d'ecaillage :**
Le defaut continuant a s'aggraver, la zone d'arrachement de matiere est de plus en plus importante. La quantite d'energie sera plus basse en frequence. Ce stade de degradation sera plus facilement visible dans un spectre en vitesse.

**Phase 4 - Destruction :**
Le defaut de piste interne ou externe devient de plus en plus long. Quand le contour de la bague est completement deteriore, les vibrations generent une grande quantite de bruit de fond et on ne peut plus determiner le nombre d'elements roulants passant par le defaut.

### Modulation de BPFO et BPFI
Principalement pour les defauts de bagues internes, les vibrations du defaut sont modulees. Ceci s'exprime dans les spectres par des bandes laterales de par et d'autre de BPFO ou BPFI.

**Causes :**
- Le defaut tourne avec l'arbre donc a la vitesse de rotation du rotor
- La charge appliquee sur le roulement reste toujours dans la meme direction
- Ceci provoque une augmentation de l'amplitude de la force agissant sur le defaut et de la vibration lorsque le defaut passe dans la zone la plus chargee

**Le defaut de bague interne presente generalement des amplitudes moins elevees que le defaut de bague externe** car le signal doit traverser les billes et la cage externe avant d'arriver au capteur.

### Le Facteur de Defaut Roulement (FDR)

Le Facteur de Defaut Roulement est un traitement specifique du signal temporel adapte a la surveillance des roulements :

```
FDR = a x FC + b x ARMS
```

Avec :
- FC = Facteur de crete
- ARMS = Valeur efficace (RMS)

**Avantages :**
- Facteur absolu
- Detection precoce
- Peu sensible aux conditions de fonctionnement
- Valeur croissante sur les 3 phases de la degradation
- Utilisation simple et adaptee au diagnostic automatique

**Niveaux d'alarme recommandes (pour machines de 600 a 6000 RPM) :**
- **Alerte a 6**
- **Danger a 9**

### Le Facteur de Defaut Roulement et le Defaut de Graissage
L'augmentation du niveau du Facteur de Defaut peut etre liee a un defaut de graissage du roulement. En l'absence d'historique d'evolution, on procedera a un test de graissage du roulement :
- **Si le niveau du FDR reste stable apres graissage** : il s'agit sans doute d'un probleme de graissage
- **Si le niveau du FDR ne chute pas de maniere importante** : il s'agit vraisemblablement d'une usure du roulement

---

## 3.9 Defauts sur les Paliers Lisses

Les defauts sur les paliers lisses ne provoquent pas de veritables vibrations, comme c'est le cas pour les roulements.

**Surveillance recommandee :**
- Le meilleur moyen pour la surveillance des paliers lisses est l'utilisation de capteurs de deplacement qui permettent de mesurer les deplacements de l'axe de rotation
- En utilisant un collecteur bi-voies, il est possible d'utiliser l'analyse orbitale

**Probleme specifique : Instabilite du film d'huile**
- Des turbulences se produisent dans l'huile et provoquent l'excentricite de l'arbre
- Cette excentricite peut aussi etre provoquee par un balourd
- La frequence resultante de l'instabilite du film d'huile se situe aux alentours de **0.35 a 0.49 fois la vitesse de rotation**

**Solution :** Changer les paliers ou le lubrifiant. Il existe des formes particulieres de coupes de palier pour contrecarrer l'instabilite du film d'huile.

---

## 3.10 Cavitation (Pompes)

La cavitation se caracterise par :
- Un spectre a large bande moyenne frequence
- Des vibrations aleatoires a haute frequence
- Presence de bruit caracteristique (crepitement)

---

# PARTIE 4 : MAINTENANCE ET SURVEILLANCE

## 4.1 Historique du Management en Maintenance

### Maintenance Curative
Autrefois, les machines fonctionnaient jusqu'a tomber en panne. Elles etaient alors reparees. Cette approche presentait deux inconvenients majeurs :
- Un defaut mineur (ex: usure d'un roulement) peut evoluer vers une destruction majeure du rotor
- L'arret brutal de la ligne de production cause des pertes financieres importantes

### Maintenance Preventive Systematique
Chaque composant usé etait remplace a intervalles reguliers.

**Inconvenients :**
- Les couts de maintenance sont eleves (remplacement permanent)
- Dans la plupart des cas, le remplacement est inutile (composant encore en bon etat)
- Chaque intervention de maintenance n'est pas parfaite (risque d'installation defectueuse)

### Maintenance Previsionnelle (Predictive)
L'etat et l'usure de la machine sont mesures regulierement et si la situation se degrade, une intervention de maintenance est obligatoire uniquement lorsque cela est reellement necessaire.

**Avantages :**
- Reduction des couts de maintenance
- Augmentation du MTBF (Mean Time Between Failures)
- Planification des arrets de production
- Prevention des pannes catastrophiques

---

## 4.2 Organisation des Mesures

### Creer l'Arborescence
Tout d'abord, nous devons creer l'arborescence de l'usine :
1. Creer une liste des machines a mesurer
2. Creer une liste de points de mesure pour chaque machine
3. Utiliser les logiciels fournis avec les analyseurs de vibrations (ex: DDS pour Adash)

### Ronde de Mesure
- La liste transferee a l'analyseur est appelee **ronde de mesure**
- Elle determine le lieu ou nous allons mesurer
- Au retour de l'itineraire, nous transferons toutes les mesures a l'ordinateur

### Frequence des Mesures
- La frequence optimale est probablement **mensuelle**
- L'intervalle maximal a ne pas depasser est de **deux mois**
- Pour les machines critiques : utiliser des **systemes en ligne**

### Attention lors des Releves
- Le seul veritable danger est de mesurer au mauvais endroit, voire sur la mauvaise machine
- Les donnees seront alors enregistrees au mauvais endroit dans l'ordinateur

---

## 4.3 Evaluation des Valeurs de Mesure

### L'Utilisation des Standards (Normes)
Si une norme existe, elle peut etre utilisee. Elle indique les valeurs limites de vibrations, generalement les limites d'avertissement et de danger.

**Norme de base : ISO 20816 (ancienne ISO 10816)**

| Seuil | Action |
|-------|--------|
| Limite avertissement depassee | La machine peut encore etre utilisee, mais une intervention de maintenance doit etre planifiee au plus vite |
| Limite danger depassee | Arret immediat de la machine et reparation |

### Que Faire Sans Standards ?

**1. Comparaison entre machines identiques :**
Si nous disposons de plusieurs machines identiques ou similaires, nous pouvons comparer leurs valeurs. Si les vibrations de cinq des six machines identiques atteignent 2 et celles de la sixieme 8, il est clair qu'il y a un probleme sur cette derniere.

**2. Analyse de la tendance (Trending) :**
Si la tendance est stable sur le long terme, l'etat de fonctionnement est egalement stable. Si les vibrations augmentent, cela signifie que les dommages augmentent et que la machine doit etre reparee ou reglee.

**3. Regles pratiques :**
- Si les valeurs sont plus ou moins identiques dans la tendance (± 15%), la machine fonctionne dans un etat stable
- Si les valeurs augmentent, il y a un defaut
- Si les valeurs de tendance sont stables au debut, les prendre comme reference
- Limite d'avertissement = 2 x reference
- Limite de danger = 5 x reference

---

## 4.4 Taux de Reussite des Diagnostics

C'est comparable a la prise en charge de la sante humaine. Les controles preventifs reguliers sont comme des rondes de mesure. Les resultats sont excellents, ce qui signifie que nous sommes en parfaite sante. Et pourtant, soudain, un probleme de sante non detecte apparait.

**Il est jamais efficace a 100%.** Parfois, le defaut est trop cache a l'interieur de la machine et difficile a identifier dans les vibrations.

Le diagnostic des vibrations est absolument essentiel pour surveiller l'etat des machines. Aucun autre type de diagnostic ne permet de detecter un eventail aussi large de defauts et d'usures.

---

## 4.5 Rapports de Mesure

### Principes de Redaction
- Le personnel de maintenance ne maitrise pas tres bien les concepts de diagnostic vibratoire
- Utiliser un vocabulaire qu'ils comprennent
- Les rapports sont aussi concis que possible
- Il est inutile d'inclure une longue liste de machines en bon etat
- Seules les machines necessitant un reglage ou une reparation doivent figurer dans le rapport
- Le service de maintenance privilegie un rapport contenant une breve declaration : **"tout est OK"**

---

# PARTIE 5 : GRANDEURS PHYSIQUES ET UNITES

## 5.1 Systeme International (SI)

Toute mesure doit avoir son unite physique :
- **Masse** : kilogramme (kg)
- **Temps** : seconde (s)
- **Longueur** : metre (m)

## 5.2 Mesure de Deplacement

**Unite SI :** le metre (m), converti en cm, mm, μm, pouce ou millipouce (1 mil = 0.001 pouce)

Le stylo trace la position de la masse au cours du temps. On peut parler de son deplacement.

**Relations de conversion pour signal sinusoidal :**
```
disp_RMS = acc_RMS / (2πf)²
disp_0-P = acc_0-P / (2πf)²
disp_RMS = vel_RMS / (2πf)
disp_0-P = vel_0-P / (2πf)
```

## 5.3 Mesure de Vitesse

**Unite SI :** m/s. En pratique : mm/s ou pouce/s

La forme d'onde de la vitesse est decalée d'un quart de periode (T/4) vers la gauche par rapport au deplacement, soit exactement **90° en phase**.

**Relations de conversion pour signal sinusoidal :**
```
vel_RMS = acc_RMS / (2πf)
vel_0-P = acc_0-P / (2πf)
vel_RMS = disp_RMS x (2πf)
vel_0-P = disp_0-P x (2πf)
```

## 5.4 Mesure d'Acceleration

**Unite SI :** m/s². En pratique : g (1 g = 9.81 m/s²)

La forme d'onde d'acceleration est decalée d'une demi-periode (T/2) vers la gauche par rapport au deplacement, soit **180° en phase** par rapport au deplacement, et **90°** par rapport a la vitesse.

**Relations de conversion pour signal sinusoidal :**
```
acc_RMS = vel_RMS x (2πf)
acc_0-P = vel_0-P x (2πf)
acc_RMS = disp_RMS x (2πf)²
acc_0-P = disp_0-P x (2πf)²
```

## 5.5 Pourquoi Mesurer Basses Frequences en Deplacement et Hautes Frequences en Acceleration ?

### Exemple A : Machine a basse vitesse (300 tr/min = 5 Hz)
- disp_RMS = 100 μm
- acc_RMS = 100 μm x (2π x 5)² ≈ 0.009 g RMS

**Avec un capteur de deplacement (8 mV/μm) :** 800 mV → facile a mesurer
**Avec un capteur d'acceleration (100 mV/g) :** 0.9 mV → peut etre masque par le bruit

### Exemple B : Turbocompresseur a grande vitesse (120 000 tr/min = 2000 Hz)
- acc_RMS = 1 g = 10 m/s²
- disp_RMS = 10 / (2π x 2000)² ≈ 0.069 μm

**Avec un capteur d'acceleration (100 mV/g) :** 100 mV → facile a mesurer
**Avec un capteur de deplacement (8 mV/μm) :** 0.5 mV → tres faible, peut-etre couvert par le bruit

### Conclusion
- **Basses frequences** : mesurer le **deplacement** (μmm)
- **Hautes frequences** : mesurer l'**acceleration** (g)

---

## 5.6 Calcul de la Frequence

### Formules de Base
```
f = 1/T  (T en secondes)
f = 1000/T  (T en millisecondes)
```

### Conversion Tr/min ↔ Hz
```
RPM = Hz x 60
Hz = RPM / 60
```

### Exemples
- 1 seconde = 1 Hz
- 500 ms = 2 Hz
- 100 ms = 10 Hz
- 60 tr/min = 1 Hz
- 3000 tr/min = 50 Hz

---

# PARTIE 6 : TRAITEMENT DU SIGNAL

## 6.1 Signal Temporel

Les vibrations sont les mouvements oscillatoires repetes d'une masse entre deux positions extremes.

L'important est de savoir si l'amplitude des vibrations (c'est-a-dire la distance entre les positions extremes) est acceptable pour le fonctionnement de la machine ou pas.

## 6.2 Numerisation du Signal

La numerisation consiste a convertir un signal analogique en nombres. Nous selectionnons un instant temporel et lisons sa valeur. Nous l'appellerons l'echantillon a l'instant defini.

### Frequence d'Echantillonnage
Nous devons lire des valeurs a intervalles reguliers (egaux). Par exemple, l'intervalle entre les lectures sera de 1 ms (0,001 s). Si la duree du signal est de 1 s, nous obtiendrons 1000 echantillons.

**Theoreme de Shannon :** La frequence d'echantillonnage doit etre au moins le double de la frequence maximale du signal.

## 6.3 Amplitude de Vibration

### Valeur 0-P (Peak)
Distance entre la valeur moyenne du signal (correspondant a la position de repos) et la valeur maximale.

### Valeur P-P (Peak-to-Peak, Crete a Crete)
Distance entre les valeurs maximale et minimale. Pour un signal symetrique, la valeur P-P est le double de la valeur 0-P.

### Valeur Moyenne (AVG)
La valeur moyenne est calculee comme la somme des valeurs de tous les echantillons, divisee par leur nombre.

Pour un signal sinusoidal : **AVG = 0.64 x valeur 0-P**

**Formule pour signal numerise :**
```
AVG = (Σ|yi|) / N
```

!!! Attention ! Cette conversion ne doit pas etre appliquee aux signaux qui n'ont pas la forme d'une fonction sinusoidale.

### Valeur RMS (Root Mean Square)

Son avantage est qu'elle correspond a l'energie contenue dans le signal.

**Calcul :**
1. Tous les echantillons du signal sont d'abord eleves au carre
2. On calcule la moyenne des carres
3. On prend la racine carree de cette moyenne

Pour un signal sinusoidal : **RMS = 0.71 x valeur 0-P**

**Formule pour signal numerise :**
```
RMS = sqrt(Σ(yi²) / N)
```

**Relation entre les grandeurs pour un signal sinusoidal :**

| Type | Formule |
|------|---------|
| 0-P | 0-P = RMS / 0.71 |
| P-P | P-P = 2 x 0-P |
| AVG | AVG = 0.64 x 0-P |

## 6.4 Periode et Phase

### Definition
Le dephasage est le decalage temporel entre deux signaux. Il peut etre defini en temps (secondes) mais en pratique, on utilise une approche angulaire.

### Approche Angulaire
Imaginons une balle attachee a une ficelle que nous faisons tourner en cercle :
- Vue de face : la balle tourne autour du centre
- Vue de profil : elle vibre entre deux positions extremes

Une periode = 360°. Cette approche est independante de la frequence.

**Decalages de phase :**
- Vitesse vs Deplacement : -90° (vitesse en avance)
- Acceleration vs Deplacement : -180° (acceleration en avance)
- Acceleration vs Vitesse : -90° (acceleration en avance)

## 6.5 Transformee de Fourier (FFT)

Nous passons d'une mesure de niveau global a une mesure spectrale par un calcul mathematique nomme **Transformation de FOURIER (FFT : Fast Fourier Transform)**.

Le spectre indique a quelles frequences les vibrations emettent de l'energie, c'est-a-dire a quelles frequences elles sont presentes et quelle est leur intensite.

**Resolution spectrale :**
```
df = Fmax / Nlignes
temps_mesure = 1 / df
```

Avec :
- df = difference de frequence entre les lignes voisines
- Nlignes = nombre de lignes du spectre

---

# PARTIE 7 : CONFIGURATION DES MESURES

## 7.1 Types de Mesures

### Mesure Globale (Niveau 1)
Pour indiquer la valeur globale mesuree, il faut toujours indiquer **quatre parametres** :

**Exemple :** 4.8 mm/s RMS dans la bande 10-1000 Hz

| Parametre | Description |
|-----------|-------------|
| **Amplitude** | Valeur numerique (ex: 4.8) |
| **Unite** | mm/s, g, μm, m/s²... |
| **Type de calcul** | RMS, 0-P, P-P... |
| **Bande de frequence** | Fmin - Fmax (ex: 10-1000 Hz) |

**N'oubliez jamais cette regle de quatre !**

### Mesure Spectrale (FFT)

| Parametre | Valeur typique |
|-----------|---------------|
| Fenetre | Hanning |
| Fmin | 10 Hz (ou plus bas si necessaire) |
| Plage | 1000 Hz (mm/s) ou 25600 Hz (g) |
| Lignes | 1600-6400 |
| Moyenne | 8 |

### Mesure d'Enveloppe (Demodulation Spectrale)

| Parametre | Valeur typique |
|-----------|---------------|
| Demodulation Fmin-Fmax | 500 Hz - 25 kHz |
| Plage | Quelques centaines de Hz |
| Lignes | 1600 suffisent |

## 7.2 Choix des Bandes de Frequence

### Pour les Defauts Mecaniques (Balourd, Alignement, Jeu)
- **Unite :** mm/s
- **Bande :** 10-1000 Hz
- **Fmin pour machines lentes (< 600 tr/min) :** 1-2 Hz

### Pour les Roulements
- **Unite :** g
- **Bande haute frequence :** 500 Hz - 25 kHz
- **Bande pour roulements lents :** Fmin plus faible (500 Hz)

### Pour les Engrenages
- **Bande :** Couvre la frequence d'engrenement et ses harmoniques

## 7.3 Reglages du Capteur

| Parametre | Description |
|-----------|-------------|
| **ICP** | Active/desactive selon le capteur (attention au risque d'endommagement) |
| **Unite** | g ou m/s² pour accelerometre |
| **Sensibilite** | Ex: 100 mV/g |

## 7.4 Nombre d'Echantillons et Duree de Mesure

Pour les machines dont la vitesse est superieure a 10 Hz (600 tr/min) :
- **Duree de mesure :** 1 seconde suffit
- **Minimum :** 10 tours de rotor

Pour les machines a faible vitesse :
- Le signal doit contenir au moins **10 tours**
- Exemple : a 2 Hz (120 tr/min), mesurer au moins 5 secondes

---

# PARTIE 8 : DIAGNOSTIC AVANCE

## 8.1 Analyse d'Enveloppe (Demodulation)

### Principe
L'analyse d'enveloppe permet de detecter les chocs genere's par les defauts de roulements. Les frequences de chocs sont elevees, donc le signal d'acceleration doit toujours etre mesure.

### Probleme
On peut calculer le spectre directement a partir d'un signal temporel avec chocs. Cependant, aucune amplitude aux frequences de defaut n'est visible car la valeur RMS correspond a l'energie contenue dans le signal, et les chocs ont une surface faible sous le signal.

### Solution : La Demodulation

**Etape 1 : Filtrage**
Filtrer les basses frequences (ex: < 500 Hz) pour eliminer la composante sinusoidale a la frequence de vitesse.

**Etape 2 : Modulation d'enveloppe**
Les chocs individuels sont convertis par une diode (qui ne laisse passer qu'une tension positive), puis elle charge un condensateur C, puis se decharge lentement a travers une resistance R. Cela produit un signal en sortie similaire aux enveloppes de chocs.

**Etape 3 : Spectre d'enveloppe**
Le calcul du spectre reagit bien mieux a ce signal et nous pouvons observer des pics significatifs aux frequences de defaut (BPFI, BPFO, BSF, FTF).

### Spectre d'Enveloppe Typique
Si le defaut se situe uniquement sur la bague externe, nous pouvons voir sa frequence (BPFO) dans le spectre, suivie de ses composantes harmoniques (2xBPFO, 3xBPFO, 4xBPFO, 5xBPFO...).

### Avantages de la Demodulation
- Permet de detecter un defaut de roulement tres tot
- Connaitre les frequences de defaut permet de ne pas etre perturbe par d'autres frequences

### Frequences de Defaut Roulement

| Type | Frequence |
|------|-----------|
| **BPFI** | Ball Pass Frequency Inner race |
| **BPFO** | Ball Pass Frequency Outer race |
| **BSF** | Ball Spin Frequency |
| **FTF** | Fundamental Train Frequency (cage) |

## 8.2 Mesures Online (En Continu)

### Principe
Des capteurs sont montes sur la machine et son etat est surveille en permanence. Cela presente l'avantage de pouvoir surveiller l'etat en continu et de detecter immediatement tout probleme.

**Avantage majeur :** Mesure une nouvelle valeur toutes les secondes (vs toutes les 2 semaines en ronde)

### Points Essentiels
1. Les performances du processeur ne sont pas infinies
2. La capacite du disque dur pour le stockage des donnees n'est pas infinie

**Solution :** Algorithmes de reduction de donnees (ne sauvegarder que les valeurs qui changent).

## 8.3 Ecoute des Vibrations

Ancienne methode : un tournevis etait presse face contre la machine, puis sa face arriere etait pressee contre l'oreille.

Aujourd'hui, les instruments permettent d'ecouter les vibrations via un casque. Les roulements (leur bruit ou leur sifflement) sont parfaitement audibles. Divers phenomenes repetitifs, notamment les chocs a l'interieur de la machine, sont bien audibles.

**Limites :** Il est impossible d'ecouter les signaux provenant des defauts mecaniques tels le balourd (basses frequences non audibles).

## 8.4 Ultrasons

Les ultrasons sont des signaux dont les frequences sont superieures a 25 kHz.
- Microphones speciaux avec sensibilite maximale autour de 40 kHz
- Utiles pour detecter les fuites d'air sous pression
- N'offrent aucun avantage par rapport aux mesures par capteurs d'acceleration pour les roulements

## 8.5 Desequilibre Electrique

Dans le cas des moteurs electriques, il peut arriver que le bobinage electrique soit defectueux. Les forces electromagnetiques ne sont alors pas equilibrees.

**Test de detection :**
1. Placer un capteur sur le moteur
2. Lancer une mesure continue de vitesse de vibration efficace (10-1000 Hz)
3. Couper l'alimentation du moteur
4. Observer le comportement :
   - **Diminution lente** : balourd mecanique reel
   - **Chute brutale** : defaillance des enroulements electriques

## 8.6 Resonance

### Definition
La resonance se produit lorsque la frequence d'excitation correspond a la frequence propre de la structure. A la vitesse de resonance, la force centrifuge desequilibree genere soudainement une valeur de vibration beaucoup plus elevee.

### Detection
1. **Si la vitesse est variable :** augmenter progressivement et mesurer. Si la vibration augmente brusquement a une certaine vitesse puis redescend → resonance
2. **Si la vitesse est fixe :** couper l'alimentation et observer pendant la deceleration. En cas de diminution soudaine → resonance
3. **Mesures en plusieurs points :** les valeurs sont faibles sur les bords (supports) et les plus elevees au milieu

### Causes
- Mauvaise conception du chassis de montage
- Chassis en acier trop flexible
- Machine montee sur des supports inadaptes

### Solution
Changer le chassis ou son support. L'ajout d'un support au milieu est toujours utile.

---

# PARTIE 9 : CAS PRATIQUE - TP ANALYSE VIBRATOIRE SANIJURA

## 9.1 Presentation

Le service maintenance de la societe SANIJURA a decide de mettre en place un suivi vibratoire sur un groupe de ventilation car il ne dispose d'aucun moyen pour savoir dans quel etat se trouve le systeme.

Ce groupe est critique : s'il y a un probleme sur la ligne d'aspiration, l'entreprise sera en arret production car la centrale aspire tous les copeaux produits par les machines.

### Composition du Moto-Ventilateur
- Un moteur qui entraine, par 3 courroies et un arbre de transmission, un ventilateur compose de 10 pales en rotation
- Tous ces elements sont proteges par des carters de protection

## 9.2 References du Moto-Ventilateur

### Moteur
| Parametre | Valeur |
|-----------|--------|
| Marque | CEM |
| Type | MJPP180LR4 |
| Numero de serie | 851352 |
| Vitesse | 1450 tr/min |
| Puissance | 30 kW |
| Poids | 175 kg |
| Roulement AV | SKF 6312 |
| Roulement AR | SKF 6311 |
| Tension d'alimentation | 3/390/690 V |
| Courant d'alimentation | 56 A |
| Protection IP | 23 |

### Transmission
| Parametre | Valeur |
|-----------|--------|
| Nombre de courroies | 3 |
| Reference courroie | SPB3550 |
| Longueur courroie | 3578 mm |
| Diametre poulie motrice | 250 mm |
| Diametre poulie receptrice | 250 mm |

### Ventilateur
| Parametre | Valeur |
|-----------|--------|
| Type | BLC |
| Numero de serie | 70123 |
| Vitesse | 1450 tr/min |
| Debit | 5 m³/s |
| Nombre de pales | 10 |

## 9.3 Calcul des Frequences Caracteristiques

### Moteur (1450 tr/min)
| Frequence | Formule | Resultat |
|-----------|---------|----------|
| Frequence de rotation (FR) | 1450/60 | 24.17 Hz |
| Frequence d'alimentation (FA) | 50 Hz | 50 Hz |
| 2xFA | 2 x 50 | 100 Hz |
| Frequence de synchronisme | - | 50 Hz |
| Nombre de paires de poles | - | 2 |
| Glissement | (50-24.17)/50 | 0.517 |

### Roulements

**SKF 6311 (AR moteur) :**
- Frequence bague interne (BPFI) : ≈ 0.56 x Z x FR
- Frequence bague externe (BPFO) : ≈ 0.44 x Z x FR
- Frequence element roulant (BSF) : ≈ 0.42 x Z x FR
- Frequence cage (FTF) : ≈ 0.4 x FR

**SKF 6312 (AV moteur, poulies et ventilateur) :**
- Frequence bague interne (BPFI)
- Frequence bague externe (BPFO)
- Frequence element roulant (BSF)
- Frequence cage (FTF)

### Transmission par Courroies
| Frequence | Formule | Resultat |
|-----------|---------|----------|
| Poulie motrice | FR moteur | 24.17 Hz |
| Poulie receptrice | FR x (D motrice/D receptrice) | 24.17 Hz |
| Passage des courroies | N x FR | 3 x 24.17 = 72.5 Hz |

### Ventilateur
| Frequence | Formule | Resultat |
|-----------|---------|----------|
| Frequence de rotation | - | 24.17 Hz |
| Passage des pales | 10 x FR | 241.7 Hz |

## 9.4 Parametrage des Mesures

### Points de Mesure
- **P1** : Moteur cote roulement AV
- **P2** : Moteur cote roulement AR
- **P3** : Ventilateur cote poulies
- **P4** : Ventilateur cote oppose

### Parametres d'Acquisition Type
| Parametre | Valeur |
|-----------|--------|
| Type de mesure | Acceleration / Vitesse |
| Bande de frequence | 10-1000 Hz (vitesse) / 2-20000 Hz (acceleration) |
| Resolution | 1600 lignes |
| Fenetre | Hanning |

---

# PARTIE 10 : FORMULAIRE COMPLET DES FREQUENCES DE DEFAUT

## 10.1 Formules Generales

### Frequences de Rotation
```
F0 (Hz) = Vitesse (tr/min) / 60
```

### Moteur Asynchrone
```
FS = FA x p                          (Frequence de synchronisme)
g = (FS - FR) / FS                   (Glissement)
Fg = FS - FR = FS x g                (Frequence de glissement)
Fenc = q1 x R x FR ± q2 x 2 x FA   (Frequences d'encoches)
```

### Roulements
```
FC = (1/2) x [1 - (d/Dm) x cos(α)] x F0                          (Cage)
FBE = (Z/2) x [1 - (d/Dm) x cos(α)] x F0                         (Bague externe)
FBI = (Z/2) x [1 + (d/Dm) x cos(α)] x F0                         (Bague interne)
FB = (Dm / 2d) x [1 - (d/Dm x cos(α))²] x F0                    (Elements roulants)
```

### Engrenages
```
FE = N1 x F1 = N2 x F2              (Frequence d'engrenement)
FC = FE / NC                        (Frequence de coincidence)
```

### Courroies
```
FP = (π x D1 x F1) / L              (Frequence de passage)
```

### Ventilateur / Pompe
```
FPales = N x F0                     (Frequence de passage des pales)
```

## 10.2 Signatures Spectrales par Type de Defaut

| Defaut | Frequences dominantes | Remarques |
|--------|----------------------|-----------|
| **Balourd** | F0 | Amplitude radiale > axiale |
| **Delignage angulaire** | F0, 2F0, 3F0 | Amplitude axiale > radiale |
| **Delignage parallele** | 2F0 | - |
| **Jeu** | n x F0 (harmoniques) | Signal irregulier |
| **Roulement BE** | BPFO + harmoniques | - |
| **Roulement BI** | BPFI + bandes laterales F0 | - |
| **Roulement bille** | 2 x BSF | - |
| **Engrenement usure** | FE + harmoniques + bandes laterales | - |
| **Dent cassee** | FC = FE / NC | - |
| **Courroie** | FP, 2 x FP | - |
| **Cavitation** | Large bande haute frequence | - |
| **Electrique** | 2 x FA, encoches | Disparait a l'arret |

---

# PARTIE 11 : OUTILS ET REGLAGES PRATIQUES

## 11.1 Reglages Basiques d'un Analyseur

### Reglage Capteur
| Parametre | Valeur |
|-----------|--------|
| ICP | Active pour capteur standard |
| Unite | g ou m/s² |
| Sensibilite | 100 mV/g (typique) |

### Reglage Valeurs Globales (Niveau 1)
| Parametre | Valeur |
|-----------|--------|
| Canal | 1 (ou autre) |
| Unite | mm/s (defauts mecaniques) ou g (roulements) |
| Type de detection | RMS |
| Bande Fmin-Fmax | 10-1000 Hz (mecanique) ou 500-25000 Hz (roulements) |
| Echantillons | Selon la duree souhaitee |

### Reglage Mesure Signal Temporel
Memes parametres que niveau 1 + frequence d'echantillonnage (automatique selon Fmax).

### Reglage Mesure Spectre FFT
| Parametre | Valeur |
|-----------|--------|
| Fenetre | Hanning |
| Fmin | 10 Hz (ou plus bas) |
| Plage | 1000 Hz (mm/s) ou 25600 Hz (g) |
| Lignes | 1600-6400 |
| Moyenne | 8 |

### Reglage Demodulation Spectrale (Enveloppe)
| Parametre | Valeur |
|-----------|--------|
| Demodulation Fmin-Fmax | 500 Hz - 25 kHz |
| Plage | Quelques centaines de Hz |
| Lignes | 1600 |

## 11.2 Conversion entre Grandeurs

### Pour un Signal Sinusoidal
```
0-P = RMS / 0.71
P-P = 2 x 0-P
AVG = 0.64 x 0-P
```

### Conversion Derivation/Integration
```
vel_RMS = acc_RMS / (2πf)
disp_RMS = vel_RMS / (2πf) = acc_RMS / (2πf)²

acc_RMS = vel_RMS x (2πf)
acc_RMS = disp_RMS x (2πf)²
```

## 11.3 Calibration

**Verification simple :**
- Si un seul instrument : laboratoire d'etalonnage
- Si plusieurs instruments : comparaison croisee pour identifier un eventuel probleme (capteur, cable ou instrument)
- Utilisation d'un generateur electronique simulant un capteur

---

# PARTIE 12 : GUIDE DE DIAGNOSTIC RAPIDE

## 12.1 Arbre de Decision Simplifie

**1. Mesurer les valeurs RMS globales en vitesse (10-1000 Hz)**
   - Si elevees → poursuivre l'analyse
   - Si normales → roulements OK, passer a l'acceleration

**2. Verifier la direction predominante**
   - Axial > Radial → Delignage probable
   - Radial > Axial → Balourd probable
   - Harmonniques presents → Jeu ou delignage severe

**3. Mesurer l'acceleration (500-25000 Hz)**
   - < 0.3 g RMS → Excellent etat
   - 0.3-1 g RMS → Surveillance
   - 1-2 g RMS → Alerte roulement
   - > 2 g RMS → Danger

**4. Si alerte roulement → Analyse d'enveloppe**
   - Identifier BPFI, BPFO, BSF, FTF
   - Localiser le defaut

**5. Verifier la vitesse de rotation**
   - Comparer avec les valeurs de reference
   - Controler la stabilite

## 12.2 Conseils Pratiques

| Situation | Action recommandee |
|-----------|-------------------|
| Vibrations axiales elevees | Aligner la machine |
| Vibrations radiales elevees | Equilibrer le rotor |
| Jeu detecte | Verifier les fixations et les roulements |
| Roulement defaillant | Remplacer le roulement |
| Resonance detectee | Modifier la structure ou la vitesse |
| Defaut electrique | Controler le bobinage |

---

# ANNEXES

## A. Glossaire des Abréviations

| Abréviation | Signification |
|-------------|---------------|
| **RMS** | Root Mean Square (Valeur efficace) |
| **AVG** | Valeur moyenne |
| **RPM** | Tours par minute |
| **FFT** | Fast Fourier Transform |
| **BPFI** | Ball Pass Frequency Inner race |
| **BPFO** | Ball Pass Frequency Outer race |
| **BSF** | Ball Spin Frequency |
| **FTF** | Fundamental Train Frequency |
| **FDR** | Facteur de Defaut Roulement |
| **ICP** | Integrated Circuit Piezoelectric |
| **MTBF** | Mean Time Between Failures |
| **SE** | Spectre d'Envelope |
| **HFD** | High Frequency Detection |
| **GSE** | Groupe Spectral d'Energie |
| **SPM** | Shock Pulse Method |

## B. Normes de Reference

| Norme | Description |
|-------|-------------|
| **ISO 20816 (ex ISO 10816)** | Evaluation des vibrations des machines par mesurages sur les parties non tournantes |
| **ISO 1940** | Equilibrage des rotors rigides |
| **DIN ISO 10816-3** | Evaluation standard pour vibration monitoring |

## C. Constructeurs et Prestataires

**Constructeurs de materiels :**
- IRD Mechanalysis
- Bruel & Kjaer
- SCHENCK

**Prestataires de service :**
- AIF
- S'TELL Diag
- CVI
- COMMINS

**Fabricants d'analyseurs :**
- ADASH (A4900 Vibrio, A3716, A3800)
- 01dB-Metravib

---

*Document etabli a partir des supports de formation et documentation technique des fabricants. Ce guide sert de reference pour la mise en oeuvre d'une maintenance predictive par analyse vibratoire.*

*Version 1.0 - Document exhaustif pour operateurs et ingenieurs*


# Analyse Vibratoire et Maintenance Prédictive

Ce document compile de manière exhaustive les principes et applications de l'analyse vibratoire pour la maintenance prédictive, à l'intention des opérateurs et ingénieurs. Il s'appuie sur les informations extraites du document "24-TDs-Analyse-vibratoire.docx", incluant les schémas cinématiques, les spectres vibratoires et les tables d'identification des défauts.

## I. Mise sous surveillance d'un pont roulant

Dans une entreprise sidérurgique, un pont roulant est un équipement stratégique. Une surveillance vibratoire est mise en place sur la partie "levage". La chaîne cinématique est composée d'un moteur, d'un accouplement avec disque de frein, d'un réducteur à plusieurs étages et d'un tambour.

### 1. Éléments caractéristiques du mécanisme

Le réducteur est constitué de plusieurs arbres, chacun équipé de roulements spécifiques et d'engrenages. Les roulements identifiés sont des SKF de différentes séries. Les engrenages sont caractérisés par leur nombre de dents, permettant le calcul des fréquences d'engrènement.

**Détail de la chaîne cinématique :**

*   **Moteur** : Fréquence de rotation (710 Tr/min), Fréquence d'alimentation (Fa, 2Fa), Fréquence de synchronisme, Nombre de paires de pôles, Glissement. Roulement AV SKF 22222 C, Roulement AR SKF NU 2222E.
*   **Accouplement** : 6 doigts, avec disque de frein.
*   **Réducteur** :
    *   **Arbre 1** : Pignon (20 dents), Roulements AV & AR SKF 24122 C.
    *   **Arbre 2** : Roue (107 dents) / Pignon (24 dents), Roulements AV & AR SKF 24034 C.
    *   **Arbre 3** : Roue (125 dents) / Pignon (24 dents), Roulements AV & AR SKF 23048 C.
    *   **Arbre 4** : Roue (91 dents), Roulements AV & AR SKF 23052 C.
*   **Tambour** : Roulement SKF 22238 C.

Pour chaque roulement, les fréquences caractéristiques de la bague interne, de la bague externe, de l'élément roulant et de la cage sont essentielles pour le diagnostic des défauts. Les fréquences d'engrènement (Fe, 2Fe, 3Fe) doivent être calculées pour chaque étage (1/2, 2/3, 3/4).

### 2. Points de mesure

Les points de mesure doivent être définis sur la chaîne cinématique pour capter les vibrations représentatives de chaque composant. Typiquement, les mesures sont effectuées sur les paliers des roulements, à proximité des engrenages et sur le carter du moteur et du réducteur, dans les directions radiale et axiale.

## II. Groupe Moto-Ventilateur

L'analyse vibratoire d'un groupe moto-ventilateur implique le calcul et l'identification de fréquences spécifiques sur le spectre vibratoire.

**Description du système :**

*   **Moteur** : 3000 tr/min.
*   **Multiplicateur** : Pignon (35 dents) / Roue (89 dents).
*   **Compresseur** : 16 aubes.

**Fréquences caractéristiques et leur interprétation :**

| Fréquence (Hz) | Interprétation |
| :--- | :--- |
| 50 | Rotation du moteur (fréquence fondamentale) |
| 100 | Alignement moteur / multiplicateur (2xN) |
| 127,1 | Rotation du compresseur (N_comp = N_mot * 89 / 35) |
| 352 | Fréquence de passage des billes sur la piste du roulement |
| 2034 | Effet d'aubes du rotor du compresseur (16 aubes * 127,1 Hz) |
| 4450 | Engrènement roue/pignon du multiplicateur (89 * 50 Hz ou 35 * 127,1 Hz) |

## III. Suivi d'une installation : Pompes centrifuges

Sur un site pétrochimique, les pompes centrifuges font l'objet d'un suivi vibratoire afin de permettre au service maintenance d'intervenir avant une grave défaillance.

### 1. Surveillance et relevés

Le suivi se fait selon une fiche de visite. Pour la pompe US 315, la fréquence de rotation est de 1395 RPM, soit 23,25 Hz. Les mesures sont prises en deux points :
*   **Point A (Radial)** : Sur le palier côté pompe.
*   **Point B (Axial)** : Sur le palier côté accouplement.

Les seuils d'alerte et de panne sont définis sur la fiche de visite. Les derniers relevés (en date du 2/8) donnent les valeurs suivantes :
*   **Point A** : 2,8 mm/s. Cette valeur dépasse le seuil d'alerte (environ 1,8 mm/s), nécessitant une investigation.
*   **Point B** : 0,8 mm/s. Cette valeur est normale.

### 2. Diagnostic des défauts

Afin de déterminer la cause de l'évolution au point A, un relevé spectral est réalisé et comparé à la signature de référence de la pompe.

**Analyse du spectre de la pompe US 315 :**
Le relevé spectral du 2/8 montre un pic important à la fréquence de rotation (23,25 Hz) et ses harmoniques, comparé à la signature de référence.

**Analyse du spectre de la machine US 350 :**
La fréquence de rotation est N = 35 Hz. Le spectre montre un pic majeur à 70 Hz (2xN) en radial et axial, suggérant un désalignement ou un jeu mécanique.

### 3. Table d'identification des défauts vibratoires

Le tableau suivant résume les types de défaillances courants, leurs fréquences caractéristiques, la direction privilégiée de la vibration et des remarques pour le diagnostic.

| Type de défaillance | Fréquences caractéristiques des vibrations | Direction | Remarques |
| :--- | :--- | :--- | :--- |
| **Pièce tournante déséquilibrée (balourd)** | 1 x N | Radiale | En général due à la perte d'une aube et correspondant à une élévation subite du niveau des vibrations. |
| **Désalignement et torsion des axes** | 1, 2, 3 et 4 x N | Radiale et axiale | Défaut courant. |
| **Défaut dans les roulements à billes** | Chocs haute fréquence (20 à 60 kHz) | Radiale et axiale | Le paramètre de mesure des vibrations le mieux adapté est l'accélération. |
| **Jeux dans les paliers fixes** | 1/2 et 1/3 x N | Surtout radiale | Il est possible que les jeux n'apparaissent qu'à la vitesse et à la température de fonctionnement. |
| **Cavitation** | Chocs haute fréquence | Radiale et axiale | Paramètre accélération et amplitude maximale sur le corps de la pompe. |
| **Jeux mécaniques / Défauts de fixation** | 1 et 2 x N | Radiale | Défaut courant. |
| **Défauts de courroies** | 1, 2, 3 et 4 x vitesse de rotation de la courroie | Radiale | |
| **Défauts d'engrenages** | Fréquences d'engrenages (N x nombre de dents) | Radiale et axiale | |
| **Augmentation des turbulences** | Fréquence et harmoniques de passage des aubes | Radiale et axiale | L'augmentation des niveaux indique une augmentation des turbulences. |
| **Excitation électrique** | 1 ou 2 x la fréquence synchrone | Radiale et axiale | Disparaît lorsque l'on coupe l'alimentation. |

*Note : N représente la fréquence de rotation de l'arbre concerné.*

## Conclusion

L'analyse vibratoire est un outil puissant pour la maintenance prédictive. Elle permet d'identifier les défauts naissants (balourd, désalignement, défauts de roulements ou d'engrenages) en analysant les fréquences caractéristiques présentes dans le spectre vibratoire. Une surveillance régulière, couplée à une bonne connaissance de la cinématique de la machine, est essentielle pour anticiper les pannes et optimiser les interventions de maintenance.

# Analyse Vibratoire & Maintenance Prédictive — Référence Complète

> **Document de référence exhaustif** à destination des opérateurs et ingénieurs en analyse vibratoire et en maintenance industrielle. Synthèse intégrale du cours BTS Maintenance Industrielle, incluant toutes les formules, notions physiques, signatures de défauts, indicateurs et méthodologies pour le développement d'une solution de maintenance prédictive.

---

## Table des Matières

1. [La Maintenance Prédictive par Condition (MPC)](#1-la-maintenance-prédictive-par-condition-mpc)
2. [Principes Physiques de l'Analyse Vibratoire](#2-principes-physiques-de-lanalyse-vibratoire)
3. [Mathématiques du Signal Vibratoire](#3-mathématiques-du-signal-vibratoire)
4. [Catalogue des Défauts et leurs Signatures Spectrales](#4-catalogue-des-défauts-et-leurs-signatures-spectrales)
5. [Les Indicateurs de Surveillance et de Diagnostic](#5-les-indicateurs-de-surveillance-et-de-diagnostic)
6. [La Chaîne de Mesure](#6-la-chaîne-de-mesure)
7. [Synthèse pour le Développement d'une Solution de Maintenance Prédictive](#7-synthèse-pour-le-développement-dune-solution-de-maintenance-prédictive)

---

## 1. La Maintenance Prédictive par Condition (MPC)

### 1.1. Les Différentes Formes de Maintenance

La maintenance industrielle se divise en deux grandes familles :

```
                        Maintenance
                       /           \
          Préventive                Corrective
         /          \                    \
  Systématique   Conditionnelle     Après la panne
  (intervalles   (état du matériel)
   réguliers)
```

- **Maintenance Corrective** : réparation après l'incident, après la panne. Elle engendre les arrêts non planifiés les plus coûteux.
- **Maintenance Préventive Systématique** : effectuée à intervalles réguliers, selon un calendrier fixé à l'avance, indépendamment de l'état réel de la machine.
- **Maintenance Préventive Conditionnelle (= Maintenance Prédictive)** : effectuée en fonction de l'état réel du matériel, détecté par des mesures et des indicateurs. C'est la forme la plus évoluée de maintenance.

### 1.2. Comparaison Économique des Stratégies

**Impératif économique :** Les arrêts des machines représentent les **2/3 du coût de production**. C'est le 2ème, voire le 1er poste de dépenses dans l'industrie.

| Stratégie | Principe | Application | Risque |
|-----------|----------|-------------|--------|
| Corrective | Attendre la panne | Machines non critiques | Arrêt non planifié, casses secondaires |
| Préventive systématique | Intervalles fixes | Toutes machines | Remplacement de pièces encore bonnes |
| **Prédictive / Conditionnelle** | **Mesures périodiques ou continues** | **Machines critiques** | **Optimal : intervenir juste au bon moment** |

**Fonctionnement de la maintenance prédictive :**

```
Niveau de vibration
        │
        │                              ★ ← Défaut détecté
Danger ─┼────────────────────────────────────────────────────
        │                          ★
Alerte ─┼──────────────────────────★──────────── Tendance →
        │                      ★
Réf.  ──┼──★──★──★──★──★──★──★──────────────────────────────
        └───────────────────────────────────────────────► Temps
                               ↑
                        Détection du défaut
                        (période critique)
```

La maintenance prédictive repose sur la **détection du problème avant la défaillance prévue**, puis la **planification de la maintenance** pendant une fenêtre temporelle appelée "période critique" entre le niveau d'alerte et le niveau de danger.

### 1.3. Notion d'Indicateur — Courbe de Tendance

La courbe de tendance est le cœur du système de maintenance prédictive. Elle permet de :

- **Suivre l'évolution** d'un indicateur vibratoire dans le temps
- **Détecter** le franchissement de seuils d'alerte et de danger
- **Prévoir** le moment de la défaillance par extrapolation de la tendance

```
Amplitude
        │
        │                                     ● ← Incident
        │                                  ●
Danger──┤──────────────────────────────────●──────────────
        │                              ●
Limit.──┤──────────────────────────────●────── Limite de réparation
        │                         ●
Alerte──┤────────────────────────●───────────── Détection défaut
        │              ●●●●●●●
Réf.  ──┤────●●●●●●●●●●───────────────────────
        └─────────────────────────────────────────► t
                              |←Période critique→|
                              |←Temps max avant incident→|
```

Les **niveaux de seuil** à définir pour chaque machine surveillée :
- **Niveau de référence** : état initial de la machine en bon état (baseline)
- **Niveau d'alerte** : premier signe de dégradation — il faut surveiller de plus près
- **Limite de réparation** : la maintenance doit être planifiée rapidement
- **Niveau de danger** : intervention immédiate requise

### 1.4. Avantages et Inconvénients de la MPC

**Avantages (bénéfices) :**
- Espacer les maintenances (n'intervenir que quand nécessaire)
- Réduire la durée des interventions (préparation anticipée)
- Réduire les stocks de pièces de rechange
- Améliorer la qualité des réparations et du montage
- Réduire le coût des pannes
- Éliminer les dommages secondaires (casses en cascade)
- Réduire les indisponibilités (disponibilité machine maximale)

**Inconvénients (coûts d'entrée) :**
- Choix et achat d'un système de surveillance
- Choix des points de mesure, pré-étude, définition des limites
- Formation du personnel (opérateurs + ingénieurs)

**La MPC nécessite une surveillance !** Elle est recommandée pour les machines critiques dont l'arrêt impacte fortement la production.

---

## 2. Principes Physiques de l'Analyse Vibratoire

### 2.1. Qu'est-ce qu'une Vibration ?

**Définition (norme NFE 90-001) :**

> Une vibration est une **variation avec le temps** d'une grandeur caractéristique du mouvement ou de la position d'un système mécanique, lorsque la grandeur est alternativement plus grande et plus petite qu'une certaine valeur moyenne ou de référence.

Les vibrations sont présentes dans tous les systèmes mécaniques en mouvement : trains, voitures, machines industrielles, structures, outils vibrants, etc.

### 2.2. Origine des Vibrations dans une Machine Tournante

Une machine tournante se compose de :

```
         [Rotor]
            ↓ (Ω : vitesse de rotation)
         [Liaison]
         /        \
  [Coussinet]   [Arbre / Ligne de rotation]
  [Palier]             ↓
  [Stator]         [Structure]
```

**Principe fondamental :**

```
Vibration = Force × Mobilité
```

- Le **défaut** génère une **force** interne (excitation)
- La **structure** présente une **mobilité** (susceptibilité à être mise en mouvement)
- La **vibration** mesurée en surface est le **symptôme** du défaut interne

**Axe réel de rotation** : En pratique, un arbre ne tourne jamais parfaitement sur son axe géométrique théorique. Les irrégularités de forme, les déséquilibres et les jeux créent un axe de rotation réel qui oscille autour de l'axe théorique — c'est ce mouvement qui génère les vibrations mesurables.

### 2.3. Relation Signal Temporel ↔ Spectre Fréquentiel

L'analyse vibratoire se fait dans deux domaines complémentaires :

| Domaine | Représentation | Information principale |
|---------|---------------|----------------------|
| **Temporel** | Amplitude en fonction du temps | Forme du signal, chocs, périodicité |
| **Fréquentiel (spectral)** | Amplitude en fonction de la fréquence (FFT) | Identification des sources de vibration |

---

## 3. Mathématiques du Signal Vibratoire

### 3.1. Grandeurs Fondamentales du Signal

**Signal sinusoïdal de base :**

```
d(t) = D · sin(ω·t)
```

Où :
- `d(t)` = déplacement instantané (mm ou µm)
- `D` = amplitude crête (valeur maximale)
- `ω` = pulsation (rad/s)
- `t` = temps (s)

**Relations entre fréquence, période et vitesse angulaire :**

```
f = 1/T          (Hz)
ω = 2·π·f        (rad/s)
f = N/60         (N en tr/min → f en Hz)
```

| Grandeur | Symbole | Unité | Définition |
|---------|---------|-------|-----------|
| Fréquence | f | Hz | 1 Hz = 1 cycle/seconde |
| Période | T | s | Durée d'un cycle complet |
| Pulsation | ω | rad/s | ω = 2πf |
| Vitesse de rotation | N | tr/min | f = N/60 |

### 3.2. Les Trois Grandeurs Physiques de la Vibration

Les vibrations peuvent être caractérisées par trois grandeurs physiques liées entre elles par dérivation :

```
d(t) = D · sin(ω·t)                    [Déplacement, mm ou µm]
v(t) = D·ω · cos(ω·t)                  [Vitesse, mm/s]
a(t) = -D·ω² · sin(ω·t)               [Accélération, m/s² ou g]
```

**Relations entre amplitudes crêtes :**

```
V_crête = D · ω = D · 2πf
A_crête = D · ω² = D · (2πf)²
```

**Choix de la grandeur selon la fréquence :**

| Gamme de fréquence | Grandeur recommandée | Application typique |
|-------------------|---------------------|---------------------|
| Très basse fréquence (< 10 Hz) | Déplacement (µm) | Déséquilibre lent, arbres flexibles |
| Basse/Moyenne fréquence (10–1000 Hz) | Vitesse (mm/s) | Balourd, délignage, jeu mécanique |
| Haute fréquence (1–10 kHz) | Accélération (g ou mg) | Défauts de roulements, engrenages |

### 3.3. Amplitude du Signal — Définitions Clés

```
        Amplitude
            │    Crête-à-Crête
            │    ←──────────→
            │      Crête
            │    ←──────→
     ───────┼──────────────────────────────────► Temps
            │
            │
            │← rms →   ← Moyen →
```

**Formules des indicateurs d'amplitude :**

```
rms  = √(1/T · ∫₀ᵀ x²(t)dt)         [Valeur efficace, Root Mean Square]

Moyen = (1/T) · ∫₀ᵀ |x(t)| dt        [Valeur moyenne redressée]

Facteur Crête = Crête / RMS           [Sans unité, indicateur de chocs]
```

- **Crête (Peak)** : valeur maximale instantanée du signal
- **Crête-à-Crête (Peak-to-Peak)** : différence entre le maximum et le minimum
- **RMS (root mean square)** : la valeur efficace, proportionnelle à l'énergie du signal
- **Facteur Crête** : rapport entre la valeur de pointe et la valeur efficace — indicateur de la présence de chocs dans le signal

### 3.4. La Décomposition de Fourier — Passage Temporel→Fréquentiel

**Théorème de Fourier :**

Tout signal périodique peut se décomposer en une somme de sinusoïdes :

```
S(t) = Σ Sₙ · sin(ωₙ·t + φ)
```

C'est la **Série de Fourier**. La **Transformée de Fourier Rapide (FFT)** est l'algorithme numérique qui calcule cette décomposition.

**Propriété fondamentale :**

- La FFT d'un signal sinusoïdal pur = **un seul pic** à la fréquence f du signal
- La FFT d'un signal composé = **plusieurs pics** aux fréquences de chaque composante
- La FFT d'un signal impulsionnel (choc) = un **peigne de raies** régulièrement espacées

```
Signal temporel                    Spectre FFT
                                   Amplitude
   ~~~                               │    |
   ~~~        ──FFT──►               │    |        |
   ~~~                               └────┼────────┼────► f
                                          f₁       f₂
```

**Relation Période/Fréquence :**
```
Période courte  → Fréquence élevée
Période longue  → Fréquence basse
```

### 3.5. Résolution Spectrale

La résolution spectrale d'un analyseur est le plus petit écart de fréquence mesurable entre deux raies distinctes :

```
Résolution spectrale = Δf / 800
```

Où `Δf` est la largeur totale du spectre analysé, numérisé en 800 lignes (standard des analyseurs de vibration).

**Exemple :** Pour un spectre de 0 à 1000 Hz : Résolution = 1000/800 = **1,25 Hz**

Pour distinguer deux défauts proches en fréquence, il faut réduire `Δf` (zoomer sur une bande étroite).

---

## 4. Catalogue des Défauts et leurs Signatures Spectrales

### 4.1. Le Balourd (Déséquilibre)

**Définition :** Un balourd se produit lorsque le centre de masse d'un rotor n'est pas situé sur son axe de rotation. Une masse excentrée génère une force centrifuge cyclique.

**Force centrifuge générée :**

```
F = M · r · ω²
```

Où :
- `M` = masse excentrée (kg)
- `r` = rayon d'excentricité (m)
- `ω` = vitesse angulaire (rad/s)

**Types de balourd :**

**a) Balourd statique :**
- La masse excentrée est dans un seul plan
- Le rotor s'arrête toujours dans la même position à l'arrêt (gravité)
- Les forces aux deux paliers sont **en phase**
- Sur le spectre : pic unique à **1× la fréquence de rotation (Fo)**

**b) Balourd dynamique :**
- Deux masses identiques décalées de 180° aux extrémités opposées du rotor
- Le rotor est en équilibre statique mais pas dynamique
- Les forces aux deux paliers sont **déphasées** (hors phase)
- Sur le spectre : pic identique à 1× Fo → **la phase est nécessaire** pour distinguer statique de dynamique

**Signature spectrale du balourd :**

```
Amplitude
    │
    │  ████
    │  ████
    │  ████
    └──────┼─────────────────────────► Fréquence
          Fo (= vitesse de rotation)
```

**Règle de diagnostic :** Un pic dominant à exactement la fréquence de rotation = balourd probable. L'analyse de phase (déphasage entre les deux paliers) permet de différencier balourd statique (0° de déphasage) et dynamique (180° de déphasage).

**Spectre réel exemple :** Ventilateur tournant à 2925 tr/min → pic principal à f = 2925/60 = **48,75 Hz**.

### 4.2. Le Délignage (Désalignement)

**Définition :** Un désalignement apparaît lorsqu'un arbre doit en entraîner un autre (via un accouplement) et que les axes ne sont pas correctement alignés.

**Types de désalignement :**
- **Décalage d'axe (parallèle)** : les deux axes sont parallèles mais décalés latéralement
- **Désalignement angulaire** : les deux axes forment un angle entre eux

**Mécanisme vibratoire :** Le désalignement génère un phénomène qui se répète à chaque demi-tour ou à chaque tour → signal temporel très répétitif.

**Signature spectrale théorique :**

```
Amplitude
    │
    │     ████
    │     ████  ███
    │     ████  ███  ██
    └─────┼─────┼────┼────────────► Fréquence
          Fo   2Fo  3Fo
```

Un délignage présente **un pic à Fo** (vitesse de rotation) **et ses harmoniques** (2Fo, 3Fo, parfois 4Fo et plus). L'harmonique 2Fo est souvent la plus élevée dans les désalignements angulaires.

**Signal temporel :** 1 cycle tous les demi-tours (2 pics par tour) pour un désalignement angulaire.

**Spectre réel exemple :** Compresseur tournant à 1500 tr/min → pics à 25 Hz, 50 Hz, 75 Hz...

### 4.3. Le Jeu et le Desserrage Mécanique

**Définition :** Un jeu ou desserrage correspond à un manque de rigidité du montage — par exemple, une machine mal fixée sur sa structure, ou des tolérances excessives entre pièces ajustées.

**Mécanisme :** Le signal temporel est **écrêté** à cause des impacts répétés du palier contre sa butée. Un signal écrêté en temporel génère une série d'harmoniques en fréquentiel.

**Signature spectrale :**

```
Amplitude
    │
    │  ██
    │  ██  ██
    │  ██  ██  ██  ██  ██
    │  ██  ██  ██  ██  ██  ██  ██
    └──┼───┼───┼───┼───┼───┼───┼───► Fréquence
      0,5 Fo 1,5 2,5 3,5 (sous-harmoniques)
          Fo  2Fo 3Fo 4Fo 5Fo  (harmoniques)
```

**Caractéristique unique :** La présence de **sous-harmoniques** (0,5×Fo, 1,5×Fo, 2,5×Fo, 3,5×Fo) est le signe distinctif d'un jeu mécanique. Ces demi-harmoniques n'apparaissent pas dans les autres défauts.

**Types de jeu en roulement :**
- Jeu entre la bague extérieure et le logement du palier
- Jeu entre la bague intérieure et l'arbre
- Jeu excessif entre billes/galets et les cages internes et externes
- Pour les paliers lisses : espace trop important entre arbre et coussinet

### 4.4. Les Courroies

**Défaut typique :** Détérioration localisée de la courroie (partie arrachée, défaut de jointure, etc.) → effort ou choc particulier à la fréquence de passage du défaut.

**Fréquence caractéristique de la courroie :**

```
Fc = Vitesse linéaire de la courroie / Longueur de la courroie
   = (π × D_poulie × n_poulie) / L_courroie
```

La fréquence de défaut de courroie `Fc` est généralement **inférieure à la fréquence de rotation** de la poulie motrice. Elle peut générer des pics à `Fc`, `2Fc`, `3Fc`.

**Signe supplémentaire :** Une courroie détendue génère des pics à la fréquence de rotation et ses harmoniques (peut ressembler à un désalignement ou un balourd — l'expérience et le contexte machine sont nécessaires pour différencier).

### 4.5. Les Engrenages

**Principe :** Quand deux roues dentées s'engrènent, les dents passent en contact à une fréquence appelée **fréquence d'engrènement**.

**Formule de la fréquence d'engrènement :**

```
Fe = Fo × Z
```

Où :
- `Fe` = fréquence d'engrènement (Hz)
- `Fo` = fréquence de rotation de la roue (Hz)
- `Z` = nombre de dents de la roue

**Spectre d'un engrenage sain :**

```
Amplitude
    │
    │              ████
    │              ████    ██
    │              ████    ██   █
    └──────────────┼───────┼────┼──► Fréquence
                   Fe     2Fe  3Fe
```

Un engrenage sain présente uniquement la fréquence d'engrènement et quelques harmoniques de faible amplitude.

**Spectre avec dent détériorée :**

```
Amplitude
    │       (peigne de raies dû aux chocs)
    │    ↓  ↓  ↓  ↓  ↓  ↓  ↓
    │              ████
    │  ↕F1  ↕F1   ████    ↕F1
    └──┼───┼───┼───┼───┼───┼──► Fréquence
       F1  2F1     Fe
```

Une dent défectueuse génère un **choc à chaque rotation** → peigne de raies espacées de F1 (fréquence de rotation de la roue portant la dent défectueuse) autour de la fréquence d'engrènement Fe.

**Spectre avec défaut d'excentricité :**

L'excentricité d'une roue (usure non uniforme, montage excentré) crée des **bandes latérales** (modulations) de part et d'autre de Fe, espacées de F1.

**Deux règles de diagnostic pour les engrenages :**

1. **Règle 1 :** Si les amplitudes du peigne de raies **ne dépassent pas** celle de la fréquence d'engrènement → engrènement en bon état.
2. **Règle 2 :** Un zoom présentant une **image dissymétrique** des modulations autour de Fe est caractéristique d'un engrènement **dégradé**.

### 4.6. Défauts Électriques (Moteurs Asynchrones)

**Pour un moteur asynchrone alimenté en 50 Hz :**

La plupart des défauts électriques (déséquilibre de phases, excentricité du rotor électrique, défauts d'enroulement) se traduiront par un pic important à :

```
f_électrique = 2 × f_alimentation = 2 × 50 = 100 Hz
```

**Diagnostic différentiel :** Pour distinguer un défaut électrique d'un problème mécanique, on coupe l'alimentation. Si le pic à 100 Hz disparaît instantanément → défaut électrique. S'il persiste quelques secondes (inertie) → défaut mécanique.

### 4.7. Circuits Hydrauliques (Pompes, Ventilateurs)

**Fréquence de passage des aubes (pales) :**

```
F_aubes = n × Fo
```

Où `n` = nombre d'aubes/pales et `Fo` = fréquence de rotation.

**Cavitation :** La cavitation se traduit par une **augmentation générale du bruit de fond** sur le spectre — il n'y a pas de raie caractéristique isolée. C'est un phénomène aléatoire d'implosion de bulles de vapeur qui génère un bruit large bande.

### 4.8. Les Roulements — Analyse Complète

Les roulements constituent l'une des sources de défauts les plus importantes à surveiller en maintenance prédictive. Leur dégradation suit un processus connu et prévisible.

#### 4.8.1. Durée de Vie Théorique des Roulements

**Formule de durée de vie L10 (ISO 281) :**

```
L10 = (C/P)^p     [en 10⁶ tours]
```

Paramètres :
- `L10` = durée de vie en millions de tours (90% des roulements tiennent cette durée)
- `C` = charge nominale dynamique (donnée constructeur, en N ou kN)
- `P` = charge dynamique équivalente appliquée au roulement (en N)
- `p` = exposant de durée de vie :
  - `p = 3` pour les **roulements à billes**
  - `p = 3,33` pour les **roulements à rouleaux**

**Impact des défauts mécaniques sur la durée de vie :** Balourd, désalignement, serrage excessif augmentent considérablement `P`, ce qui réduit `L10` de façon exponentielle. C'est pourquoi la correction de ces défauts est prioritaire.

#### 4.8.2. Processus de Dégradation d'un Roulement

La dégradation d'un roulement suit typiquement ces phases :

```
Phase 1 : MICRO-FISSURE
   └─► Fêlure microscopique sur une piste → impacts haute fréquence
       Détectable par : accélération HF, facteur crête élevé

Phase 2 : CRAQUELURE / ÉCAILLAGE LOCALISÉ
   └─► La fêlure s'agrandit → chocs plus marqués
       Détectable par : BPFO/BPFI/BSF visibles dans le spectre

Phase 3 : ÉCAILLAGE GÉNÉRALISÉ
   └─► Défaut s'étend sur toute la piste → bruit de fond élevé
       Détectable par : augmentation du bruit de fond + harmoniques

Phase 4 : DÉFAILLANCE IMMINENTE
   └─► Billes érode la cage, géométrie roulement compromise
       Détectable par : niveau global en forte augmentation
```

Quand un roulement tourne, les contacts métalliques créent un **bruit de fond aléatoire** qui génère un spectre plat (bruit blanc). L'apparition de raies périodiques au-dessus de ce bruit de fond indique l'apparition d'un défaut.

#### 4.8.3. Géométrie du Roulement et Fréquences Caractéristiques

**Paramètres géométriques :**

```
      ┌─────────────────────────────────┐
      │  D1 = diamètre piste intérieure │
      │  D2 = diamètre piste extérieure │
      │  DR = diamètre primitif          │
      │     = (D1 + D2) / 2             │
      │  DB = diamètre d'une bille       │
      │  n  = nombre de billes          │
      │  β  = angle de contact          │
      │  fr = fréquence de rotation     │
      └─────────────────────────────────┘
```

**Formules des 4 fréquences caractéristiques des roulements :**

```
┌─────────────────────────────────────────────────────────────────────┐
│ BPFO = (n/2) · fr · [1 - (DB/DR) · cos β]                          │
│ Ball Pass Frequency Outer Race — Défaut piste externe               │
│                                                                      │
│ BPFI = (n/2) · fr · [1 + (DB/DR) · cos β]                          │
│ Ball Pass Frequency Inner Race — Défaut piste interne               │
│                                                                      │
│ BSF = fr · (DR/DB) · [1 - (DB/DR)² · cos²β]                        │
│ Ball Spin Frequency — Défaut bille (rotation propre)                 │
│                                                                      │
│ FTF = (1/2) · fr · [1 - (DB/DR) · cos β]                           │
│ Fundamental Train Frequency — Fréquence de rotation de la cage      │
│ ≈ 0,4 × fr (en général)                                             │
└─────────────────────────────────────────────────────────────────────┘
```

**Note :** Si la bague interne est fixe et la bague externe tourne, la FTF devient :
```
FTF = (1/2) · fr · [1 + (DB/DR) · cos β]
```

#### 4.8.4. Modulation des Fréquences de Défauts

**Modulation de BPFI (bague interne) :**
- Le défaut sur la **bague interne tourne** à la vitesse de rotation
- La charge appliquée reste dans la même direction
- → L'amplitude du défaut est **modulée par fr** (plus forte quand le défaut passe dans la zone chargée)
- → Dans le spectre : **bandes latérales** à BPFI ± k×fr

**Modulation de BPFO (bague externe) :**
- Le défaut sur la **bague externe est fixe**
- Le balourd tourne à la vitesse de rotation
- → L'amplitude est également modulée, avec des bandes latérales à BPFO ± k×fr

**Représentation spectrale d'un défaut de roulement (bague) :**

```
Amplitude (g)
    │
    │               ┌─┐  bandes latérales ±fr
    │         ┌─┐   │ │   ┌─┐
    │   ┌─┐   │ │   │ │   │ │   ┌─┐
    └───┼─┼───┼─┼───┼─┼───┼─┼───┼─┼──────► Fréquence (Hz)
        Fo  Fdéfaut  2·Fdéfaut  k·Fdéfaut
```

#### 4.8.5. Influence des Chocs — Peigne de Raies

Les défauts précoces de roulements génèrent des **chocs périodiques**. Un choc périodique à la fréquence de défaut génère dans le spectre un **peigne de raies** aux multiples harmoniques de cette fréquence :

```
Fréquences présentes : Fdéfaut, 2·Fdéfaut, 3·Fdéfaut, ... k·Fdéfaut
```

Ces raies se retrouvent surtout dans la **haute fréquence** (HF, 1–10 kHz). En basse fréquence, elles sont masquées par le balourd et le délignage.

#### 4.8.6. Défaut de Cage (FTF)

**Rupture de cage :**
- Les billes ne sont plus maintenues à distance égale → elles se regroupent
- Excentricité de l'arbre + balourd tournant à la vitesse de la cage
- Signature : **raie unique à FTF ≈ 0,4 × Fo**
- ⚠️ Très difficile à détecter : un roulement avec cage rompue se détériore très rapidement

#### 4.8.7. Défaut de Billes (BSF)

- Plusieurs **groupes de pics** dans le spectre
- Chaque groupe est composé d'un **pic central** (= BSF) entouré de **modulations** (= défaut de cage, FTF)
- La bille en défaut génère des chocs à sa fréquence propre de rotation BSF

#### 4.8.8. Déversement de Bagues

Le déversement d'une bague (inclinaison axiale) génère des signatures complexes qui modifient la charge radiale et axiale. Ce défaut est visible sur plusieurs plages de fréquences simultanément.

#### 4.8.9. Quand Remplacer un Roulement ?

**Critères de décision :**

1. **La courbe de tendance** est l'information la plus importante. Si l'évolution est stable → pas d'action urgente. Si elle monte fortement → planifier le remplacement.

2. **Règles pratiques :**
   - S'il y a peu de différences entre deux mesures successives → pas d'action nécessaire
   - Le remplacement dépend de la criticité de la machine et de sa disponibilité pour maintenance
   - **Ne pas chercher à atteindre la durée de vie maximale** : quand un défaut est clairement détecté, remplacer immédiatement pour éviter toute perte de production

3. **Indicateurs à utiliser :**
   - Pour l'évaluation de la sévérité : niveau de vibration (accélération HF)
   - Pour la tendance : Facteur K (voir section 5)

---

## 5. Les Indicateurs de Surveillance et de Diagnostic

La surveillance et le diagnostic sont deux activités distinctes mais complémentaires :

- **Surveillance** : suivi de l'évolution d'une machine par comparaison des relevés successifs. Peut être confiée à du personnel peu qualifié.
- **Diagnostic** : identification de l'élément défectueux après qu'une anomalie a été détectée en surveillance. Demande de solides connaissances mécaniques et une formation pointue en analyse du signal.

**Le diagnostic n'est réalisé que lorsque la surveillance a permis de détecter une anomalie.**

### 5.1. Les Décibels — Échelle de Référence

Pour exprimer les niveaux vibratoires en décibels par rapport à une référence :

```
A (dB) = 20 · log(A / Ao)
```

Où `Ao` est la valeur de référence (souvent la valeur initiale en état neuf).

**Table de correspondance dB ↔ rapport d'amplitudes :**

| A/Ao | A (dB) | Interprétation |
|------|--------|----------------|
| 0,10 | -20 | Très faible |
| 0,32 | -10 | Faible |
| **1,00** | **0** | **Référence** |
| 1,12 | +1 | Légère augmentation |
| 1,41 | +3 | Augmentation modérée |
| **2,00** | **+6** | **Seuil d'alerte typique** |
| 2,51 | +8 | Alerte confirmée |
| 3,16 | +10 | Surveillance rapprochée |
| **10,00** | **+20** | **Niveau de danger** |

**Interprétation pratique :** Un doublement de l'amplitude correspond à +6 dB. Un niveau de danger est souvent fixé à 20 dB au-dessus de la référence (amplitude ×10).

### 5.2. Indicateurs Basses Fréquences (BF) — 10 à 1000 Hz

#### 5.2.1. Déplacement Crête-à-Crête — Dcc [10-1000 Hz]

```
Dcc [10-1000Hz]  en µm  (micromètres)
```

- Indicateur utilisé par l'**API (American Petroleum Institute)**
- Utilisé dans toute la pétrochimie
- Sensible aux phénomènes **basses fréquences**
- Mesure la déformation physique maximale de la structure

**Formule du niveau acceptable maximal (API) :**

```
Dcc_max = 25,4 × √(12000 / N)    [µm]
```

Avec N = vitesse de rotation en tr/min.

| Vitesse (tr/min) | Dcc_max acceptable (µm) |
|-----------------|------------------------|
| 3000 | 50,8 µm |
| 1500 | 71,8 µm |
| 1000 | 87,9 µm |
| 750  | 101,6 µm |

#### 5.2.2. Vitesse Efficace — Veff [10-1000 Hz]

```
Veff [10-1000Hz]  en mm/s  (millimètres par seconde)
```

- Indicateur des phénomènes **basses fréquences** (les plus énergétiques, donc les plus destructeurs)
- **Référence de la norme ISO 10816** (normes de sévérité vibratoire)
- Sensible au balourd et aux défauts d'alignement

**Norme ISO 10816 — Classes de machines :**

| Classe | Machine | Bon état | Acceptable | Alerte | Danger |
|--------|---------|----------|------------|--------|--------|
| I | Petites machines (<15 kW) | < 0,28 mm/s | 0,28–1,12 | 1,12–2,8 | > 2,8 |
| II | Machines moyennes (15–75 kW) | < 0,45 mm/s | 0,45–1,8 | 1,8–4,5 | > 4,5 |
| III | Grandes machines (>75 kW) | < 0,71 mm/s | 0,71–2,8 | 2,8–7,1 | > 7,1 |
| IV | Grandes machines sur fondations souples | < 1,12 mm/s | 1,12–4,5 | 4,5–11,2 | > 11,2 |

Une **augmentation anormale de Veff** indique typiquement : balourd croissant, désalignement, desserrage.

### 5.3. Indicateurs Hautes Fréquences (HF) — 1 à 10 kHz

#### 5.3.1. Accélération Efficace — Acceff [1000-10 000 Hz]

```
Acceff [1-10 kHz]  en g ou mg
   avec 1g = 9,81 m/s²  et  1 mg = 10⁻³ g
```

- Indicateur des phénomènes **hautes fréquences** : défauts de roulements, dentures d'engrenages
- Une élévation anormale indique généralement une **dégradation avancée des roulements**
- Les raies de défauts de roulements apparaissent surtout en HF (masquées en BF par balourd/délignage)

#### 5.3.2. Facteur de Crête — FC [1-10 kHz]

```
FC = Acc_crête / Acc_eff     [sans unité]
```

- Sensible à la présence de **chocs** dans le signal HF
- **Problème important :** le FC présente des valeurs similaires en début et en fin de vie du roulement !

```
FC
 │
 │    Écaillage généralisé
12├──────────────────────────────────────────
 │   ██████                        ██████
 3├───────────────────────────────────────────
 │         Écaillage localisé
 └──────────────────────────────────────────► Temps
```

Le FC monte lors de l'écaillage localisé (chocs forts et rares), puis redescend lors de l'écaillage généralisé (chocs nombreux mais moins individualisés). Il est donc trompeur pour évaluer la gravité.

#### 5.3.3. Facteur K — K [1-10 kHz]

```
K = Acc_crête × Acc_eff     [en g² ou mg²]
```

- Plus fiable que le Facteur de Crête pour une **analyse ponctuelle**
- La valeur de K est **directement liée à l'état du roulement** (pas d'ambiguïté en fin de vie)

```
K (g²)
 │
 8 ──────────────────────────────── Fin de vie → Rupture
   │                             ▲▲▲▲▲▲
 │                         ▲▲▲▲▲
 │                   ▲▲▲▲▲
 0,8 ── ▲▲▲▲▲▲▲▲▲▲ ──────────────────────────── Bon état
 └──────────────────────────────────────────► Temps
```

| Valeur de K | État du roulement |
|-------------|-------------------|
| < 0,8 g² | Bon état |
| 0,8 – 8 g² | Dégradation en cours |
| > 8 g² | Fin de vie — remplacer |

### 5.4. Exemple d'Utilisation d'un Niveau Global (NG) pour la Surveillance

**Calcul du niveau global :**

```
NG = √(a² + b² + c² + d² + ...)
```

Où a, b, c, d... sont les amplitudes des différentes composantes spectrales.

**Exemple pratique — Effet de masque :**

Pour une machine avec les composantes : balourd (a), délignage (b), roulement (c), etc. :

```
NG = √(a² + b² + c² + ...) = 5,29 mm/s  [exemple]
```

**Problème de l'effet de masque :**

Si le **déséquilibre** augmente de 20% :
```
NG_nouveau = √((1,2a)² + b² + c² + ...) = 6,25 mm/s
Variation du NG = +18%
```

Si le **roulement** atteint 100% de dégradation :
```
NG_nouveau = 5,56 mm/s
Variation du NG = seulement +5%
```

**Conclusion :** Le niveau global peut masquer une dégradation grave d'un roulement si le balourd est important. Pour détecter les défauts de roulements, il faut utiliser des **indicateurs HF ciblés** (Acceff, FC, K) et non le niveau global seul.

### 5.5. Outils de Diagnostic Spectral

#### 5.5.1. Indicateurs Intermédiaires (Bandes de Fréquences)

Pour affiner le diagnostic, on utilise des **indicateurs en bandes de fréquences** centrés sur les fréquences caractéristiques des défauts.

**Exemple :** Valeur de l'amplitude crête dans une bande fine autour de la fréquence de rotation :

- **Bande trop étroite** : risque de ne pas capturer le défaut si la fréquence dérive légèrement (variation de vitesse)
- **Bande trop large** : le bruit de fond et d'autres défauts polluent la mesure
- **Bande optimale** : ± quelques Hz autour de la fréquence caractéristique du défaut ciblé

#### 5.5.2. Choix des Échelles de Fréquence

**Échelle linéaire en fréquence et en amplitude :**
- Seuls les défauts **haute fréquence** sont bien visibles
- Les phénomènes basse et moyenne fréquence (pourtant les plus énergétiques) ne ressortent pas

**Échelle linéaire en amplitude, logarithmique en fréquence :**
- Les phénomènes **basses et moyennes fréquences** sont bien visibles
- La haute fréquence reste discernable

**Échelle logarithmique en amplitude et en fréquence :**
- Les pics de **faibles amplitudes** apparaissent clairement
- Idéale pour détecter les défauts précoces noyés dans le bruit de fond

**Recommandation pratique :**
- Surveillance générale → échelle linéaire en amplitude, log en fréquence
- Détection fine de défauts de roulements → échelle log/log

---

## 6. La Chaîne de Mesure

### 6.1. Composants de la Chaîne de Mesure

La chaîne de mesure vibratoire complète comprend :

```
[Machine] → [Capteur] → [Câblage] → [Conditionneur] → [Analyseur] → [Logiciel]
```

**1. Le capteur (transducteur) :**

| Type | Grandeur mesurée | Plage fréq. | Application |
|------|-----------------|-------------|-------------|
| Accéléromètre piézoélectrique | Accélération | 1 Hz – 20 kHz | Universel, roulements, engrenages |
| Vélocimètre | Vitesse | 10 Hz – 1 kHz | Balourd, désalignement (BF) |
| Capteur de proximité (eddy current) | Déplacement | DC – 2 kHz | Arbres dans paliers lisses |

**L'accéléromètre piézoélectrique** est le capteur le plus utilisé en maintenance prédictive car il couvre une large plage de fréquences.

**2. Fixation du capteur :**

La méthode de fixation impacte directement la fréquence maximale mesurable :

| Méthode | Fréquence max | Usage |
|---------|--------------|-------|
| Vissage fileté (stud) | 25 kHz | Permanent, meilleure qualité |
| Aimant | 7 kHz | Semi-permanent, pratique |
| Cire d'abeille | 10 kHz | Temporaire, bon contact |
| Contact à la main | 1 kHz | Ronde de surveillance rapide |

**3. Positionnement des capteurs :**

- Mesure radiale (horizontal et vertical) sur chaque palier
- Mesure axiale sur chaque palier (détection désalignement angulaire)
- Proximité maximale avec le chemin de force (entre la source de vibration et la fondation)

### 6.2. Paramètres de l'Acquisition

| Paramètre | Définition | Impact |
|-----------|-----------|--------|
| Fréquence max (Fmax) | Borne supérieure du spectre | Détermine les défauts détectables en HF |
| Nombre de lignes | Résolution du spectre (800 lignes standard) | Résolution spectrale = Fmax/800 |
| Fréquence d'échantillonnage | ≥ 2,56 × Fmax (théorème de Shannon) | Évite l'aliasing |
| Fenêtre temporelle | Durée d'acquisition = 800/Fmax | Plus Fmax est bas, plus l'acquisition est longue |

---

## 7. Synthèse pour le Développement d'une Solution de Maintenance Prédictive

### 7.1. Architecture d'une Solution de Maintenance Prédictive

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SOLUTION DE MAINTENANCE PRÉDICTIVE               │
├─────────────┬────────────────┬──────────────────┬──────────────────┤
│  ACQUISITION │  TRAITEMENT    │  DIAGNOSTIC       │  DÉCISION        │
│             │                │                   │                  │
│ Capteurs    │ FFT            │ Détection défauts │ Alertes/Alarmes  │
│ Chaîne de   │ Calcul         │ Identification    │ Planification    │
│ mesure      │ indicateurs    │ Tendances         │ maintenance      │
│ IoT/SCADA   │ Filtrage       │ Comparaison base  │ Prévision durée  │
│             │                │ de données        │ de vie           │
└─────────────┴────────────────┴──────────────────┴──────────────────┘
```

### 7.2. Méthodologie de Mise en Œuvre

**Étape 1 — Inventaire et criticité des machines**
- Identifier toutes les machines tournantes
- Classer par criticité (impact sur la production si panne)
- Prioriser les machines critiques pour la surveillance continue

**Étape 2 — Définition des points de mesure**
- Minimum : 2 directions radiales (H et V) + 1 direction axiale par palier
- Pour chaque point : définir le capteur approprié et sa méthode de fixation
- Documenter les paramètres machine : vitesse, nombre de dents, caractéristiques des roulements

**Étape 3 — Mesures de référence (Baseline)**
- Prendre les mesures initiales sur machine neuve ou après maintenance complète
- Définir les niveaux de référence pour chaque indicateur
- Calculer les seuils d'alerte et de danger (typiquement +6 dB et +20 dB)

**Étape 4 — Surveillance périodique ou continue**
- Surveillance périodique (rounds) : mesures manuelles à intervalles réguliers (hebdomadaires, mensuelles)
- Surveillance continue : capteurs permanents avec système d'acquisition temps réel
- Suivre les tendances temporelles de chaque indicateur

**Étape 5 — Diagnostic lors d'anomalie**
- Identifier le défaut par analyse spectrale
- Comparer aux signatures de référence du catalogue de défauts
- Estimer la sévérité et la durée de vie restante
- Décider du moment d'intervention

### 7.3. Indicateurs à Implémenter dans une Solution Software

**Indicateurs de premier niveau (surveillance) :**

```python
# Indicateurs scalaires à calculer pour chaque mesure
indicateurs = {
    'Veff_BF':    Veff[10-1000Hz],      # Vitesse efficace BF (ISO 10816)
    'Dcc_BF':     Dcc[10-1000Hz],       # Déplacement crête-crête BF (API)
    'Acceff_HF':  Acceff[1-10kHz],      # Accélération efficace HF
    'Facteur_K':  Acc_crete * Acc_eff,  # Facteur K roulements
    'Facteur_FC': Acc_crete / Acc_eff,  # Facteur de crête
    'Niveau_Global': sqrt(sum(x²))      # NG toutes fréquences
}
```

**Indicateurs de deuxième niveau (diagnostic) :**

```
Pour chaque défaut potentiel :
  - Amplitude à Fo (balourd)
  - Amplitude à 2Fo, 3Fo (désalignement)
  - Amplitude aux sous-harmoniques 0.5Fo, 1.5Fo (jeu)
  - Amplitude à BPFO, BPFI, BSF, FTF (roulements)
  - Amplitude à Fe et harmoniques (engrenages)
  - Amplitude à 100 Hz (moteur électrique)
```

### 7.4. Algorithmes de Détection et Diagnostic

**Détection par seuillage :**
```
Si indicateur > seuil_alerte → Générer alerte
Si indicateur > seuil_danger → Générer alarme + arrêt éventuel
```

**Détection par tendance (régression) :**
```
Calculer la pente de croissance de l'indicateur
Si pente > pente_critique → Anticiper le dépassement de seuil
Extrapoler : Temps avant défaillance = (seuil - valeur_actuelle) / pente
```

**Corrélation avec les fréquences de défauts :**
```
Pour chaque machine :
  Calculer BPFO, BPFI, BSF, FTF à partir de la vitesse mesurée
  Extraire l'amplitude du spectre à chaque fréquence ± tolérance
  Comparer aux valeurs de référence
```

### 7.5. Tableau de Correspondance Défaut → Signature → Indicateur

| Défaut | Fréquences caractéristiques | Indicateur primaire | Indicateur secondaire |
|--------|---------------------------|---------------------|-----------------------|
| Balourd | 1×Fo (dominant) | Veff BF | Analyse de phase |
| Désalignement | 1×Fo + harmoniques (2Fo dominant) | Veff BF | Rapport 2Fo/Fo |
| Jeu/desserrage | Fo + sous-harmoniques (0,5Fo, 1,5Fo) | Veff BF | Présence 0,5Fo |
| Courroie | Fc < Fo, harmoniques Fc | Veff BF | Bande Fc |
| Engrenage sain | Fe + harmoniques | Acceff HF | Amplitude Fe |
| Engrenage défectueux | Fe ± k×F1 (modulations) | Acceff HF | Dissymétrie modulations |
| Défaut piste ext. | BPFO ± k×fr | Facteur K, Acceff | Bandes lat. BPFO |
| Défaut piste int. | BPFI ± k×fr | Facteur K, Acceff | Bandes lat. BPFI |
| Défaut bille | BSF, FTF (modulation) | Facteur K | Groupes de pics |
| Défaut cage | FTF ≈ 0,4×Fo | Facteur K | Raie unique FTF |
| Cavitation | Bruit de fond large bande ↑ | Acceff HF | Pas de raie |
| Défaut électrique | 100 Hz (2×50 Hz) | Veff 100 Hz | Disparaît si coupure alim. |

### 7.6. Points Clés pour la Robustesse d'une Solution Prédictive

1. **Mesures reproductibles :** Toujours mesurer aux mêmes points, avec le même capteur, dans les mêmes conditions opératoires (même charge, même vitesse).

2. **Normalisation par la vitesse :** Les fréquences caractéristiques dépendent de la vitesse. En cas de variation de vitesse, normaliser les spectres ou recalculer les fréquences à chaque mesure.

3. **Température :** La température influence la viscosité de la lubrification et les jeux thermiques. Documenter la température lors de chaque mesure.

4. **Historique long terme :** La valeur d'un indicateur isolé est moins informative que son **évolution dans le temps**. Conserver au minimum 12 mois d'historique.

5. **Validation croisée :** Un défaut détecté par plusieurs indicateurs indépendants est plus fiable qu'un signal isolé. Croiser Veff, Acceff et les bandes spectrales.

6. **Connaissance machine :** Les formules de fréquences de roulements nécessitent des données constructeur précises (DB, DR, n, β). Créer et maintenir une base de données machines.

7. **Effet de masque :** Ne jamais se fier uniquement au niveau global. Toujours analyser les indicateurs BF et HF séparément.

---

## Annexe — Formules de Référence Rapide

### Formules Fondamentales

```
f = 1/T = N/60                     [Hz, Hz, tr/min]
ω = 2πf                            [rad/s]

d(t) = D·sin(ω·t)                  [déplacement]
v(t) = D·ω·cos(ω·t)               [vitesse]
a(t) = -D·ω²·sin(ω·t)             [accélération]

rms = √(1/T · ∫₀ᵀ x²(t)dt)
FC  = Crête / RMS
K   = Crête × RMS
NG  = √(a² + b² + c² + ...)
A(dB) = 20·log(A/A₀)
```

### Formules de Défauts

```
Balourd :         F = 1×Fo
Délignage :       F = 1×Fo + harmoniques (2Fo dominant)
Jeu :             F = 0,5×Fo, 1×Fo, 1,5×Fo, 2×Fo...
Engrenage :       Fe = Z × Fo
Courroie :        Fc = vitesse_linéaire / L_courroie
Aubes/Pales :     F = n_aubes × Fo
Élect. asynchrone : F = 2 × f_réseau = 100 Hz

BPFO = (n/2)·fr·[1 - (DB/DR)·cosβ]
BPFI = (n/2)·fr·[1 + (DB/DR)·cosβ]
BSF  = fr·(DR/DB)·[1 - (DB/DR)²·cos²β]
FTF  = (1/2)·fr·[1 - (DB/DR)·cosβ]  ≈ 0,4·fr

L10 = (C/P)^p    [p=3 billes, p=3,33 rouleaux]
Dcc_max = 25,4·√(12000/N)  [µm, API]
Résolution spectrale = Fmax / 800
```

### Seuils de Référence Typiques

```
Facteur K :   Bon état < 0,8 g²  |  Fin de vie > 8 g²
FC :          Alerte ≈ 3          |  Danger ≈ 12
Décibels :    Alerte = +6 dB (×2) |  Danger = +20 dB (×10)
FTF :         ≈ 0,4 × Fo
```

---

*Document compilé à partir du cours BTS Maintenance Industrielle — Analyse Vibratoire (76 diapositives). Contenu exhaustif pour opérateurs et ingénieurs en maintenance prédictive.*


# Guide Complet de l'Analyse Vibratoire des Machines Tournantes

## Document de Référence pour Opérateurs et Ingénieurs en Analyse Vibratoire et Maintenance

---

# Introduction à l'Analyse Vibratoire

## 1.1 Objectifs et Principes Fondamentaux

L'analyse vibratoire constitue une discipline essentielle dans le domaine de la maintenance industrielle moderne. Elle permet de surveiller l'état de santé des machines tournantes en détectant et en identifiant les défauts avant qu'ils ne provoquent des pannes coûteuses. Ce guide exhaustif a été conçu pour fournir aux opérateurs et aux ingénieurs une compréhension approfondie des principes, des techniques et des methodologies employées dans ce domaine critique.

La philosophie sous-jacente de l'analyse vibratoire repose sur un principe fondamental : les vibrations d'une machine tournante constituent une image fidèle des efforts internes qui s'exercent au sein de celle-ci. Ces efforts, résultant du fonctionnement normal ou de conditions anormales, génèrent des mouvements vibratoires qui se propagent à travers la structure mécanique. En analysant ces vibrations, il devient possible de déterminer l'origine des problèmes, d'évaluer leur sévérité et de planifier les interventions de maintenance de manière proactive.

La quantification et la qualification des vibrations représentent des moyens privilégiés pour la maintenance conditionnelle, permettant aux équipes de maintenance de passer d'une approche réactive, où les interventions sont effectuées uniquement en cas de panne, à une approche proactive basée sur l'état réel de la machine. Cette transition génère des bénéfices significatifs en termes de réduction des coûts de maintenance, d'augmentation de la disponibilité des équipements et d'amélioration de la sécurité des installations.

## 1.2 Perception Subjective des Phénomènes Vibratoires

À proximité d'une machine en fonctionnement, il est possible d'entendre le bruit généré par l'équipement et de sentir les vibrations transmises à travers la structure. Ces deux indicateurs perceptibles peuvent fournir des indications précieuses sur un changement de comportement de la machine. Un opérateur expérimenté peut souvent détecter une anomalie simplement en observant les variations du niveau sonore ou en touchant certaines parties de la machine. Cependant, cette perception subjective présente des limitations importantes : elle ne permet pas de quantifier précisément les problèmes ni d'identifier avec certitude l'origine des anomalies détectées.

Le bruit rayonné dans l'air par une machine résulte de l'action conjuguée de plusieurs sources vibratoires. Selon la norme NFE 90-001, une vibration est définie comme une variation avec le temps d'une grandeur caractéristique du mouvement ou de la position d'un système mécanique, lorsque cette grandeur alterne entre des valeurs supérieures et inférieures à une valeur moyenne ou de référence. Les phénomènes vibratoires peuvent être périodiques ou apériodiques, plus ou moins complexes selon leur origine.

La perception de l'énergie vibratoire varie significativement selon l'emplacement où l'observateur place sa main sur la machine. Si la main est positionnée sur le palier, sur la carcasse, sur le châssis ou sur le sol, les sensations perçues seront différentes. Cette variabilité s'explique par le fait que les chemins de propagation des vibrations diffèrent selon les points de mesure considérés. Un point situé à proximité immédiate de la source d'excitation vibratoire enregistrera des niveaux différents d'un point éloigné de cette même source, même si l'excitation interne demeure identique.

## 1.3 Relation entre Excitation et Structure

Pour une excitation donnée, telle qu'un balourd mécanique par exemple, la réponse vibratoire varie significativement selon le lieu où la mesure est prélevée. Cette relation fondamentale s'exprime par l'équation : Vibration = Excitation × Structure. Cette relation met en évidence le fait que les mesures vibratoires doivent toujours être effectuées aux mêmes endroits pour pouvoir être comparées utilement. Les variations observées entre différents points de mesure reflètent non seulement les différences dans les sources d'excitation, mais également les caractéristiques dynamiques de la structure entre ces points et la source.

Les niveaux vibratoires constituent d'excellents indicateurs pour connaître le comportement d'une machine. Ils permettent de suivre l'évolution de l'état de santé de l'équipement dans le temps et de détecter l'apparition de nouveaux défauts. Cette approche systématique de surveillance permet d'établir des historiques de mesures qui serviront de base pour l'identification des tendances dégradantes et la prédiction des défaillances potentielles.

---

# Chapitre 2 : Notions Fondamentales de l'Analyse Vibratoire

## 2.1 Origine des Vibrations dans les Machines Tournantes

Toute machine en fonctionnement constitue le siège de forces internes variables dans le temps, de natures différentes. Ces forces peuvent être classées en quatre catégories principales selon leurs caractéristiques temporelles. Les forces impulsionnelles, généralement désignées sous le terme de chocs, correspondent à des sollicitations brèves et intenses. Les forces transitoires, liées aux variations de charge, présentent des évolutions temporelles plus progressives. Les forces périodiques, dont le balourd constitue l'exemple le plus caractéristique, se répètent de manière régulière à des intervalles fixes. Les forces aléatoires, telles que celles générées par les frottements, ne présentent pas de caractère prévisible.

Ces différentes forces sont transmises par les composantes de la machine et induisent des déformations de la surface de la structure, qui se manifestent sous forme de vibrations. Le principe fondamental de l'analyse vibratoire des machines tournantes peut être schématisé de la manière suivante : la machine génère des efforts internes qui agissent sur la structure, laquelle réagit en produisant des effets visibles sous forme de bruits et de vibrations. En mesurant ces effets, il devient possible de remonter aux efforts internes et donc de caractériser le comportement de la machine.

Parmi les principales sources d'excitation vibratoire, on retrouve le balourd mécanique, les défauts de lignage, les problèmes de roulements, les engrangements défectueux et les défauts magnétiques. Chaque type de défaut produit une signature vibratoire caractéristique qui permet de l'identifier lors de l'analyse des mesures.

## 2.2 Caractérisation des Signaux Vibratoires

### 2.2.1 La Vibration Sinusoïdale

L'expression la plus simple d'un mouvement vibratoire est celle du mouvement purement sinusoïdal, comme celui généré par un balourd simple. Le signal vibratoire sinusoïdal s'exprime par la fonction mathématique :

**X(t) = A × sin(ω × t + φ)**

où A représente l'amplitude du signal, ω la pulsation en radians par seconde, t le temps et φ la phase à l'origine. La pulsation ω est reliée à la fréquence F par la relation ω = 2πF.

### 2.2.2 Les Différentes Représentations de l'Amplitude

L'amplitude d'un signal vibratoire peut être représentée de trois manières différentes, chacune présentant un intérêt spécifique selon le contexte de l'analyse. L'amplitude crête, notée A₀ₚ, représente la valeur maximale atteinte par le signal par rapport à sa valeur moyenne. L'amplitude crête-à-crête, notée Apₚ, correspond à la différence entre les valeurs maximale et minimale du signal. L'amplitude efficace, notée Arms ou Aeff, représente la racine carrée de la moyenne des carrés des valeurs instantanées du signal.

Pour un signal parfaitement sinusoïdal, ces trois représentations sont liées par des relations mathématiques simples. L'amplitude crête-à-crête vaut deux fois l'amplitude crête : Apₚ = 2 × A₀ₚ. L'amplitude crête est égale à la racine carrée de deux multipliée par l'amplitude efficace : A₀ₚ = √2 × Arms. L'amplitude efficace représente la valeur la plus couramment utilisée en analyse vibratoire car elle est directement reliée à l'énergie du signal.

L'amplitude du signal vibratoire renseigne sur l'importance du défaut surveillé. Une augmentation de l'amplitude peut indiquer une dégradation progressive de l'état de la machine, tandis qu'une amplitude stable suggère un fonctionnement normal.

### 2.2.3 La Fréquence et la Période

La fréquence F d'un phénomène vibratoire correspond au nombre de répétitions, ou périodes, de ce phénomène par seconde. L'unité de mesure de la fréquence est le Hertz (Hz), défini comme 1 Hz = 1 cycle par seconde. La fréquence permet d'identifier l'origine du défaut détecté, chaque type de défaut produisant des vibrations à des fréquences caractéristiques.

La période T d'un phénomène vibratoire représente l'intervalle de temps séparant deux passages successifs à une même position et dans le même sens. La période s'exprime en secondes et est reliée à la fréquence par la relation T = 1/F. Dans le cas des machines tournantes, la période correspond souvent à la durée d'un tour d'arbre, ce qui permet de relier directement les mesures vibratoires à la cinématique de la machine.

À titre d'exemple, pour un moteur tournant à 1500 tours par minute, la fréquence de rotation est égale à 1500/60 = 25 Hz. Cette fréquence fondamentale constitue souvent la base de l'analyse vibratoire des machines tournantes.

## 2.3 Les Grandeurs de Mesure

### 2.3.1 Introduction aux Trois Grandeurs

Comme tout mouvement, une vibration peut être étudiée selon trois grandeurs physiques distinctes : le déplacement, la vitesse et l'accélération. Ces trois grandeurs sont liées entre elles par des relations mathématiques dérivées du calcul différentiel et intégral. Dans le cas de signaux purement sinusoïdaux, ces relations sont particulièrement simples et permettent des conversions aisées entre les différentes grandeurs.

Le choix de la grandeur de mesure joue un rôle crucial dans la qualité du diagnostic. Chaque grandeur présente des caractéristiques spécifiques qui la rendent plus ou moins adaptée à certains types d'analyses. Une compréhension approfondie de ces caractéristiques permet d'optimiser les protocoles de mesure et d'améliorer la pertinence des conclusions tirées des analyses.

### 2.3.2 Le Déplacement

Le déplacement quantifie l'amplitude maximale du signal vibratoire en termes de distance parcourue par le point vibrant. Historiquement, le déplacement fut la première grandeur utilisée en analyse vibratoire car les moyens de mesure disponibles à l'époque ne permettaient que ce type de mesurage. Un signal vibratoire sinusoïdal généré par un balourd simple s'exprime par la relation :

**d(t) = D × sin(2πFt + φ)**

L'unité utilisée pour la mesure des déplacements est le micron (μm), ce qui reflète les amplitudes généralement très faibles rencontrées dans les applications vibratoires industrielles.

### 2.3.3 La Vitesse

La vitesse d'un mobile correspond à la variation de sa position par unité de temps. Mathématiquement, la vitesse s'exprime comme la dérivée du déplacement par rapport au temps. Pour un signal sinusoïdal, la relation devient :

**v(t) = V × sin(2πFt + φ)**

L'unité couramment utilisée pour la vitesse vibratoire est le millimètre par seconde (mm/s). La vitesse présente l'avantage de fournir une indication plus représentative de la fatigue subie par les structures mécaniques, les contraintes dynamiques étant généralement proportionnelles à la vitesse.

### 2.3.4 L'Accélération

L'accélération d'un mobile correspond à la variation de sa vitesse par unité de temps. Elle s'exprime comme la dérivée de la vitesse par rapport au temps, soit la dérivée seconde du déplacement :

**a(t) = A × sin(2πFt + φ)**

L'unité utilisée pour l'accélération est le g, correspondant à l'accélération de la pesanteur (1g = 9,80665 m/s²). L'accélération présente l'avantage d'être directement proportionnelle aux forces dynamiques appliquées à la structure, conformément au principe fondamental de la dynamique (F = ma).

### 2.3.5 Relations Mathématiques entre les Grandeurs

Dans le cas d'une vibration purement sinusoïdale, les valeurs mesurées en déplacement, vitesse et accélération sont liées par des fonctions simples faisant intervenir la fréquence. Les relations fondamentales sont :

**V = A / (2πF)** en unités SI
**D = V / (2πF)** avec D en μm, V en mm/s et F en Hz
**V = 1561 × A / F** avec A en g

L'accélération, représentative des forces dynamiques, ne dépend pas de la fréquence et constitue le paramètre privilégié en analyse vibratoire sur un large domaine de fréquences allant de 0 à 20000 Hz.

### 2.3.6 Influence du Choix de la Grandeur

Le choix de la grandeur de mesure influence significativement les résultats de l'analyse. Le déplacement est inversement proportionnel au carré de la fréquence : plus la fréquence augmente, plus le déplacement diminue. Son utilisation est donc réservée aux très basses fréquences (F ≤ 100 Hz). La vitesse est inversement proportionnelle à la fréquence : plus la fréquence augmente, plus la vitesse diminue. Son utilisation est adaptée aux basses fréquences (F ≤ 1000 Hz). L'accélération, ne dépendant pas de la fréquence, permet d'analyser l'ensemble du spectre vibratoire et constitue donc le paramètre privilégié pour les analyses complètes.

---

# Chapitre 3 : La Transformation Temps-Fréquence

## 3.1 Les Vibrations Complexes

Les signaux vibratoires réels sont rarement parfaitement sinusoïdaux. Ils se composent généralement d'un mélange de signaux périodiques et non périodiques, désignés sous le terme de bruit de fond. Toutes les composantes sont sommées dans le signal résultant, créant un signal temporel complexe dont l'analyse directe peut s'avérer difficile. La décomposition de ce signal complexe en ses différentes composantes sinusoïdales permet une analyse beaucoup plus pertinente et exploitable.

La représentation temporelle du signal vibratoire montre l'évolution de l'amplitude en fonction du temps. Cette représentation permet de visualiser les événements ponctuels, les chocs et les variations transitoires. Cependant, elle ne permet pas directement d'identifier les différentes fréquences présentes dans le signal.

## 3.2 La Transformée de Fourier

La transformée de Fourier constitue l'outil mathématique fondamental de l'analyse vibratoire. Elle permet de décomposer un signal vibratoire périodique complexe en ses différentes composantes sinusoïdales, chacune étant caractérisée par son amplitude Ai et sa fréquence Fi. Cette transformation réalise une transposition du signal de l'espace temporel vers l'espace fréquentiel.

La représentation du signal ainsi obtenue dans l'espace des fréquences est appelée spectre en fréquences. Ce spectre constitue l'outil principal de l'analyse vibratoire car il permet d'identifier clairement les différentes composantes fréquentielles du signal et leurs amplitudes respectives.

La transformée de Fourier est implémentée dans les analyseurs de spectres modernes sous une forme algorithmique optimisée appelée FFT (Fast Fourier Transform). Cette implémentation permet un traitement rapide des signaux et une visualisation en temps réel des spectres.

## 3.3 Cas Particuliers de Signaux

### 3.3.1 Signal Sinusoïdal Pur

Un signal sinusoïdal pur ne contient qu'une seule fréquence. Dans l'espace temporel, il se présente sous forme d'une courbe parfaitement régulière. Dans l'espace fréquentiel, il se traduit par une unique raie à la fréquence du signal, dont la hauteur est proportionnelle à l'amplitude de ce signal. Cette correspondance simple permet une identification immédiate du contenu fréquentiel du signal.

### 3.3.2 Signal Multi-Sinusoïdal

Un signal composé de plusieurs composantes sinusoïdales présente un spectre contenant autant de raies qu'il y a de composantes. Chaque raie correspond à une fréquence et son amplitude reflète l'importance de la composante correspondante. Le spectre final contient l'ensemble des fréquences sinusoïdales constituant le signal vibratoire d'origine.

### 3.3.3 Signaux Réels

Les signaux réels rencontrés en pratique présentent généralement des spectres plus complexes, combinant des raies discrètes correspondant aux composantes périodiques et un bruit de fond continu représentant les composantes aléatoires. L'interprétation de ces spectres nécessite une expertise permettant d'identifier les signatures caractéristiques des différents défauts.

---

# Chapitre 4 : Origine des Vibrations - Les Défauts Mécaniques

## 4.1 Le Balourd Mécanique

### 4.1.1 Définitions et Types de Balourd

Le balourd mécanique constitue l'une des sources de vibrations les plus fréquentes dans les machines tournantes. Ce phénomène est lié à une répartition non homogène de la masse autour de l'axe de rotation : l'axe d'inertie de l'arbre n'est pas confondu avec l'axe de rotation. Cette configuration génère une force centrifuge qui augmente avec la vitesse de rotation et provoque des vibrations harmoniques.

Trois types de balourd peuvent être identifiés selon la nature du déséquilibre. Le balourd statique survient lorsque l'axe d'inertie de l'arbre est parallèle à l'axe de rotation. Cette situation produit une vibration radiale à la fréquence de rotation. Le balourd de couple se produit lorsque l'axe d'inertie n'est plus colinéaire à l'axe de rotation, les deux axes formant un angle. Cette configuration génère des efforts supplémentaires sur les paliers. Le balourd dynamique représente la combinaison des deux premiers types et correspond au cas le plus fréquemment rencontré en pratique.

### 4.1.2 Signature Vibratoire du Balourd

Le balourd se manifeste par une énergie vibratoire localisée à la fréquence de rotation F₀ et aux fréquences de ses harmoniques (2F₀, 3F₀...). Il existe toujours un balourd résiduel sur une machine tournante, même après équilibrage soigné. L'évolution du balourd se manifeste par une augmentation progressive des raies à F₀ et de ses harmoniques. Cette évolution permet de suivre l'aggravation du déséquilibre dans le temps et de planifier les interventions de maintenance.

L'analyse des amplitudes des différentes harmoniques peut fournir des informations complémentaires sur la nature du balourd. Un balourd statique génère principalement la composante à F₀, tandis qu'un balourd de couple produit également des composantes à 2F₀ et au-delà.

## 4.2 Le Défaut de Lignage

### 4.2.1 Nature du Défaut

Le défaut de lignage, également appelé défignage, résulte de la non-coïncidence des axes de rotation de deux machines accouplées. Ce défaut crée des contraintes internes au niveau des arbres et des paliers des machines accouplées. La contrainte exercée au niveau du palier génère une non-linéarité de raideur de ce dernier. Le déplacement occasionné par la force excitatrice s'en trouve écrêté, entraînant l'apparition de composantes harmoniques de la fréquence de rotation.

### 4.2.2 Types de Défauts de Lignage

Selon les positions géométriques des deux axes, on distingue trois types de défignage. Le défignage parallèle correspond à un défaut de concentricité des deux arbres. Le défignage angulaire se traduit par un défaut de parallélisme des deux arbres. Le défignage angulaire et parallèle combine les deux précédents défauts.

### 4.2.3 Signature Vibratoire du Défaut de Lignage

Le défignage se manifeste par une énergie vibratoire localisée aux fréquences 2F₀, 3F₀ ou 4F₀ dans toutes les directions de mesurage. Cette signature caractéristique permet de distinguer le défignage du balourd, qui génère principalement une vibration à F₀. L'évolution du défaut de lignage entraîne une augmentation progressive des raies caractéristiques.

## 4.3 Les Chocs Périodiques

### 4.3.1 Origine des Chocs

Les chocs périodiques peuvent être internes ou externes à la machine. Les origines externes incluent les défauts de fixation de la machine ou les vibrations transmises par d'autres machines voisines (alternatives, presses...). Les origines internes comprennent la dégradation de roulements, la dégradation d'engrangements et les jeux excessifs dans les mécanismes.

### 4.3.2 Signature Vibratoire

La manifestation spectrale d'un phénomène de chocs périodiques se traduit par un peigne de raies. Cette signature caractéristique correspond à une succession de composantes fréquentielles régulièrement espacées, évoquant l'image d'un peigne. L'espacement entre les raies correspond généralement à la fréquence de rotation de l'élément incriminé.

## 4.4 Les Phénomènes Magnétiques

### 4.4.1 Principe de Fonctionnement du Moteur Asynchrone

Les moteurs asynchrones constituent des sources de vibrations spécifiques liées aux phénomènes magnétiques. Le fonctionnement de ces moteurs repose sur l'interaction entre un champ magnétique tournant créé par les enroulements statoriques et les courants induits dans le rotor en court-circuit. Ces courants interagissent avec le champ tournant pour créer des forces électromagnétiques provoquant la rotation du rotor.

### 4.4.2 Paramètres Cinématiques

Les paramètres fondamentaux du moteur asynchrone incluent : la fréquence d'alimentation FA, la fréquence du champ tournant FS, la fréquence de rotation du rotor FR, le nombre de paires de pôles p, le glissement g et la fréquence de glissement Fg.

La relation entre ces paramètres s'exprime par les formules suivantes :

- Fréquence du champ tournant : FS = FA / p
- Glissement : g = (FS - FR) / FS
- Fréquence de glissement : Fg = FS - FR

### 4.4.3 Défauts Magnétiques

Les défauts magnétiques dans les moteurs asynchrones peuvent être classés en deux catégories principales : les défauts stationnaires liés au stator et les défauts tournants liés au rotor.

**Défauts stationnaires (stator) :**

- Dus à une variation de courant : déséquilibre de phases, spires en court-circuit, défaut d'isolement
- Dus à une variation d'entrefer : déformation du stator, jeu de paliers excessif

La typologie spectrale des défauts stationnaires se traduit par une raie à 2FA (100 Hz pour une alimentation à 50 Hz).

**Défauts tournants (rotor) :**

- Dus à une variation de courant : barres rotoriques fissurées ou cassées, liaison barre/anneau résistive, tôles rotor en court-circuit, anneau de court-circuit cassé ou fissuré
- Dus à une variation d'entrefer : ovalisation ou cintrage du rotor

La typologie des défauts tournants se traduit par une modulation d'amplitude ou de fréquence de FR par 2×g×FA.

---

# Chapitre 5 : Les Engrenages

## 5.1 Généralités et Types d'Engrenages

Les engrenages permettent la transmission d'un couple avec ou sans réduction de vitesse entre arbres parallèles ou concourants. Le rapport des vitesses des deux arbres est lié au nombre de dents de chacun des pignons en contact selon la relation : N₁×F₁ = N₂×F₂.

Trois classes principales d'engrenages existent. Les engrenages parallèles présentent des axes de rotation parallèles et constituent l'application la plus répandue. Les engrenages concourants, tels que les engrenages coniques, ont des axes qui se croisent. Les engrenages gauches, comme les engrenages à vis sans fin, combinent des axes perpendiculaires non concourants.

Les différents types de dentures influencent également le comportement vibratoire. Les dentures droites présentent des caractéristiques simples mais génèrent des sollicitations pulsées. Les dentures hélicoïdales permettent une meilleure continuité de l'entraînement d'une dent à la suivante, mais génèrent une composante axiale sur les arbres. Les dentures à chevrons permettent l'élimination de la poussée axiale mais sont plus exigeantes en termes de montage.

## 5.2 La Fréquence d'Engrènement

La fréquence d'engrènement FE correspond au rythme d'engagement des dents et s'exprime par : FE = N₁×F₁ = N₂×F₂. L'amplitude vibratoire de la raie d'engrènement FE est très dépendante de la charge de la machine puisque l'engrènement assure la transmission du couple.

En l'absence de défaut, le spectre vibratoire présente la fréquence d'engrènement FE et ses harmoniques (2×FE, 3×FE...).

## 5.3 Défauts d'Engrenages

### 5.3.1 Usure Généralisée de la Denture

L'usure générale de la denture se traduit par un matage du profil des dents. On obtient un choc périodique mou à la fréquence d'engrènement, qui génère un peigne de raies d'amplitudes décroissantes. Cette signature permet de détecter l'usure progressive des engrenages.

### 5.3.2 Jeu de Denture Insuffisant

Si le jeu de fond de denture est insuffisant, il se produit un effort à l'engagement et au dégagement des dents. La raie à 2×FE augmente et devient parfois prépondérante. Cette modification spectrale constitue un indicateur précoce du problème.

### 5.3.3 Jeu de Denture Excessif

Un jeu de fond de denture trop important génère un choc périodique dur à la fréquence d'engrènement, lors du rattrapage du jeu. Le spectre présente un peigne de raies d'amplitudes proches, caractéristique de ce défaut.

### 5.3.4 Dent Détériorée

Le passage d'une dent détériorée provoque un choc dur à chaque tour. Le spectre résultant est un peigne de raies harmoniques de la fréquence de rotation du pignon incriminé. Si les deux pignons présentent des dents détériorées, le spectre combine les peignes de raies des deux fréquences de rotation plus un peigne de raies à la fréquence de coïncidence FC = FE / NC, où NC représente le PPCM des nombres de dents.

### 5.3.5 Arbre Support Pignon Cintré

Un arbre support de pignon cintré (faux rond) module la pression au niveau de la denture à la fréquence de rotation de l'arbre. Le spectre correspondant présente des bandes latérales autour de FE, espacées de la fréquence de rotation F₁.

### 5.3.6 Combinaison de Défauts

L'addition de différents défauts est fréquente dans la pratique et conduit à des spectres combinant les typologies des défauts élémentaires correspondants. L'interprétation de ces spectres complexes nécessite une expertise approfondie.

---

# Chapitre 6 : Les Transmissions par Courroie

## 6.1 Courroies Trapézoïdales

### 6.1.1 Fréquence de Passage

La fréquence de passage Fp des courroies trapézoïdales peut être calculée par la formule simplifiée : Fp = (π×D₁/L) × F₁ = (π×D₂/L) × F₂, où D₁ et D₂ représentent les diamètres des poulies, L la longueur de la courroie et F₁, F₂ les fréquences de rotation des arbres.

### 6.1.2 Points de Surveillance

Le glissement mécanique de la courroie sur la poulie est de l'ordre de 2% à 5%. Un glissement plus important peut provoquer une usure prématurée. Un excentrement de poulie peut induire un phénomène vibratoire à la fréquence de rotation. La tension de la courroie est perceptible sur les niveaux de bruits des paliers équipés de roulements, et la quantification du bruit de roulement aide à régler la tension de courroie. La principale cause d'usure de courroie est le défignage entre deux poulies.

## 6.2 Courroies Crantées

Pour les courroies crantées, la fréquence de passage Fp est donnée par : Fp = FE / N = (N₁×F₁) / N = (N₂×F₂) / N, où N₁ et N₂ représentent les nombres de dents des poulies et N le nombre de dents de la courroie. Les problèmes de courroies (déformation, point dur, crevasse) génèrent des vibrations à cette fréquence de passage.

---

# Chapitre 7 : Les Roulements

## 7.1 Généralités et Constitution

Les roulements réalisent le positionnement de l'arbre dans les paliers en assurant la transmission des efforts vers la structure. Ils constituent des composants critiques dont la défaillance peut entraîner des avaries majeures sur les machines.

### 7.1.1 Paramètres Géométriques

La définition des fréquences cinématiques des roulements nécessite la connaissance des paramètres géométriques suivants :

- d : diamètre des éléments roulants (billes ou rouleaux)
- Z : nombre d'éléments roulants
- De : diamètre du chemin de roulement de la bague externe
- Di : diamètre du chemin de roulement de la bague interne
- Dm : diamètre primitif du roulement, défini par : Dm = (De + Di) / 2
- α : angle de contact (pour les roulements à contact oblique)
- F₀ : fréquence de rotation de l'arbre (bague externe supposée fixe)

## 7.2 Fréquences Cinématiques des Roulements

Les formules de calcul des fréquences caractéristiques des roulements sont les suivantes :

**Fréquence de rotation de la cage :**
FC = 0,5 × (1 - (d/Dm) × cosα) × F₀

**Fréquence de rotation des éléments roulants :**
FB = 0,5 × (Dm/d) × (1 - (d²/Dm²) × cos²α) × F₀

**Fréquence de défaut bague externe :**
FBE = 0,5 × Z × (1 - (d/Dm) × cosα) × F₀

**Fréquence de défaut bague interne :**
FBI = 0,5 × Z × (1 + (d/Dm) × cosα) × F₀

**Remarque importante :** Quel que soit le roulement, la relation suivante est toujours vérifiée : FBE + FBI = Z × F₀

## 7.3 Dégradation des Roulements

### 7.3.1 Causes de Dégradation

Les causes de dégradation des roulements sont nombreuses et variées. On peut citer l'usure normale liée au fonctionnement, les charges excessives ou mal réparties, les défauts de graissage, les défauts de montage, et les agents extérieurs (contamination, température excessive...).

### 7.3.2 Types de Dégradation

La dégradation d'un roulement se traduit généralement par un écaillage des surfaces en contact (bagues et éléments roulants) qui s'étend et évolue dans le temps. La dégradation peut être localisée ou généralisée.

**Dégradation localisée :** Un défaut localisé sur un élément se manifeste par un choc dur à la fréquence de contact de la détérioration. Les défauts sur bague externe génèrent des chocs à FBE, les défauts sur bague interne génèrent des chocs à FBI (souvent modulée par la fréquence de rotation), et les défauts sur élément roulant génèrent des chocs à 2×FB.

**Dégradation généralisée :** L'écaillage augmente lorsque la dégradation évolue pour gagner l'ensemble des éléments en contact. Cette évolution anarchique entraîne l'apparition de nombreux chocs durs qui excitent les fréquences de résonance du roulement. Le spectre associé présente un dôme dont l'aire (représentative de l'énergie) augmente avec la dégradation.

## 7.4 Le Facteur de Défaut Roulement

### 7.4.1 Principe du FDR

Le Facteur de Défaut Roulement (FDR) est un traitement spécifique du signal temporel particulièrement adapté à la surveillance des roulements. Il combine deux indicateurs : le Facteur de Crête (Fc = Ac/Arms) et la Valeur efficace (Arms).

La formule de calcul est : FDR = a × Fc + b × Arms

Ce paramètre présente plusieurs avantages : c'est un facteur absolu, indépendant des unités de mesure ; il permet une détection précoce des défauts ; il est peu sensible aux conditions de fonctionnement ; sa valeur croît progressivement au cours des trois phases de la dégradation ; il est simple à utiliser et adapté au diagnostic automatique.

### 7.4.2 Niveaux de Recommandation

Pour les machines de 600 à 6000 RPM, les niveaux d'alerte recommandés sont : Alerte à FDR = 6, Danger à FDR = 9. Ces niveaux peuvent être optimisés avec l'expérience. Pour les machines en dehors de cette plage de vitesse, le FDR peut également être utilisé, mais les seuils dépendent de la configuration spécifique de la machine.

### 7.4.3 Différenciation Usure et Défaut de Graissage

L'augmentation du niveau du Facteur de Défaut peut être liée soit à une usure du roulement, soit à un défaut de graissage. En l'absence d'historique d'évolution, on procède à un test de graissage. Si le FDR chute de manière importante et instantanée après le graissage, et reste stable à cette nouvelle valeur dans les heures suivantes, il s'agit probablement d'un problème de graissage. Dans le cas contraire, il s'agit vraisemblablement d'une usure du roulement.

---

# Chapitre 8 : Phénomènes Particuliers aux Turbomachines

## 8.1 Généralités sur les Turbomachines

Une turbomachine est un équipement dont le rôle est d'assurer un échange d'énergie mécanique entre un débit permanent de fluide et un rotor tournant autour de son axe. On distingue deux catégories principales : les turbomachines génératrices ou de compression (pompes, ventilateurs, soufflantes, compresseurs) et les turbomachines réceptrices ou de détente (turbines).

## 8.2 Phénomènes Cinématiques : Le Passage d'Aubes

Les phénomènes de passage d'aubes surviennent lorsque la roue mobile de la turbomachine passe devant les aubes fixes du diffuseur. Si F₀ est la fréquence de rotation de la roue, N₁ le nombre d'aubes de la roue et N₂ le nombre d'ailettes fixes du diffuseur, les fréquences suivantes peuvent apparaître : N₁×F₀, N₂×F₀ et leurs harmoniques, ainsi que N₁×N₂×F₀. Le suivi de toutes ces fréquences présente peu d'intérêt pour la maintenance mais permet d'interpréter correctement le spectre vibratoire.

## 8.3 Phénomènes Non Cinématiques

### 8.3.1 Les Turbulences

Les turbulences d'écoulement des fluides produisent des variations de vitesse locales du fluide transporté. Lorsque la vitesse d'un liquide augmente, sa pression diminue. Les variations de vitesse d'écoulement créent des variations de pression aléatoires qui excitent les structures et les tuyauteries. Il en résulte une image vibratoire dont l'aspect est un bruit large bande, analogue à celui produit par la dégradation d'un roulement.

### 8.3.2 La Cavitation

La cavitation est provoquée par la vaporisation partielle du liquide véhiculé à l'intérieur de la pompe. Cette vaporisation intervient lorsque la pression statique supportée par le fluide devient inférieure à sa tension de vapeur. Lors de la vaporisation, des bulles de gaz se forment au sein du liquide et sont transportées avec lui. Sous l'action du gradient de pression, elles implosent dès que la pression locale redevient supérieure à la tension de vapeur. Les ondes de choc produites occasionnent des arrachements de matière, principalement au niveau des aubes de la roue.

La cavitation produit un bruit caractéristique de « cailloux roulés » ou de grenaillage. Elle provoque une excitation vibratoire des modes de résonance de la pompe et des tuyauteries proches. L'image vibratoire est large bande, analogue à celle résultant du phénomène de turbulences. La bande d'énergie à surveiller peut être déterminée par comparaison des spectres avec et sans cavitation, le phénomène étant facile à reproduire en réduisant la pression à l'aspiration.

---

# Chapitre 9 : La Mesure des Vibrations

## 9.1 Localisation des Points de Mesure

Les vibrations d'une machine tournante sont l'image des forces internes à celle-ci. Ces forces, représentatives du comportement mécanique de la machine, se transmettent du rotor à la structure au travers des paliers. Les vibrations seront donc mesurées au niveau des paliers, points nodaux où transitent les efforts.

La numérotation des paliers suit généralement une convention logique : les paliers de la machine entraînante sont numérotés en premier, suivis de ceux de la machine entraînée.

## 9.2 Types de Capteurs

### 9.2.1 Mesures de Vibrations Absolues

Les accéléromètres permettent la mesure des vibrations absolues. Ils sont utilisés pour l'instrumentation des paliers à roulement. Ces capteurs mesurent l'accélération vibratoire et la convertissent en signal électrique proportionnel.

### 9.2.2 Mesures de Déplacement Relatives

Les sondes de déplacement permettent la mesure des déplacements relatifs de l'arbre dans le palier. Elles sont utilisées pour l'instrumentation des paliers fluides (paliers lisses). Ces capteurs mesurent le mouvement de l'arbre par rapport à un point fixe du carter.

## 9.3 L'Accéléromètre

### 9.3.1 Constitution

Un accéléromètre piézoélectrique est composé d'un élément piézoélectrique comprimé par une masse mobile sollicitée par les vibrations. L'élément piézoélectrique délivre une charge électrique, convertie en tension, proportionnelle aux contraintes qu'il subit et donc à l'accélération locale au point de mesure.

### 9.3.2 Principe de Fonctionnement

Le fonctionnement repose sur les relations suivantes : ΔU = f(ΔF) et ΔF = M × Δγ, où ΔU représente la variation de tension de sortie, ΔF la variation de force exercée sur l'élément piezo, M la masse mobile et Δγ l'accélération. Par constitution, l'accéléromètre mesure une accélération selon un axe défini, généralement perpendiculaire à la surface de fixation.

### 9.3.3 Bande Passante

La bande passante correspond au domaine de fréquences pour lequel la sensibilité du capteur demeure pratiquement constante. Elle est souvent définie à 10% ou à 3 dB. Le mode de fixation de l'accéléromètre sur la structure a une influence considérable sur la réponse du capteur : plus la fixation est rigide, plus la réponse s'élargit vers les hautes fréquences.

## 9.4 Direction des Points de Mesure

Les capteurs mesurent les vibrations selon une direction, généralement confondue avec leur axe de symétrie. On distingue différentes directions de mesure pour un même point de mesure physique : radiale horizontale, radiale verticale, radiale oblique et axiale.

Il serait souhaitable de réaliser les mesures de vibrations selon les trois directions possibles. Pour des raisons de temps et de coûts, on se limite généralement à une seule direction de mesure par palier. La direction radiale oblique constitue le plus souvent un bon compromis, permettant de capturer l'essentiel de l'énergie vibratoire dans un plan radial.

---

# Chapitre 10 : Les Systèmes de Surveillance

## 10.1 Types de Surveillance

On distingue fondamentalement deux types de surveillance. La surveillance on-line utilise des capteurs installés à demeure sur les machines, connectés en permanence à un système de surveillance. La surveillance off-line consiste à réaliser des mesures à intervalles réguliers à l'aide d'un collecteur de données portable.

Le choix entre ces deux types dépend de plusieurs critères : la criticité de la machine dans le processus de production, la maintenabilité de la machine, les conséquences d'une panne en termes de sécurité, et la stratégie de l'entreprise en matière de maintenance.

## 10.2 La Fonction Sécurité

La fonction sécurité a pour objectif de stopper la machine lorsque celle-ci présente des conditions de fonctionnement mettant en cause son intégrité ou la sécurité des biens et des personnes. Elle induit une surveillance continue de la machine, généralement de type temps réel. Une usure ou des conditions de fonctionnement anormales provoquent une élévation des niveaux vibratoires qui sont comparés à des seuils pré-établis. La machine est arrêtée automatiquement par le système lorsque le seuil correspondant est atteint. La plupart des machines à paliers lisses sont équipées à l'origine d'une fonction sécurité.

## 10.3 La Fonction Maintenance

La fonction maintenance a pour objectifs de prévoir les arrêts et les opérations de maintenance, et de déterminer l'origine des défauts afin de pouvoir les corriger ou prévenir leur apparition. Elle repose sur la collecte régulière de mesures permettant de construire des historiques et d'identifier les tendances dégradantes. Les mesures périodiques doivent être réalisées en fonction de l'usure attendue de la machine.

## 10.4 Niveaux d'Analyse

### 10.4.1 Niveau 1 : Maintenance de Niveau Tendance

Ce niveau d'analyse utilise les analyses de niveaux globaux et l'étude des tendances. Les outils nécessaires sont un collecteur de niveaux globaux et le logiciel DIVASCOPE. Les compétences requises se situent au niveau opérateur ou technicien.

### 10.4.2 Niveau 2 : Maintenance de Niveau Diagnostic

Ce niveau permet le diagnostic de défauts cinématiques courants : balourd, défignage, engrènement, bruit de roulement... Les outils sont un collecteur de données ou analyseur MOVIPACK et les logiciels DIVADIAG ou SURVAODIAG. Les compétences requises se situent au niveau technicien ou ingénieur.

### 10.4.3 Niveau 3 : Maintenance de Niveau Expertise

Ce niveau utilise des analyses vibratoires avancées avec des outils et des compétences complémentaires pour traiter les défauts cinématiques complexes. Les outils comprennent un collecteur MOVIPACK en mode analyseur ou un analyseur multi-voies, et le logiciel VibGraph Expert. Les compétences requises se situent au niveau technicien ou ingénieur spécialisé.

## 10.5 Périodicité des Mesures

La périodicité des mesures doit être définie en fonction de plusieurs paramètres : les types de défaillances de la machine, la criticité de la machine au sein du processus, et les budgets disponibles en maintenance. Une analyse de criticité permet de hiérarchiser les machines et d'allouer les ressources de surveillance de manière optimale.

---

# Chapitre 11 : Les Paramètres de Surveillance

## 11.1 Définition des Paramètres

Les paramètres de surveillance sont définis au niveau de la base de données. Ils fixent les caractéristiques du signal à mesurer (capteur, grandeur mesurée, type de détection), le format de l'acquisition (temporel, spectre, ordre, enveloppe), les caractéristiques de l'acquisition (fréquence, taille du bloc, fenêtrage), et la nature des informations extraites des acquisitions (amplitudes maxi, moyenne ou RMS, énergie, amplitude à une fréquence donnée, traitements spécifiques comme le Facteur défaut ou le Kurtosis).

## 11.2 Type de Capteur

Le type de capteur utilisé dépend du type de paliers de la machine. Les accéléromètres sont utilisés pour les paliers à roulement, tandis que les sondes de déplacement sont utilisées pour les paliers lisses.

## 11.3 Grandeur Mesurée

Selon le type de capteur utilisé, le signal utile peut être exprimé en accélération (g), en vitesse (mm/s) ou en déplacement (μm). Le choix de l'unité n'est pas indifférent car les mesures en accélération sont à privilégier, les mesures en vitesse et en déplacement atténuant les phénomènes de fréquences élevées.

### Filtres par Grandeur

- Niveau global Accélération : bande passante [2-20000] Hz
- Niveau global Vitesse : bande passante [10-1000] Hz (normalisé)
- Niveau global Déplacement : bande passante [3-300] Hz

## 11.4 Type de Détection

Le type de détection doit être clairement identifié. Les options disponibles sont : l'amplitude crête A₀ₚ, l'amplitude crête-à-crête Apₚ, la valeur moyenne Amoy, et la valeur efficace Arms ou Aeff.

En pratique, on utilise généralement la valeur efficace Arms pour les mesures issues d'accéléromètres (en accélération, vitesse ou déplacement), et l'amplitude crête-à-crête Apₚ pour les mesures issues de sondes de déplacement (en déplacement).

## 11.5 Format de l'Acquisition

Les mesures vibratoires sont stockées sous forme de fichiers numériques horodatés, associés à un point de mesure. Les signaux peuvent être sous forme temporelle (représentation amplitude en fonction du temps) ou spectrale (représentation amplitude en fonction de la fréquence).

## 11.6 Le Niveau Global

Le niveau global constitue le premier indicateur de sévérité vibratoire car il quantifie l'énergie vibratoire globale du signal. Il peut être calculé à partir du signal temporel et le résultat est une valeur numérique unique.

### Détection RMS

La détection RMS (Root Mean Square) consiste à calculer la valeur efficace à partir du signal temporel sur une durée T. Elle s'exprime par la formule :

**Arms = √(1/T₀ × ∫₀ᵀ a²(t) dt)**

où T est la constante de temps, supérieure à la période maximale des principales composantes du signal a(t).

### Application au Suivi

Les niveaux globaux sont des indicateurs simples pour le suivi des machines : traitement du signal simple et peu coûteux, résultat numérique unique facile à exploiter. Cependant, ils ne permettent pas le diagnostic précis de l'origine des défauts ou des évolutions constatées. Ils permettent néanmoins d'orienter le diagnostic vers les points de mesure ou les machines suspectes.

## 11.7 Choix des Paramètres de Surveillance

Une analyse cinématique de la machine permet de définir les paramètres utiles à la surveillance. Elle repose sur la connaissance des éléments suivants : éléments constitutifs de la machine (éléments mécaniques, chaînes cinématiques, dimensions), paramètres de fonctionnement (vitesse, puissance, charge), et manifestations des phénomènes attendus (fréquences caractéristiques, typologies spectrales).

---

# Chapitre 12 : Interprétation des Mesures

## 12.1 Processus d'Interprétation

Les paramètres étant définis, la surveillance consiste à collecter périodiquement les mesures permettant l'extraction des paramètres, comparer les valeurs à des seuils pré-définis, suivre l'évolution dans le temps des valeurs atteintes pour chacun d'eux (historiques d'évolution), interpréter les évolutions et dépassements de seuils (élaboration du diagnostic), et analyser les spectres et signaux temporels acquis pour affiner ou confirmer le diagnostic.

## 12.2 Analyse des Tendances

L'analyse dans le temps des courbes d'évolution des paramètres de surveillance fournit des indications précieuses pour le diagnostic. L'identification de la machine critique parmi un parc peut être effectuée en classant les équipements selon l'évolution de leurs paramètres vibratoires.

## 12.3 Comparaison aux Seuils

Les seuils pré-définis sont généralement au nombre de deux :

**Seuil Alarme :** Indique qu'un changement significatif est intervenu. La machine peut généralement continuer de fonctionner durant la phase d'analyse du problème.

**Seuil Danger (ou Déclenchement) :** Niveau au-delà duquel la poursuite du fonctionnement de la machine peut provoquer une avarie. Une intervention pour réduire les vibrations ou arrêter la machine est requise.

## 12.4 Détermination des Seuils

Les seuils peuvent provenir de normes (ISO, API), de préconisations constructeur, ou d'un état de référence. Dans ce dernier cas, les valeurs des seuils sont extrapolées des valeurs des paramètres prélevées à un moment où l'état de l'installation était jugé satisfaisant. La méthode d'extrapolation dépend du type de machine et fait largement appel à l'expérience de l'utilisateur.

---

# Chapitre 13 : Les Normes ISO

## 13.1 Normes ISO 10816

La norme ISO 10816 concerne les vibrations mécaniques et l'évaluation des vibrations des machines par mesurages sur les parties non tournantes. Elle comprend plusieurs parties :

- ISO 10816-1 : Directives générales
- ISO 10816-2 : Turbo-alternateurs excédant 50 MW
- ISO 10816-3 : Machines industrielles de puissance nominale supérieure à 15 kW et de vitesse nominale entre 120 et 15000 tr/min mesurées in situ
- ISO 10816-4 : Ensemble des turbines à gaz hors aéronautique
- ISO 10816-5 : Groupes générateurs de puissance et installations de pompage hydraulique
- ISO 10816-6 : Machines alternatives excédant 100 kW

### Évolution de la Norme ISO 10816

La norme internationale ISO 10816 (1995) remplace la norme ISO 2372 (1974). Les principales évolutions portent sur l'évaluation de la sévérité vibratoire selon deux critères : les niveaux vibratoires absolus et l'évolution des niveaux vibratoires dans le temps. La norme s'ouvre également à l'utilisation de paramètres de mesure autres (accélération ou déplacement en bande large, paramètres en bande fine).

Ces évolutions permettent une meilleure adéquation de la norme aux machines à vitesse lente (≤ 600 tr/min) ou rapide (≥ 12000 tr/min), la prise en compte de l'évolution des moyens de mesure, et la reconnaissance des spécificités des différentes catégories de machines.

### Principes de Surveillance

L'évaluation des vibrations selon ISO 10816 repose sur la mesure de vitesse vibratoire large bande, la comparaison à des valeurs limites établies pour différentes classes de machines, et la comparaison de l'évolution des amplitudes vibratoires à des valeurs limites.

### Définition des Zones

La norme définit quatre zones de sévérité :

- **Zone A :** Niveaux vibratoires pour machines neuves
- **Zone B :** Niveaux vibratoires acceptables pour un service de longue durée sans restrictions de durée
- **Zone C :** Niveaux vibratoires non acceptables pour un service de longue durée en continu. La machine peut continuer à fonctionner pendant une durée limitée.
- **Zone D :** Niveaux vibratoires suffisants pour endommager la machine. La machine doit être arrêtée.

### Détermination des Seuils

La norme fournit des lignes directrices pour le positionnement des seuils :

**Seuil Alarme :** À 25% de la limite supérieure de la zone B au-dessus du niveau de référence (niveau atteint par la machine en bon état). En l'absence de niveaux de référence, entre 1 et 1,25 fois la limite supérieure de la zone B.

**Seuil Danger :** Valeur non liée au niveau de référence : entre 1 et 1,25 fois la limite supérieure de la zone C.

## 13.2 Normes ISO 7919

La norme ISO 7919 concerne les mesurages sur arbres tournants et critères d'évaluation. Elle comprend :

- ISO 7919-1 : Directives générales
- ISO 7919-2 : Turbo-alternateurs installés sur fondation radier
- ISO 7919-3 : Machines industrielles couplées
- ISO 7919-4 : Turbines à gaz
- ISO 7919-5 : Machines équipant les centrales électriques et les stations de pompage

## 13.3 Autres Normes Pertinentes

- **ISO 2954 :** Spécifications des appareils de mesurage de l'intensité vibratoire pour machines tournantes ou alternatives
- **ISO 8579-2 :** Code de réception des engrenages - Détermination des vibrations mécaniques d'une transmission par engrenages au cours des essais de réception
- **ISO 14694 :** Ventilateurs industriels - Spécifications pour la qualité de l'équilibrage et les niveaux de vibrations

---

# Chapitre 14 : Mise en Place d'un Programme de Maintenance Conditionnelle

## 14.1 Étapes Principales

Les étapes principales de la mise en place du suivi vibratoire sont :

1. **Identification du parc machines concerné :** Déterminer quelles machines doivent être surveillées
2. **Mise en place d'un système de surveillance adapté :** Organiser le personnel, les matériels, les logiciels et l'organisation
3. **Initialisation sur site de la surveillance :** Démarrer le système de surveillance
4. **Optimisation et extension du suivi :** Améliorer progressivement le programme

## 14.2 Étape 1 : Détermination du Parc Machines

La décision de mettre en place une maintenance conditionnelle sur une machine repose sur plusieurs questions. Un arrêt a-t-il un impact sur la sécurité ou la production ? Son coût est-il acceptable ? La technique de surveillance est-elle applicable ? Le coût de la surveillance est-il adapté ?

Si la réponse à ces questions est positive, la maintenance conditionnelle est appropriée. Dans le cas contraire, on aura recours à la maintenance corrective ou systématique.

## 14.3 Étape 2 : Mise en Place du Système

Les paramètres suivants doivent être pris en compte dans la définition du système de surveillance :

- Fonctions assignées au système : Maintenance et/ou sécurité
- Niveau d'analyse requis
- Type de surveillance : Continue ou périodique

En fonction de ces éléments, les choix en matériels, logiciels et formation pourront être réalisés de manière cohérente.

## 14.4 Étape 3 : Initialisation du Suivi

Cette étape consiste à mettre en œuvre la surveillance sur un nombre restreint de machines représentatives du parc. Elle repose sur les phases suivantes :

**Analyse cinématique des machines :** Déterminer le nombre et l'emplacement des points de mesures, pré-identifier les paramètres cinématiques, déterminer les mesures à réaliser.

**Programmation des machines et des paramètres associés dans la base de données :** Créer les machines et les voies de mesure, définir les paramètres d'acquisition (périodicité, type de mesures, gammes d'analyse...), définir les paramètres vibratoires.

**Réalisation des signatures vibratoires initiales :** Établir les mesures de référence pour chaque machine surveillée.

**Détermination des seuils des paramètres vibratoires :** Définir les niveaux d'alerte et de danger pour chaque paramètre.

## 14.5 Étape 4 : Optimisation et Extension

Cette étape consiste à affiner les paramètres de surveillance et les valeurs de seuils pour les machines définies dans l'initialisation. Lorsque les paramètres définis et les seuils associés sont considérés comme pertinents, vérifiés par les premières campagnes de mesure, la base de données peut être étendue aux autres machines du parc par duplication des machines définies. Seuls quelques paramètres ou valeurs seront ajustés pour prendre en compte les conditions de fonctionnement ou caractéristiques particulières.

---

# Chapitre 15 : Développement d'une Solution de Maintenance Prédictive

## 15.1 Principes de la Maintenance Prédictive

La maintenance prédictive repose sur l'exploitation des données de surveillance pour prédire l'évolution de l'état des équipements et planifier les interventions au moment optimal. Elle combine l'analyse vibratoire avec d'autres techniques de surveillance et des algorithmes de modélisation pour estimer la durée de vie résiduelle des composants.

## 15.2 Éléments Clés pour une Solution de Maintenance Prédictive

### 15.2.1 Infrastructure de Collecte de Données

Une solution de maintenance prédictive efficace nécessite une infrastructure robuste de collecte de données. Cette infrastructure comprend des capteurs appropriés (accéléromètres, sondes de déplacement), des systèmes d'acquisition temps réel ou périodique, et une connectivité permettant le transfert des données vers une plateforme centralisée.

### 15.2.2 Base de Données Historiques

La constitution d'une base de données historiques complète constitue le fondement de la maintenance prédictive. Cette base doit contenir les mesures vibratoires dans le temps, les informations sur les interventions de maintenance effectuées, les conditions de fonctionnement des équipements, et les données environnementales pertinentes.

### 15.2.3 Algorithmes de Détection et de Diagnostic

Les algorithmes de détection permettent d'identifier l'apparition de nouveaux défauts ou l'aggravation de défauts existants. Les algorithmes de diagnostic permettent de déterminer la nature et la gravité des défauts détectés. Ces algorithmes peuvent être basés sur des règles, sur des modèles statistiques, ou sur des techniques d'intelligence artificielle.

### 15.2.4 Modèles de Prédiction

Les modèles de prédiction exploitent les données historiques pour estimer l'évolution future de l'état des équipements. Ils permettent de déterminer le moment optimal pour planifier les interventions de maintenance, avant l'occurrence d'une défaillance.

### 15.2.5 Interface Utilisateur

L'interface utilisateur doit permettre la visualisation des données et des indicateurs clés, l'accès aux alertes et aux diagnostics, et la génération de rapports pour le management.

## 15.3 Indicateurs pour la Maintenance Prédictive

### 15.3.1 Indicateurs de Niveau

Les indicateurs de niveau global permettent une première évaluation de l'état de l'équipement. Une augmentation progressive du niveau global peut indiquer une dégradation générale, nécessitant une investigation plus approfondie.

### 15.3.2 Indicateurs Spectraux

Les indicateurs spectraux permettent de suivre l'évolution des composantes fréquentielles caractéristiques. Le suivi des amplitudes aux fréquences de défaut permet de détecter l'apparition et l'évolution de défauts spécifiques.

### 15.3.3 Indicateurs de Résonance

Les indicateurs de résonance permettent de détecter l'excitation des fréquences naturelles de la structure, souvent associée à des défauts sévères ou à des conditions de fonctionnement critiques.

## 15.4 Seuils et Alertes

La gestion des seuils constitue un élément critique de la maintenance prédictive. Les seuils peuvent être fixes ou adaptatifs. Les seuils fixes sont définis une fois et restent constants. Les seuils adaptatifs s'ajustent automatiquement en fonction de l'évolution de l'équipement ou des conditions de fonctionnement.

La gestion des alertes permet de prioriser les interventions en fonction de la criticité des équipements et de la gravité des anomalies détectées.

---

# Chapitre 16 : Synthèse des Connaissances et Recommandations

## 16.1 Points Essentiels à Retenir

L'analyse vibratoire constitue un outil puissant pour la maintenance des machines tournantes. Elle permet de détecter précocement les défauts, d'identifier leur nature et leur gravité, et de planifier les interventions de manière optimale.

La compréhension des principes fondamentaux de la vibration (amplitude, fréquence, déplacement, vitesse, accélération) est essentielle pour interpréter correctement les mesures et poser des diagnostics fiables.

Chaque type de défaut produit une signature vibratoire caractéristique. La reconnaissance de ces signatures permet d'identifier rapidement les problèmes et de concentrer les efforts de maintenance sur les équipements qui en ont réellement besoin.

La mise en place d'un programme de maintenance conditionnelle basé sur l'analyse vibratoire nécessite une approche méthodique, passant par l'identification des machines critiques, la définition des paramètres de surveillance, l'établissement des seuils d'alerte et la formation du personnel.

## 16.2 Recommandations pour les Opérateurs

Les opérateurs doivent systématiquement effectuer les mesures aux mêmes endroits et dans les mêmes conditions pour garantir la comparabilité des résultats. Ils doivent prêter attention à l'évolution des niveaux globaux dans le temps, qui peut révéler une dégradation progressive. L'analyse des spectres doit être systématique lors de l'apparition d'alertes ou de tendances suspectes. La documentation des observations et des interventions constitue un historique précieux pour les analyses futures.

## 16.3 Recommandations pour les Ingénieurs

Les ingénieurs doivent s'assurer de la cohérence entre les paramètres de surveillance définis et la cinématique réelle des machines surveillées. Ils doivent revoir périodiquement les seuils d'alerte en fonction de l'expérience acquise et des résultats obtenus. La formation continue du personnel et l'actualisation des compétences constituent des éléments essentiels de la maîtrise du domaine.

---

# Annexe : Formules de Référence

## Formules de Conversion des Grandeurs

**Relations fondamentales (pour un signal sinusoïdal) :**

- V = A / (2πF)
- D = V / (2πF)
- D = 248199 × A / F² (avec D en μm, A en g, F en Hz)

## Formules des Roulements

**Paramètres géométriques :**

- Dm = (De + Di) / 2

**Fréquences caractéristiques :**

- FC = 0,5 × (1 - (d/Dm) × cosα) × F₀
- FBI = 0,5 × Z × (1 + (d/Dm) × cosα) × F₀
- FBE = 0,5 × Z × (1 - (d/Dm) × cosα) × F₀

**Propriété : FBE + FBI = Z × F₀**

## Facteur de Défaut Roulement

- FC = Ac / Arms (Facteur de Crête)
- FDR = a × FC + b × Arms
- Seuils recommandés (600-6000 RPM) : Alerte = 6, Danger = 9

## Engrenages

- FE = N₁ × F₁ = N₂ × F₂
- FC = FE / NC (fréquence de coïncidence, NC = PPCM(N₁, N₂))

---

**Document compilé à partir de la formation "Analyse vibratoire des machines tournantes" - 01dB**

**Auteur :** MiniMax Agent
**Date de compilation :** Mai 2026

# Analyse Vibratoire et Maintenance Prédictive — Guide Exhaustif

> **Document de référence complet** rassemblant l'ensemble des connaissances en analyse vibratoire et maintenance prédictive, extrait des supports de formation et exercices pratiques. Destiné aux opérateurs, techniciens et ingénieurs en analyse vibratoire et maintenance.

---

## Table des Matières

1. [Introduction à la Maintenance](#partie-i---introduction-à-la-maintenance)
2. [Classement VIS des Machines](#partie-ii---classement-vis-des-machines)
3. [Notion d'Indicateur](#partie-iii---notion-dindicateur)
4. [Avantages et Inconvénients de la MPC](#partie-iv---avantages-et-inconvénients-de-la-mpc)
5. [Les Vibrations — Notions Fondamentales](#partie-v---les-vibrations)
6. [Rappels Mathématiques](#partie-vi---rappels-mathématiques)
7. [Déséquilibre — Défaut de Balourd](#partie-vii---déséquilibre-défaut-de-balourd)
8. [Défaut d'Alignement](#partie-viii---défaut-dalignement)
9. [Défaut de Desserrage et de Jeu](#partie-ix---défaut-de-desserrage-et-de-jeu)
10. [Défauts de Transmission par Courroies](#partie-x---défauts-de-transmission-par-courroies)
11. [Défauts de Denture d'Engrenages](#partie-xi---défauts-de-denture-dengrenages)
12. [Défauts Électriques](#partie-xii---défauts-électriques)
13. [Circuits Hydrauliques / Ventilateurs](#partie-xiii---circuits-hydrauliques--ventilateurs)
14. [Défauts Spécifiques aux Roulements](#partie-xiv---défauts-spécifiques-aux-roulements)
15. [Les Indicateurs de Surveillance](#partie-xv---les-indicateurs)
16. [Outils de Diagnostic](#partie-xvi---outils-de-diagnostic)
17. [Indicateurs Intermédiaires](#partie-xvii---indicateur-intermédiaire)
18. [Tableau de Reconnaissance des Avaries](#annexe-a---tableau-de-reconnaissance-des-avaries)
19. [Exercices Pratiques](#annexe-b---exercices-pratiques)
20. [Norme ISO 10816](#annexe-c---norme-iso-10816)
21. [Développement d'une Solution MPC](#annexe-d---développement-dune-solution-de-maintenance-prédictive)

---

# PARTIE I — INTRODUCTION À LA MAINTENANCE

## I.1 Les Différentes Formes de Maintenance

La maintenance d'un équipement industriel peut se classer en plusieurs catégories :

| Type de Maintenance | Description |
|---------------------|-------------|
| **Maintenance Corrective** | Intervention après panne |
| **Maintenance Préventive Systématique** | Intervention planifiée selon un calendrier fixe |
| **Maintenance Préventive Conditionnelle (MPC)** | Intervention conditionnée par l'état réel de la machine |

### La Maintenance Préventive Conditionnelle (MPC)

> **Définition** : La MPC est une Maintenance qui se fait avant la panne (Préventive) et qui est conditionnée (Conditionnelle) par l'état de la machine.

### Objectifs de la MPC

La MPC a pour but de :

- **Surveiller** le fonctionnement de la machine et **prévoir** quand elle va défaillir
- **Anticiper** la maintenance et réduire les coûts d'arrêt
- **Réparer** les machines seulement lorsqu'elles le nécessitent
- **Optimiser** les révisions sur les seules défaillances

### Comparaison avec les Autres Types de Maintenance

**Par rapport à la maintenance corrective :**
- La MPC permet d'éviter les pannes donc les arrêts machines
- Elle évite les coûts d'indisponibilité, qui peuvent représenter les **2/3 des coûts de production**

**Par rapport à la maintenance préventive systématique :**
- La MPC permet d'éviter des interventions coûteuses pas toujours nécessaires
- Exemple : vidange d'un grand volume d'huile sans qu'elle ne soit dégradée
- La maintenance préventive systématique ne garantit pas de ne pas avoir une panne

> **Principe fondamental** : En MPC, le défaut est détecté **AVANT** d'engendrer un arrêt de la machine. Le principe est de surveiller la machine régulièrement et de noter son évolution.

> **Indispensable pour les machines VITALES.**

---

# PARTIE II — CLASSEMENT « VIS » DES MACHINES

Afin de ne pas surveiller inutilement des machines qui n'ont pas une importance capitale, les industriels établissent souvent le classement suivant :

## II.1 Machines Vitales (V)

- Machines **non doublées** dont la panne entraîne l'arrêt de la production
- Les frais et les délais de remise en état sont importants
- Les pertes de production sont **inacceptables**

## II.2 Machines Importantes (I)

- Machines doublées ou non dont la panne entraîne une **baisse sensible** de la production
- Les frais et délais de remise en état sont importants
- Les pertes de production aussi sont significatives

## II.3 Machines Secondaires (S)

- Machines doublées ou dont une panne ne remet pas en cause les capacités de production

## II.4 Détermination des Outils de Surveillance

En fonction de ce classement, d'un **indice de vétusté**, d'un **indice de complexité** des machines, on détermine :
- Les outils de surveillance à employer
- Leur paramétrage
- La fréquence des campagnes de relevés

---

# PARTIE III — NOTION D'INDICATEUR

Afin de détecter un défaut de la machine, il convient de définir un ou plusieurs **indicateurs d'états** de la machine qui pourront être suivis dans le temps.

## III.1 Seuils de Surveillance

L'indicateur d'état évolue dans le temps. On définit alors au moins **2 seuils** :

### Seuil d'Alarme
- Nous prévient que l'état de la machine se dégrade
- Il va falloir prévoir une intervention de maintenance
- On a le temps de programmer l'arrêt de la machine afin de pénaliser le moins possible la production

### Seuil de Danger
- Nous prévient de l'imminence d'une panne
- Il nous faut intervenir **rapidement**

### Seuils Intermédiaires
- On peut également définir des seuils intermédiaires afin d'être plus précis dans notre analyse

---

# PARTIE IV — AVANTAGES ET INCONVÉNIENTS DE LA MPC

## IV.1 Avantages de la MPC

Le principal avantage de la MPC est qu'elle permet d'éviter les arrêts machines dus aux pannes. Pour minimiser encore ces arrêts machines, il faut utiliser des techniques permettant de mesurer l'état de la machine **sans l'arrêter**.

### Les 3 Principales Techniques de MPC

#### 1. Thermographie Infrarouge
- Permet de mesurer la température de composants **sans contact**
- Tout défaut se traduisant souvent par une élévation de la température
- On peut ainsi en mesurer les conséquences

#### 2. Analyse des Huiles
- Permet à la fois de surveiller l'huile d'une machine afin de ne la changer que lorsqu'elle est dégradée (surveillance de lubrifiant)
- À l'instar d'une analyse de sang pour un être humain, permet de mesurer l'état de santé de la machine

#### 3. Analyse Vibratoire
- Principalement utilisée pour la surveillance des **machines tournantes**
- Toute machine tournante vibre
- Ces vibrations sont les conséquences de défauts de la machine
- Plus la machine vibre et plus les défauts sont importants

## IV.2 Inconvénients de la MPC

Le principal inconvénient de la MPC réside dans la mise en place de ces techniques. Elles sont lourdes à mettre en œuvre sur plusieurs points :

### 1) Coûts d'Achat — Systèmes Souvent Onéreux

| Équipement | Coût Approximatif |
|------------|-------------------|
| Caméra infrarouge (base) | 7 000 € |
| Caméra infrarouge (analyse poussée) | 60 000 € |
| Spectromètre huile (multi-éléments) | Plusieurs dizaines de K€ |
| Collecteur niveau global | À partir de 1 500 € |
| Collecteur vibration + logiciel d'analyse | Plus de 30 000 € |

### 2) Formation du Personnel
- Selon le matériel acheté et le niveau d'exigence désiré, ces techniques exigent un haut niveau de formation
- Il faut libérer du temps de formation et trouver du personnel compétent
- Capable de s'adapter aux évolutions rapides de ces techniques

### 3) Mise en Place — Définition des Seuils
- La difficulté principale est la définition des seuils d'alarme et de danger
- Ces seuils nécessitent un temps de mise en place pendant lequel la MPC n'est pas forcément rentable
- Ce délai peut aller de **1 à 3 ans**

> **Risques liés aux seuils :**
> - Si on **surestime** les seuils → on risque la panne bien avant de l'atteindre
> - Si on **sous-estime** les seuils → on risque de détecter de fausses alarmes, c'est-à-dire d'atteindre les niveaux d'alarme bien avant la panne
> - Cela aura pour conséquence de déclencher des actions de MPC non justifiées

> Le choix de la mise en place de la MPC dans une entreprise doit se faire en pesant les contraintes et les avantages.

---

# PARTIE V — LES VIBRATIONS

## V.1 Notions de Vibrations

La vibration fait partie de la vie de tous les jours. Elle peut être :

- **Utile** : rasoir électrique, haut-parleur, …
- **Agréable** : balançoire, instrument de musique, …
- **Désagréable** : marteau-piqueur, mal de mer, …
- **Fatigante ou nuisible** pour l'homme, les machines, les bâtiments : transports, tremblement de terre, …

> **Définition** : Une vibration est un **mouvement autour d'une position d'équilibre**.

## V.2 Origine des Vibrations sur les Machines Tournantes

L'analyse vibratoire est utilisée en MPC pour la surveillance des machines tournantes. Les machines tournantes sont des systèmes dans lesquels peut se distinguer :
- Un **rotor**
- Une **structure**
- Des **liaisons**

Le rotor tourne autour d'une ligne de rotation par l'intermédiaire de liaisons ayant pour support la structure de la machine. La rotation du rotor engendre des forces qui dépendent de l'état des machines. Ces efforts vont se répercuter sur tous les éléments de la machine.

Des vibrations vont être créées si ces efforts rencontrent une **mobilité** (un jeu ou un élément peu rigide).

> **TOUTE MACHINE TOURNANTE VIBRE.**

Les machines réelles ne sont jamais parfaites :
- Défauts de fabrication
- Jeux de fonctionnement
- Paramètres de fonctionnement (température, vitesses de rotation, …)

La vibration dépend des conditions de fonctionnement. Le **signal vibratoire** contient des informations sur :
- Les efforts engendrés par le fonctionnement de la machine
- L'état mécanique des structures

Il permet par conséquent d'avoir une image des contraintes internes et de diagnostiquer un certain nombre de défauts de fonctionnement.

Mais en raison même de la richesse des renseignements qu'il peut apporter, il n'est en général pas directement utilisable. Il contient trop d'informations qu'il faut traiter et trier.

Le matériel de mesure enregistre le signal vibratoire. En fonction des besoins de l'analyse, on définit ensuite des **indicateurs calculés** à partir de ce signal. L'évolution de ces indicateurs renseigne sur l'usure de la machine.

> **En conclusion**, les vibrations et les bruits sont des **indicateurs objectifs** de l'état de santé des matériels comportant au moins une pièce en mouvement.

> Ces indicateurs sont en étroite corrélation avec les balourds, les désalignements, les défauts d'engrainement, les usures, les déformations, etc.

### Bénéfices du Suivi Vibratoire

Ainsi, le suivi vibratoire apporte la connaissance de l'état réel de la machine. À tout moment, il permet de suivre son évolution donc de programmer l'arrêt du système en tenant compte :
- De la **production**
- De la **disponibilité de l'équipe d'intervention**
- De l'**approvisionnement des pièces de rechange**

En outre, ce suivi permet :
- De **supprimer** les arrêts pour inspections et visites
- De **détecter précocement** les risques de défaillance
- De **mieux planifier** les interventions
- De **réduire** la durée et l'importance des interventions donc l'indisponibilité de l'outil de production
- Donc par conséquent de **réduire les coûts directs et indirects de maintenance**

## V.3 Matériel de Mesure

La première méthode de mesure des vibrations est l'homme. Cette méthode a ses limites dues à la précision de mesure de nos sens. C'est pourquoi on préfère utiliser un **capteur**.

Le but de ce capteur est de transformer la vibration en un signal exploitable que l'on va pouvoir traiter.

### Les 3 Grandeurs Mesurées

Les 3 grandeurs que l'on est amené à mesurer en technique vibratoire sont :
1. Le **déplacement**
2. La **vitesse**
3. L'**accélération**

En analyse vibratoire des machines tournantes, on utilise principalement des **accéléromètres** que l'on dispose au niveau des paliers.

### Positionnement des Capteurs

Les capteurs correctement positionnés sont :
- Les capteurs en position **« radial »** (perpendiculaire à l'axe de rotation)
- Les capteurs en position **« axial »** (parallèle à l'axe de rotation)

> **Règles de positionnement :**
> - Positionner au plus près des **paliers** sur des **structures rigides**
> - La solution donnant le résultat le plus fidèle à la réalité est la **fixation par goujon**
> - C'est la solution de montage la plus rigide donc provoquant le moins de pertes du signal de départ

### Types de Surveillance

Les signaux sortant des capteurs doivent être enregistrés et traités par un **collecteur et un analyseur de vibrations**. On distingue alors 2 types de surveillance :

| Type | Description |
|------|-------------|
| **Surveillance On Line** | La machine est surveillée en permanence par un moniteur de vibrations |
| **Surveillance Off Line** | Les mesures sont effectuées lors de rondes à intervalles réguliers. On utilise un collecteur de données. Les collecteurs modernes permettent également d'analyser les mesures. |

On peut également analyser les mesures sur des ordinateurs équipés de logiciels spécifiques en y transférant les mesures effectuées.

## V.4 Méthodologie de Mise en Œuvre

*(Référence aux procédures de mise en place d'une campagne de mesure vibratoire)*

---

# PARTIE VI — RAPPELS MATHÉMATIQUES

## VI.1 Le Signal Vibratoire

### Définition Norme NFE 90-001

> Une vibration est une **variation avec le temps** d'une grandeur caractéristique du mouvement ou de la position d'un système mécanique lorsque la grandeur est alternativement plus grande et plus petite qu'une certaine valeur moyenne ou de référence.

### Mouvement Vibratoire Simple

Le mouvement vibratoire le plus simple à étudier est celui traduisant le déplacement d'un point (A) situé sur un cercle et tournant à une vitesse de rotation ω.

La rotation de A entraîne une variation sinusoïdale de sa projection X qui répond à la relation :

> **X(t) = A sin (ω t)**

### Fréquence et Période

La **fréquence** est le nombre de fois qu'un phénomène se répète en un temps donné.

Lorsque l'unité choisie est la seconde, la fréquence s'exprime en **hertz**.

> **1 hertz = 1 cycle / seconde**

La **période T** du signal correspond à la durée d'un cycle.

Si la fréquence d'un phénomène est de 50 hertz, c'est-à-dire 50 cycles par seconde, la durée d'un cycle est de 1/50e de seconde.

> **La fréquence est l'inverse de la période : f = 1/T**

### Lien entre Fréquence et Vitesse de Rotation

La période T est fonction de la vitesse de rotation : plus on tourne vite (ω grand) et plus la période sera petite, donc plus la fréquence sera grande.

Sur les machines tournantes industrielles, on utilise souvent le **tour par minute** pour exprimer une vitesse de rotation, parfois noté :
- **CPM** (Cycle Per Minute)
- **RPM** (Rotation Per Minute)

> **Conversion : f (Hz) = N (tr/min) / 60**

## VI.2 Amplitude du Signal Vibratoire

Une vibration se caractérise principalement par :
- Sa **fréquence**
- Son **amplitude**
- Sa **phase**

On appelle **amplitude** d'une onde vibratoire la valeur de ses écarts par rapport au point d'équilibre.

### Types d'Amplitude

| Type | Notation | Description |
|------|----------|-------------|
| **Amplitude crête** | Ac | Amplitude maximale par rapport au point d'équilibre |
| **Amplitude crête à crête** | Acc | Amplitude double, aussi appelée « peak to peak » |
| **Amplitude efficace** | Aeff ou RMS | Root Mean Square |

D'autres calculs peuvent être effectués à partir de l'amplitude vibratoire. On retiendra principalement :
- La **valeur moyenne**
- Le **facteur de crête**

## VI.3 Grandeurs Associées à l'Amplitude

Par analogie avec un système masse-ressort, une vibration est caractérisée par **3 grandeurs** :

1. **Le déplacement** — La position varie de part et d'autre du point d'équilibre
2. **La vitesse de déplacement** — Nulle au point haut et au point bas, maximale autour du point d'équilibre
3. **L'accélération** — Permet à la masselotte de passer de sa vitesse minimale à sa vitesse maximale

## VI.4 Détermination des Fréquences d'un Signal

La rotation de l'arbre d'une machine tournante est le phénomène donnant naissance aux vibrations. Cette rotation étant par nature périodique, les vibrations enregistrées le sont aussi.

### Série de Fourier

Tout signal périodique peut, selon **Fourier**, se décomposer en une somme de sinusoïdes que l'on appelle **série de Fourier**.

Si « S » (S peut désigner l'accélération, la vitesse ou le déplacement) est une fonction périodique du temps, on peut écrire :

> **S(t) = Σ [An · sin(n·ω·t + φn)]**

### Transformée de Fourier et Spectre

La représentation graphique du signal vibratoire en fonction du temps reste assez « illisible ». Elle ne permet pas l'analyse car tous les termes sont superposés.

La **transformée de Fourier**, lorsqu'elle s'applique à une fonction du temps comme l'accélération, la vitesse ou le déplacement, donne pour résultat une autre fonction dont la variable est la **fréquence**. Cette nouvelle fonction est appelée **spectre**.

> **Le spectre est une représentation de l'amplitude d'une grandeur en fonction de la fréquence.**

**Exemple** : Le spectre d'un signal sinusoïdal est un pic à la fréquence du signal.

Un signal vibratoire étant la somme de plusieurs sinus, son spectre sera une succession de pics aux différentes fréquences caractéristiques du signal de départ.

> **Important** : Les pics observés sur les spectres ne sont pas tous des défauts. Sur les systèmes, il existe dès l'origine du balourd, du désalignement, des moteurs imparfaits, des pics d'engrenement, etc.

---

# PARTIE VII — DÉSÉQUILIBRE : DÉFAUT DE « BALOURD »

## VII.1 Équilibrage Statique

Imaginons un rotor parfaitement en équilibre. Ajoutons en un endroit de ce rotor une masse M.

Le rotor présentera un **déséquilibre**. Même à l'arrêt, le rotor reviendra à une position d'équilibre. Il s'agit d'un **déséquilibrage statique**.

Dès que le rotor sera en rotation, la masse M exercera une force radiale proportionnelle à la vitesse de rotation selon la relation :

> **F = M · r · ω²**

On mesure l'amplitude de l'accélération du signal vibratoire au point P1 et P2.

Au point P1, l'amplitude vibratoire sera :
- **Maximale** lorsque la masse sera en haut du rotor
- **Minimale** lorsqu'elle sera en bas du rotor, et ainsi de suite, à chaque tour du rotor

Il se passe la même chose au point P2. Les efforts exercés sont **en phase**.

Le signal vibratoire a donc une période de **1 tour**.

**Fréquence du signal :**

Si on tourne à 1500 tours/minute, le signal sera à son maximum 1500 fois par minute.

> **f = N / 60** (où N est en tr/min)

## VII.2 Équilibrage Dynamique

Reprenons l'exemple précédent en remplaçant la masse M par 2 masses identiques mais décalées de 180° et placées à chaque extrémité du rotor.

L'analyse temporelle des amplitudes du signal vibratoire montre que les signaux en P1 et P2 sont **déphasés**.

En effet, les deux paliers supportant le rotor vont subir des efforts centrifuges de façon alternée. Le déphasage est en théorie de **180°**.

## VII.3 Spectre d'un Déséquilibre Pur

Un déséquilibre va donc induire une vibration dont la **fréquence principale** est celle de la vitesse de rotation du rotor.

Le spectre de ce signal va donc avoir une composante prépondérante à la **fréquence de rotation du rotor**.

Dans le cadre d'un spectre réel, le spectre aura une composante à la fréquence prépondérante ainsi que des **harmoniques** à 2 fois et 3 fois la fréquence de rotation.

### Exemple Pratique

Sur un ventilateur tournant à **2925 tr/min** :
- 2925 tr/min correspond à **2925/60 = 48,75 Hz**
- On observe sur le spectre un pic à la fréquence de **48,75 Hz** traduisant la présence d'un balourd

---

# PARTIE VIII — DÉFAUT D'ALIGNEMENT

## VIII.1 Origine du Défaut

Un défaut d'alignement peut apparaître lorsqu'un arbre doit entraîner un autre arbre, souvent par l'intermédiaire d'un accouplement.

### Types de Désalignements

| Type | Description |
|------|-------------|
| **Décalage d'axe** | Les axes sont parallèles mais non concentriques |
| **Désalignement angulaire** | Les axes ne sont pas parallèles |

Dans la réalité, les défauts d'alignement sont une **combinaison** du décalage d'axe et du désalignement angulaire.

### Causes Possibles

Un désalignement peut également être la conséquence de :
- Un **défaut de montage** d'un palier
- Un **mauvais calage** des pattes de fixation
- Une **déformation du châssis** (par exemple à la suite de contraintes thermiques) qui se traduit par une flexion de l'arbre du rotor. Dans ce cas, les deux paliers ne sont pas concentriques.

> Le défaut d'alignement est l'une des principales causes de réduction de la durée de vie des équipements. Il crée des efforts importants qui vont entraîner la dégradation rapide du système d'accouplement et des paliers.

> Dans la plupart des cas, on peut y remédier facilement par un **lignage**. Ce genre de prestation est réalisé à l'aide de matériels utilisant la technologie laser. Pour la plupart des applications, un lignage effectué par du personnel qualifié et expérimenté n'immobilise la machine que quelques heures.

## VIII.2 Signature du Défaut d'Alignement

Le signal temporel d'un défaut d'alignement présente :
- Un phénomène périodique à la **fréquence de rotation** (période = temps pour faire 1 tour)
- Des phénomènes se répétant chaque **½ tour** et **⅓ tour**

Cela se traduira le plus souvent par la présence de composantes d'ordre 2, 3 ou même 4 de la fréquence de rotation avec des **amplitudes supérieures** à celles de la composante d'ordre 1.

Les composantes multiples d'une fréquence dans un spectre sont appelées les **harmoniques** de cette fréquence.

> **Un défaut d'alignement est donc révélé par un pic d'amplitude prépondérant à généralement 2 fois la fréquence de rotation** (parfois 3 ou 4 fois).

### Exemple Pratique

Sur un compresseur tournant à **1500 tr/min** :
- 1500 tr/min correspond à une fréquence de **1500/60 = 25 Hz**
- Donc Fo = 25 Hz, 2·Fo = 50 Hz et 3·Fo = 75 Hz
- On observe sur le spectre un pic à 25 Hz et un **pic plus important à 50 Hz** soit 2 fois Fo, traduisant la présence d'un désalignement

---

# PARTIE IX — DÉFAUT DE DESSERRAGE ET DE JEU

## IX.1 Desserrage

Par desserrage, on entend par exemple un **manque de rigidité de montage** sur une structure. Cela peut être dû effectivement à :
- Un desserrage des **vis de fixation** de la structure
- Une **fissuration** d'ancrage ou de bâti

Des défauts comme le balourd vont entraîner le bâti à se désolidariser de la structure. Cela entraîne un **signal temporel écrêté**.

> Le spectre fait apparaître des **harmoniques** de la fréquence de rotation, comme les autres défauts, mais également des **sous-harmoniques** à ½, ⅓ de la fréquence de rotation.

## IX.2 Jeu

Le phénomène de jeu va avoir pratiquement la même signature vibratoire.

Le jeu se retrouve en général dans le **roulement**. Il peut s'agir de :
- Jeu entre la **bague extérieure** et le palier
- Jeu entre la **bague intérieure** et l'arbre
- Jeu excessif entre les **billes/galets** et les cages interne et externe

Pour les **paliers lisses**, le jeu signifie un espace trop important entre l'arbre et le palier.

---

# PARTIE X — DÉFAUTS DE TRANSMISSION PAR COURROIES

C'est un défaut peu évident à localiser et seule l'expérience acquise permet une bonne analyse de ce type de défauts.

Le principal défaut rencontré dans ce type de transmission est lié à une **détérioration localisée** de la courroie (partie arrachée, défaut de jointure, …) impliquant un effort ou un choc particulier à la fréquence de passage de ce défaut (Fc).

> Le calcul de Fc n'inclut pas d'éventuels glissements.

L'image vibratoire donne un pic d'amplitude importante à la **fréquence de passage des courroies**, ou de ses harmoniques.

---

# PARTIE XI — DÉFAUTS DE DENTURE D'ENGRENAGES

## XI.1 Généralités

Un engrenage est composé de deux roues dentées possédant un certain nombre de dents (noté Z) tournant à des vitesses différentes.

Un réducteur ou un multiplicateur peut être composé de plusieurs engrenages. L'engrènement se fait au rythme d'engagement des dents selon une **fréquence d'engrènement Fe** égale à la fréquence de rotation multipliée par le nombre de dents :

> **Fe = Z × Frot**

**Propriété importante** : Il n'y a qu'une **seule fréquence d'engrènement** pour un engrenage.

Si l'arbre n°1 tourne à F1 avec Z1 dents, et l'arbre n°2 à F2 avec Z2 dents :
- Fe1 = Z1 × F1
- Fe2 = Z2 × F2
- Et Fe1 = Fe2 (car F2/F1 = Z1/Z2)

## XI.2 Signature d'un Engrenage Sain

Si la denture est correcte et si aucun phénomène parasite ne vient perturber l'engrènement, le spectre vibratoire est constitué de composantes dont les fréquences correspondent à la **fréquence d'engrènement Fe et ses harmoniques**.

Les défauts pouvant apparaître dans les engrenages sont de 2 sortes :
1. **Détérioration d'une dent**
2. **Excentricité d'un pignon**

## XI.3 Signature d'une Détérioration de Dent

Si l'une des roues possède une dent détériorée, il se produit un **choc périodique** à la fréquence de rotation de la roue considérée.

Le spectre montrera donc :
- La fréquence d'engrènement (comme précédemment)
- Un pic à la **fréquence de rotation** (par exemple F1 si le défaut est sur la roue 1)
- De **nombreuses harmoniques**

Les nombreuses harmoniques de la fréquence constituent ce que l'on appelle un **« peigne de raie »**.

Elles sont dues au phénomène de chocs. Dès qu'un défaut se traduit par des chocs, cela se retrouve sur le spectre par un peigne de raie dont la fréquence est celle du défaut.

## XI.4 Défaut d'Excentricité (Faux Rond)

Si l'arbre ou le pignon présente un défaut d'excentricité, ou de faux rond, il va apparaître une **modulation d'amplitude** du signal par la fréquence de rotation due à la modulation de l'effort d'engrènement.

### Signaux Observés

| État | Description |
|------|-------------|
| Engrenage sain | Signal régulier |
| Modulation en amplitude | Signal traduisant une modulation d'amplitude |
| Évolution du défaut | Augmentation de la modulation d'amplitude |

L'image vibratoire théorique de ce type de défaut présente autour de la fréquence d'engrènement ou de ses harmoniques, des **raies latérales** dont le « pas » correspond à la fréquence de rotation de l'arbre qui porte le défaut.

C'est ce qu'on appelle des **bandes latérales de modulation d'amplitude**. Les amplitudes des bandes latérales sont généralement très faibles devant l'amplitude de la fréquence d'engrènement.

### Exemple Pratique

Sur un engrenage au niveau d'un pignon tournant à **1500 tr/min** et comportant **33 dents** :
- Fréquence d'engrènement = 25 Hz × 33 = **825 Hz**
- Pour distinguer les bandes latérales, il faut faire un **zoom** du spectre autour de la fréquence d'engrènement
- On aperçoit les bandes latérales autour de la fréquence d'engrènement traduisant un défaut engendrant une modulation d'amplitude

## XI.5 Gravité des Défauts

La difficulté, concernant les engrenages, est de juger de la gravité des défauts. En effet, même sur une machine en bon état, on obtient ce type d'images.

Seule l'**augmentation des amplitudes** des raies décrites ci-dessus permet de diagnostiquer une dégradation de l'engrènement.

### Deux Règles Toujours Vérifiées

1. **Si les amplitudes du peigne de raies ne dépassent pas celle de la fréquence d'engrènement**, l'engrènement peut être considéré comme en bon état
2. **Un zoom présentant une image dissymétrique des modulations** autour de la fréquence d'engrènement est caractéristique d'un engrènement dégradé

---

# PARTIE XII — DÉFAUTS ÉLECTRIQUES

Pour bien des machines électriques, les fréquences significatives d'une anomalie électromagnétique seront des **multiples de la fréquence du courant d'alimentation Fa**.

Pour ce type de moteur, la plupart des défauts se traduiront par un pic important à **2 fois la fréquence du courant d'alimentation** (2 × 50 = 100 Hz).

Afin de bien l'identifier, il est parfois nécessaire de faire un **zoom** sur cette fréquence pour la différencier d'une harmonique de la fréquence de rotation (1500 tr/min correspond à 25 Hz ; la 4ème harmonique est alors égale à 100 Hz).

### Exemple de Différenciation

Sur le spectre, si le rotor a une fréquence de **24,8 Hz** :
- La 4ème harmonique est donc à 4 × 24,8 = **99,20 Hz**
- Il faut faire un zoom pour la différencier du pic à 100 Hz traduisant un défaut d'origine électromagnétique

> L'apparition d'un pic à 100 Hz déclenchera alors une étude plus approfondie des fréquences caractéristiques du moteur afin de diagnostiquer l'origine du défaut.

> **Il est à noter que le pic à 2Fa existe tout le temps.**

---

# PARTIE XIII — CIRCUITS HYDRAULIQUES / VENTILATEURS

## XIII.1 Passages d'Aubes

Le passage des aubes devant le bec de la volute d'une pompe ou le passage des pales d'un ventilateur provoque un pic à la fréquence **« f aubes »** :

> **f aubes = n · fr**

Ce défaut **n'est pas directionnel**, il se repère aussi bien en radial qu'en axial.

### Origines Possibles

| Type | Cause |
|------|-------|
| **Mécanique** | Mauvais calage axial de l'impulseur ou jeu de bec de volute insuffisant |
| **Hydraulique** | Débit trop bas |
| **Encrassement** | Des aubes ou des pales qui peut aussi provoquer du balourd |

## XIII.2 Cavitation

Dans les circuits hydrauliques contenant des machines (pompes, turbines hydrauliques, …) on cherche à éviter le phénomène de **cavitation** qui se manifeste par l'apparition de bulles de vapeur dans l'écoulement du liquide.

Celles-ci, lorsqu'elles se retrouvent sur les rotors des pompes ou sur les aubages des turbines, peuvent imploser entraînant alors l'**érosion des pièces en métal**. Les dégâts créés peuvent être assez importants, voire dangereux.

> Le phénomène de cavitation se traduit par une **augmentation générale du bruit de fond**. Il n'y a pas de raie caractéristique. **Toutes les fréquences sont excitées de manière aléatoire.**

---

# PARTIE XIV — DÉFAUTS SPÉCIFIQUES AUX ROULEMENTS

## XIV.1 Durée de Vie des Roulements

La durée de vie théorique des roulements est donnée par la formule classique de la norme ISO 281.

La durée de vie d'un roulement sera **fortement réduite** en fonction des efforts dynamiques auxquels il sera soumis.

C'est pour cette raison qu'il est important de corriger les problèmes tels que le **délignage**, le **balourd**, le **serrage**, etc. qui conduisent à une augmentation très forte des efforts dynamiques.

## XIV.2 Processus de Dégradation d'un Roulement

Le processus de dégradation d'un roulement suit généralement les étapes suivantes :
1. **Phase initiale** — Usure normale
2. **Phase de dégradation** — Apparition de micro-écaillages
3. **Phase avancée** — Propagation des fissures et écaillages visibles
4. **Phase critique** — Risque de rupture de cage ou de blocage

## XIV.3 Fréquences Caractéristiques

Pour chaque type de roulement, et en fonction de ses cotes de fabrication, on peut considérer **4 fréquences caractéristiques** :

| Abréviation | Nom Complet | Description |
|-------------|-------------|-------------|
| **BPFO** | Ball Pass Frequency Outer Race | Fréquence de passage d'une bille sur un défaut de piste externe |
| **BPFI** | Ball Pass Frequency Inner Race | Fréquence de passage d'une bille sur un défaut de piste interne |
| **FTF** | Fundamental Train Frequency | Fréquence de passage d'un défaut de cage |
| **BSF** | Ball Spin Frequency | Fréquence de passage d'un défaut de bille sur la bague interne ou externe |

> **Remarque** : FTF dépend du montage des roulements. Si la bague externe est fixe et que la bague interne tourne, la formule de FTF est celle vue précédemment. Si la bague interne est fixe et la bague externe tourne, la fréquence de rotation de la cage est différente.

## XIV.4 Modulation d'Amplitude de BPFI

Principalement pour les défauts de bagues internes et externes, les vibrations du défaut sont modulées par les efforts appliqués au système, notamment par leur direction.

**Cas de la bague interne montée serrée** (solidaire de l'arbre) :

Considérons le cas d'une charge dont la direction est constante. Le défaut sur la bague interne tourne à la vitesse de rotation. La charge appliquée sur le roulement reste toujours dans la même direction.

Ceci provoque une augmentation de l'amplitude de la force agissant sur le défaut de la bague interne et de la vibration lorsque le défaut passe dans la **zone la plus chargée**.

## XIV.5 Modulation de BPFO

Considérons maintenant le cas où la direction de la charge tourne avec la bague intérieure.

Le défaut sur la bague externe est fixe. Le balourd tourne à la vitesse de rotation. Ceci provoque une augmentation de l'amplitude de la force agissant sur le défaut et de la vibration lorsque le défaut passe dans la **zone la plus chargée**.

## XIV.6 Signatures Vibratoires des Défauts d'Écaillage

Les défauts de type écaillages vont être modulés en amplitude par la vitesse de rotation.

Cela se traduira sur le spectre par :
- Un pic à la **fréquence du défaut** (Fdéfaut = BPFI ou BPFO ou FTF ou BSF)
- Des **bandes latérales** à la fréquence de rotation de l'arbre

De plus, les défauts d'écaillage se traduisent par des **chocs**. Le spectre va donc faire apparaître un **peigne de raie** à la fréquence du défaut (Fdéfaut = BPFI ou BPFO ou FTF ou BSF).

### Exemple Pratique — Bague Externe

Sur un roulement dont la fréquence de bague externe est de **138,80 Hz** :
- On observe un peigne de raies à la fréquence du défaut (1, 2, 3, 4, …) traduisant les chocs périodiques
- Le spectre est extrêmement étendu et présente un peigne de raies dont l'amplitude est faible
- De ce fait, le peigne de raie est souvent **noyé dans le bruit de fond**, donc non identifiable par une analyse spectrale classique

### Exemple Pratique — Bague Interne

Sur un roulement dont la fréquence de bague intérieure est égale à **148,5 Hz** :
- On observe un pic à cette fréquence mais il est noyé dans le bruit de fond

> Des outils plus performants que la simple analyse spectrale peuvent être utilisés pour établir un diagnostic et faire ressortir du spectre les fréquences qui nous intéressent.

## XIV.7 Rupture de Cage

Lorsque la cage d'un roulement casse, les billes ne sont plus maintenues à une distance égale les unes des autres et elles vont se regrouper.

Cela entraîne :
- Une **excentricité** de l'arbre
- Un **balourd** tournant à la vitesse de rotation de la cage

Ce type de défaut apparaît donc sur le spectre par une **raie unique à la fréquence de la cage FTF**.

En général, FTF est égale à **0,4 × la vitesse de rotation**.

> En réalité, une rupture de cage est très difficilement détectable car un roulement dont la cage est rompue se détériore très rapidement.

## XIV.8 Défaut de Billes

Un défaut de billes génère une image typique dans le spectre.

Il y aura plusieurs **groupes de pics** qui apparaissent composés d'un pic central et de modulations autour de ce pic central.

Dans la grande majorité des cas :
- Le **pic central** correspond au défaut de billes
- La **modulation** correspond au défaut de cage

La fréquence à laquelle les billes tournent autour de leur propre axe dans la cage est **BSF**.

## XIV.9 Défauts de Déversement

Le déversement de bague interne ou externe peut être la conséquence d'un **désalignement**.

## XIV.10 Quand Changer les Roulements ?

L'information la plus importante, pour réaliser une évaluation de la gravité du défaut et une estimation de la durée de vie restante du roulement, reste la **courbe de tendance**.

En général, s'il y a peu de différences entre deux mesures, il n'est pas nécessaire de prendre des actions.

Le remplacement d'un roulement dépend également et surtout des **circonstances** :
- Quelle est l'importance de la machine ?
- Sa disponibilité pour la maintenance ?
- …

> Il est préférable de ne pas chercher à atteindre la durée de vie maximale du roulement. Quand un défaut est clairement détecté, il faut procéder à son remplacement pour éviter toute perte de production.

---

# PARTIE XV — LES INDICATEURS

## XV.1 Surveillance et Diagnostic

On distingue communément **2 principales activités** :

### La Surveillance

Le but est de **suivre l'évolution** d'une machine par comparaison des relevés successifs de ses vibrations. Une tendance à la hausse de certains **indicateurs** par rapport à des **valeurs de référence**, constituant la **signature**, alerte généralement le technicien sur un dysfonctionnement probable.

La valeur de référence est souvent une signature établie lors de la **première campagne de mesure** sur la machine neuve ou révisée.

### Le Diagnostic

Il met en œuvre des outils mathématiques plus élaborés. Il permet de **désigner l'élément de la machine défectueux** suite à une évolution anormale des vibrations constatée lors de la surveillance.

Le diagnostic n'est réalisé que lorsque la surveillance a permis de détecter une anomalie ou une évolution dangereuse du signal vibratoire.

> La surveillance peut être confiée à du personnel peu qualifié. Le diagnostic demande de solides connaissances mécaniques et une formation plus pointue en analyse du signal.

## XV.2 Décibels, Niveaux de Référence, Alerte et Danger

Soit A l'amplitude de l'accélération. A est une fonction de la fréquence (pour une mesure réalisée lors d'une campagne) et du temps (la valeur évolue d'une campagne de mesure à l'autre).

On nomme **Ao** la première mesure de cette grandeur. C'est celle qui fait référence.

Pour les mesures suivantes, on pourra mesurer l'accélération en m/s² ou en g, mais on pourra également la mesurer en **décibel (dB)**.

> **Formule du décibel : A(dB) = 20 · log₁₀(A/Ao)**

### Tableau des Seuils

| Niveau | | | Référence | | | Alerte | | | Danger |
|--------|---|---|-----------|---|---|--------|---|---|--------|
| **A/Ao** | 0,10 | 0,32 | **1** | 1,12 | 1,41 | **2,00** | 2,51 | 3,16 | **10,00** |
| **A (dB)** | -20 | -10 | **0** | 1 | 3 | **6** | 8 | 10 | **20** |

> Si lors d'une mesure, l'amplitude vibratoire est **2 fois** plus importante que celle de la valeur de référence, cela correspondra à une mesure de **6 dB**.
> Si l'amplitude vibratoire est **10 fois** plus grande que la valeur de référence, cela correspondra à **20 dB**.

La définition de ces seuils peut ensuite être affinée en fonction des connaissances du cycle de vie de la machine acquises avec l'expérience.

## XV.3 Indicateurs de Surveillance : Détection des Défauts

Ce sont des indicateurs utilisés régulièrement pour surveiller les installations. Leurs évolutions permettent d'alerter le technicien d'une dégradation.

On distingue :
- Les **indicateurs scalaires** ou **niveaux globaux (NG)**
- Les **indicateurs spectraux** de forme ou **spectres**

### Indicateurs Basses Fréquences

#### Déplacement Crête à Crête [10-100 Hz] : Dcc

- **Unité** : μm (micromètres)
- **Indicateur utilisé par l'API** (American Petroleum Institute)
- Utilisé par tout industriel intervenant en pétrochimie
- Sensible aux phénomènes dits « basses fréquences »

**Niveau acceptable maximal** (quelle que soit la vitesse) :

> **Dcc_max = 25,4 · (12000/N)^0,5**

Avec N : vitesse de rotation en tr/min et Dcc, déplacement crête à crête en μm.

#### Vitesse Efficace [10-1000 Hz] : Veff

- **Unité** : mm/s
- Révélateur de phénomènes « basses fréquences » (BF)
- Ces phénomènes sont les **plus énergétiques** donc les **plus destructeurs**
- Une augmentation du balourd, un défaut d'alignement, se traduiront par une augmentation anormale de cet indicateur
- Cet indicateur est pris comme référence dans la **norme ISO 10816**

Cette norme définit l'emplacement des points de mesures et des seuils d'alerte et de danger en fonction du type de machine.

### Indicateurs Hautes Fréquences

#### Accélération Efficace [2 Hz - 20 kHz] : Acceff

- **Unité** : g ou mg (1 g = 9,81 m/s² ; 1 mg = 10⁻³ g)
- Révélateur de phénomènes « hautes fréquences » (HF)
- Défauts de roulements, de dentures, etc.

Une élévation anormale de l'accélération sera en général, sur une machine simple, révélatrice d'une **dégradation avancée des roulements**. En effet, le peigne de raies créé par les défauts de type roulements va surtout apparaître en haute fréquence. En basse fréquence, il est masqué par les autres phénomènes comme le balourd ou le délignage.

### Indicateurs Spécifiques aux Roulements

#### Facteur de Crête [1000-20000 Hz] : FC

- **Sans unité**
- Défini à partir des valeurs crête et efficace de l'accélération

> **FC = Ac / Arms**

**Défaut majeur** de cet indicateur : il présente environ les mêmes valeurs à l'état neuf et en fin de vie du roulement.

> **Seule l'évolution dans le temps** de cet indicateur est utilisable :
> - Si FC **augmente** → la situation n'est pas alarmante
> - Si FC **diminue** → le roulement est en fin de vie

#### Facteur K [1000-20000 Hz] : K

- **Unité** : g² ou mg²
- Défini à partir des valeurs crête et efficace de l'accélération

> **K = (Ac / Arms)² · Arms² = Ac² / Arms**

Le facteur K est **plus sûr** pour effectuer une analyse ponctuelle des roulements. Sa valeur est **directement liée à l'état du roulement**.

## XV.4 Le Facteur Défaut Roulement (FD)

Le Facteur de Défaut Roulement est un traitement spécifique du signal temporel adapté à la surveillance des roulements :

> **FD = a · FC + b · ARMS**
> avec **FC = Ac / Arms** (Facteur de crête)

### Avantages du FD

- **Détection précoce**
- **Peu sensible** aux conditions de fonctionnement
- Valeur **croissante** sur les 3 phases de la dégradation
- Utilisation **simple** et adaptée au **diagnostic automatique**

### Interprétation du FD

L'augmentation du niveau du Facteur de Défaut peut être liée à un **défaut de graissage** du roulement.

En l'absence d'historique d'évolution, on procédera à un **test de graissage** du roulement :
- Le Facteur de Défaut chute généralement de manière importante de façon instantanée
- **Si le niveau du FD reste stable** à cette valeur dans les heures qui suivent l'opération → il s'agit sans doute d'un **problème de graissage**
- **Dans le cas contraire** → il s'agit vraisemblablement d'une **usure du roulement**

## XV.5 Exemple d'Utilisation d'un Niveau Global

On considère ici l'indicateur vitesse efficace **Veff [10-1000 Hz]**.

Le dépassement repéré peut avoir plusieurs origines :
- **Balourd** mécanique ou thermique
- **Desserrage** de la machine
- **Délignage**

Le niveau global utilisé fait apparaître un problème. On se doute de sa gravité mais on n'en connaît pas l'origine. Dans le cas présenté, il s'agissait d'un **délignage** que l'on a diagnostiqué par une mesure de spectre. Après réglage, le défaut d'alignement a disparu, ce qui a eu pour conséquence de faire baisser le NG.

## XV.6 Effet de Masque

L'effet de masque est le **danger le plus sérieux** de ce type de suivi.

Généralement, ce sont les amplitudes efficaces des indicateurs qui sont mesurées. Le niveau global est tel que :

> **NG = √(a² + b² + c² + d² + …)**

Avec a, b, c, d, … les amplitudes respectives des composantes mesurées.

Du fait de l'élévation au carré, les défauts dont l'amplitude est élevée vont être prépondérants dans le calcul. Les défauts d'amplitude moindre, mais pas de gravité moindre, risquent d'être complètement **masqués**.

### Illustration Numérique

**Une variation de 20 % du déséquilibre donnera** :
- Soit une variation de **18 % du NG** pour une gravité moyenne du déséquilibre

**Alors qu'une variation de 100 % du palier donnera** :
- Soit une variation de **5 % du NG** pour une gravité extrême du roulement

> **Conclusion** : Seule une variation du déséquilibre fera varier significativement le niveau global. Un défaut de roulement risque d'être complètement masqué.

---

# PARTIE XVI — OUTILS DE DIAGNOSTIC

Le principal outil de diagnostic est l'examen approfondi du **spectre de l'amplitude vibratoire en accélération**.

## XVI.1 Résolution Spectrale

Avec la technologie actuelle, on mesure les spectres d'amplitude en utilisant des appareils numériques. Ces appareils numériques décomposent le spectre en un certain nombre de lignes, dépendant de la capacité de l'appareil.

Les collecteurs actuels peuvent décomposer généralement les spectres réels en **800 lignes**. Le spectre obtenu sera donc une courbe passant par 800 points régulièrement espacés en fréquence.

### Types de Spectres

| Type | Gamme de Fréquence | Utilisation |
|------|-------------------|-------------|
| **Spectres BF** (Basses Fréquences) | 0 - 200 Hz | Phénomènes lents, balourd, alignement |
| **Spectres MF** (Moyennes Fréquences) | 0 - 2000 Hz | Engrenages, défauts intermédiaires |
| **Spectres HF** (Hautes Fréquences) | 0 - 20 000 Hz | Roulements, dentures |
| **Zooms haute résolution** | [f1 - f2] | Distinguer des défauts proches en fréquence |

### Calcul de la Résolution Spectrale

Soit Δf la largeur du spectre. Le plus petit écart mesurable sur le spectre sera égal à **Δf/800** si la résolution du collecteur est de 800 lignes.

| Spectre | Largeur Δf | Résolution |
|---------|-----------|------------|
| BF [0-200 Hz] | 200 Hz | 200/800 = **0,25 Hz** |
| HF [0-20000 Hz] | 20 000 Hz | 20000/800 = **25 Hz** |
| Zoom [98-102 Hz] | 4 Hz | 4/800 = **0,005 Hz** |

> Pour distinguer 2 défauts dont la fréquence est proche, on aura alors recours à un spectre de type **zoom**.

## XVI.2 Les Échelles de Fréquence

### Échelle Linéaire de Fréquence

- Intéressante quand la gamme d'analyse est restreinte
- Inadaptée aux spectres étendus

### Échelle Logarithmique de Fréquence

- Utilisable sur de **grandes gammes** de fréquence
- Permet de visualiser correctement les basses et hautes fréquences sur le même graphique

## XVI.3 Les Échelles d'Amplitude

### Échelle Linéaire d'Amplitude

- Tous les pics ont la même importance visuelle
- Les défauts induisant des faibles amplitudes sont souvent **masqués**
- L'augmentation du bruit n'est pas mise en évidence

### Échelle Logarithmique d'Amplitude

- Les pics de faibles importances apparaissent parfaitement
- Certains phénomènes qui étaient difficilement repérables en échelle linéaire d'amplitude sont visibles, notamment les **modulations de chocs périodiques**
- L'importance du **bruit de fond** est aussi visible

> **L'échelle logarithmique d'amplitude et de fréquence est la représentation de base à utiliser pour visualiser tous les phénomènes.**

---

# PARTIE XVII — INDICATEUR INTERMÉDIAIRE

L'analyse spectrale nécessitant des connaissances, un temps de traitement et une taille de mémoire importants, des outils intermédiaires ont été développés. Il s'agit des **indicateurs bandes fines** et du **spectre PBC**.

## XVII.1 Indicateur Bandes Fines

Il s'agit de venir mesurer l'amplitude vibratoire sur un spectre à une **fréquence donnée**.

On définit alors des seuils de la même manière que pour les indicateurs globaux.

**Exemple** : On place une bande fine autour de la **fréquence de rotation**. Le dépassement des seuils d'alerte ou de danger de cette bande fine nous indiquera une élévation de la composante fondamentale de la vitesse de rotation, et donc l'aggravation possible d'un défaut de **balourd**.

### Choix de la Largeur de la Bande Fine

La difficulté réside dans le choix de la largeur de la bande fine :
- **Trop petite** → risque de passer à côté du défaut
- **Trop grande** → risque de détecter plusieurs défauts

Les bandes fines sont calculées à partir des spectres. Souvent, les constructeurs conseillent de prendre une largeur de bande fine égale à **± 2 fois la résolution spectrale**.

---

# ANNEXE A — TABLEAU DE RECONNAISSANCE DES AVARIES

## A.1 Tableau Complet des Défauts et Leurs Signatures Vibratoires

| **CAUSE** | **FRÉQUENCE** | **DIRECTION** | **REMARQUES** |
|-----------|---------------|---------------|---------------|
| **Tourbillon d'huile** | De 0,42 à 0,48 × RPM | Radiale | Uniquement sur paliers lisses hydrodynamiques à grande vitesse |
| **Balourd** | 1 × RPM | Radiale | Intensité proportionnelle à la vitesse de rotation |
| **Défaut de fixation** | 1×2×3×4× RPM | Radiale | Vibration axiale en général plus importante si le défaut d'alignement comporte un écart angulaire |
| **Défaut d'alignement** | 2 × RPM | Axiale et radiale | Disparaît dès la coupure de l'alimentation |
| **Excitation électrique** | 1×2×3×4× 50 Hz | Radiale | Disparaît dès la coupure de l'alimentation |
| **Vitesse critique de rotation** | Fréquence critique du rotor | Radiale | Apparaît en régime transitoire et s'atténue ensuite. Ne pas maintenir à la vitesse critique |
| **Courroies en mauvais état** | 1×2×3×4× RPM | Radiale | — |
| **Désalignements des poulies** | 1 × RPM | Radiale | — |
| **Engrenages endommagés** | Fréquence d'engrènement F = Nbre dents × Rpm arbre | Axiale et radiale | État des dentures |
| **Faux rond pignon** | F ± RPM pignon | Axiale et radiale | Bandes latérales autour de la fréquence d'engrènement dues au faux-rond |
| **Excitation hydrodynamique** | Fréquence de passage des aubes | Axiale et radiale | — |
| **Détérioration de roulement** | Hautes fréquences | Axiale et radiale | Ondes de chocs dues aux écaillages |

---

# ANNEXE B — EXERCICES PRATIQUES

## B.1 Exercice N°1 : Groupe Moteur — Multiplicateur — Compresseur

### Contexte

À partir des caractéristiques d'un groupe « moteur — multiplicateur — compresseur » schématisé, et du tableau de reconnaissance des avaries, on souhaite faire l'analyse du relevé vibratoire associé au groupe en question.

### Fréquences Caractéristiques de l'Installation

| **Élément** | **Fréquence (Hz)** | **Point** |
|-------------|-------------------|-----------|
| Fréquence de rotation du moteur asynchrone (50 Hz) | **25** | A |
| Fréquence d'alimentation Fa | **50** | B |
| Fréquence de l'accouplement Moteur / Multiplicateur (2 encoches) | **50** | B |
| Fréquence d'engrènement du multiplicateur | **25 × 83 = 2075** | F |
| Fréquence de sortie de l'arbre du multiplicateur | **25 × (83/25) = 83** | D |
| Fréquence de l'accouplement Multiplicateur / Compresseur (2 encoches) | **83 × 2 = 166** | E |
| Fréquence d'engrènement du compresseur | **83 × 62 = 5146** | G |
| Effets d'aube du rotor 4 filets du compresseur | **83 × 4 = 332** | H |
| Fréquence de rotation du rotor 6 filets | **83 × (62/93) = 55,67** | C |
| Effets d'aube du rotor 6 filets du compresseur | **55,67 × 6 = 332** | H |

### Travail Demandé

1. **Mettre en relation** les points identifiés sur le spectre et les fréquences correspondantes
2. **En analysant le spectre**, en déduire le défaut mis en évidence lors de la mesure vibratoire (justifier)
3. **Déterminer** une cause possible ayant pu engendrer ce défaut

---

## B.2 Exercice N°2 : Groupe Motopompe — Diagnostic de Désalignement

### Contexte

Lors d'un relevé périodique, le rondier a signalé une augmentation du niveau global de vibration sur un groupe motopompe. Suite à ce constat, le responsable maintenance a demandé un diagnostic évolué de la machine.

Les graphes du niveau vibratoire en fonction de la fréquence, relevés sur le palier B du moteur en vertical (V) et en axial (Ax), sont représentés sur les figures ci-après.

### Analyse des Spectres Avant Intervention

**Constatations :**
- On constate un **pic important à 100 Hz**
- Le moteur de la pompe tourne à **3000 tours/min** soit **50 tours/s** ou **50 Hz**

### Diagnostic

Le **désalignement** se traduit par une vibration dominante à **deux fois la fréquence de rotation** ; ceci tant en radial qu'en axial.

Par ailleurs, s'il y a désalignement, son pic est généralement **supérieur au pic du balourd** qui est, lui, calé sur la fréquence de rotation.

**Toutes ces conditions étant réunies**, on peut constater sur les spectres initiaux qu'il y a **désalignement**.

### Analyse des Spectres Après Intervention

Les spectres finaux montrent que le défaut a été **supprimé**.

### Mesure Corrective

La correction qui a été réalisée est donc un **lignage** ; vraisemblablement entre le moteur et la pompe.

---

## B.3 Exercice N°3 : Essoreuse Agroalimentaire — Défaut de Balourd

### Contexte

L'analyse concerne une **essoreuse** utilisée dans le secteur agroalimentaire. Les graphiques et spectres relevés correspondent partiellement au suivi vibratoire de cette machine.

### Données des Roulements

#### Palier 4 — Roulement SKF 6008-2Z

| Élément | Unité | Valeur à 1 Hz |
|---------|-------|---------------|
| Fréquence défaut bague interne | Hz | 6,88 |
| Fréquence défaut bague externe | Hz | 5,12 |
| Fréquence défaut bille | Hz | 3,33 |
| Fréquence défaut cage | Hz | 0,43 |

#### Palier 3 — Roulement FAG NU224E

| Élément | Unité | Valeur à 1 Hz |
|---------|-------|---------------|
| Fréquence défaut bague interne | Hz | 195,59 |
| Fréquence défaut bague externe | Hz | 143,56 |
| Fréquence défaut rouleau | Hz | 127,00 |
| Fréquence défaut cage | Hz | 8,44 |
| Fréquence rotation piste intérieure | Hz | 19,95 |
| Fréquence rotation rouleau | Hz | 63,50 |

> **N.B.** CPM (Cycle per minute) = Tour/min

### Évolution des Niveaux de Vibration

**Niveau global au 15/08 :** Brutale augmentation dépassant le seuil de danger.

### Diagnostic

Entre le 18 juin et le 15 août, le niveau global de vibration a brutalement augmenté et dépassé de manière significative le **seuil de danger**.

> **La machine doit donc IMPÉRATIVEMENT être arrêtée et ne plus fonctionner jusqu'à l'intervention corrective.**

La fréquence de rotation du moteur est de **1245 tr/min**, soient **1245 CPM**.

**Constatations par palier :**

| Palier | Observation |
|--------|-------------|
| **Palier N°4** | Forte augmentation du pic d'amplitude à la **fréquence de rotation** |
| **Palier N°3** | Augmentation sensible du pic d'amplitude à la **fréquence de rotation** et augmentation des pics d'**harmoniques** |

### Conclusion et Mesure Corrective

> **L'essoreuse n'est donc plus équilibrée.** Il faut donc procéder à un **rééquilibrage urgent** afin de rendre disponible le plus rapidement possible l'essoreuse.

---

## B.4 Exercice N°4 : Installation de Pompage — Analyse de Groupes

### Contexte

On a relevé les signatures vibratoires d'une installation de pompage composée de plusieurs groupes.

- Le **taux de charge** de ces équipements est lié aux périodes saisonnières
- Taux de charge maximum (**6 pompes en fonctionnement**) durant les mois de juin à septembre inclus
- La **cinématique** des systèmes étudiés est simple ; seul un **accouplement élastique** relie la partie motorisation à la partie pompe
- Les relevés ont été effectués sur les systèmes **accouplés**, et **en charges**
- La signature spectrale initiale de l'installation sera donc prise comme telle
- Toutes les mesures effectuées sur un groupe ont été réalisées **indépendamment** de l'ensemble de l'installation
- On étudie **2 groupes de conception identique** : les groupes 2 et 6
- La gamme d'analyse est limitée volontairement à la bande **« 0 à 200 Hz »**
- La collecte s'est effectuée en mode **« Off-line »**

### Paramétrage Initial

*(Référence aux paramètres de mesure du collecteur vibratoire)*

### Relevés de Mesures

| Groupe | Date du dernier relevé |
|--------|------------------------|
| **Groupe N°02** | Août 20XX |
| **Groupe N°06** | Août 20XX |

### Travail Demandé

À partir des informations fournies, et pour chaque groupe motopompe, **colorier de 3 couleurs** les différentes zones telles que les donnerait le logiciel de traitement d'analyse vibratoire. Rayer les informations ne pouvant pas être définies dans la zone « 0-200 Hz ».

*(Référence à la norme ISO 10816 pour le coloriage des zones A, B, C, D)*

---

# ANNEXE C — NORME ISO 10816

## C.1 Classification des Machines (Annexe Provisoire)

| Classe | Description |
|--------|-------------|
| **Classe 1** | Petites machines telles que moteurs électriques jusqu'à **15 kW** |
| **Classe 2** | Machines de taille moyenne, de **15 kW à 75 kW**, ou grandes machines jusqu'à **300 kW** sur assises spéciales |
| **Classe 3** | Grandes machines sur fondations rigides et lourdes opérant à une vitesse inférieure à la fréquence propre de la fondation |
| **Classe 4** | Grandes machines opérant à une vitesse supérieure à la fréquence propre de la fondation (turbomachines) |

## C.2 Seuils de Vitesses Efficaces

Les seuils de vitesses efficaces caractérisent les différents **cas de fonctionnement** pour une **puissance de machine** donnée.

### Zones de Fonctionnement

| Zone | Description | Couleur |
|------|-------------|---------|
| **Zone A** | Nouvelles machines — Fonctionnement sans restriction | 🟢 Vert |
| **Zone B** | Machines en bon état — Fonctionnement acceptable | 🟡 Jaune |
| **Zone C** | Machines en état médiocre — Fonctionnement restreint | 🟠 Orange |
| **Zone D** | Machines en mauvais état — Arrêt imminent | 🔴 Rouge |

> **Référence visuelle** :
> ![ISO 10816 Vibration Severity Chart](https://kimi-web-img.moonshot.cn/img/acoem.us/3d4e46333208e7f024127d63acedd3c3c579a453.png)

---

# ANNEXE D — DÉVELOPPEMENT D'UNE SOLUTION DE MAINTENANCE PRÉDICTIVE

## D.1 Architecture d'une Solution MPC Basée sur l'Analyse Vibratoire

### D.1.1 Collecte des Données

#### Capteurs
- **Accéléromètres** piézoélectriques (mesure de l'accélération)
- **Capteurs de proximité** (mesure du déplacement)
- **Tachymètres** (mesure de la vitesse de rotation)

#### Positionnement
- Position **radiale** (perpendiculaire à l'axe)
- Position **axiale** (parallèle à l'axe)
- Au plus près des **paliers** sur des **structures rigides**
- Fixation par **goujon** pour minimiser les pertes de signal

#### Modes de Collecte

| Mode | Description | Avantages | Inconvénients |
|------|-------------|-----------|---------------|
| **On-Line** | Surveillance permanente par moniteur de vibrations | Détection immédiate des anomalies | Coût élevé, complexité |
| **Off-Line** | Rondes à intervalles réguliers avec collecteur de données | Coût réduit, flexibilité | Non-détection entre les relevés |

### D.1.2 Traitement du Signal

#### Étape 1 : Acquisition
- Échantillonnage du signal vibratoire temporel
- Filtrage anti-repliement
- Conditionnement du signal

#### Étape 2 : Transformation de Fourier
- Application de la **FFT** (Fast Fourier Transform)
- Génération du spectre d'amplitude en fonction de la fréquence

#### Étape 3 : Extraction des Indicateurs

**Indicateurs Globaux (Scalaires) :**
- Niveau global de vitesse efficace Veff [10-1000 Hz]
- Niveau global d'accélération efficace Acceff [2-20000 Hz]
- Déplacement crête à crête Dcc [10-100 Hz]

**Indicateurs Spécifiques :**
- Facteur de crête FC [1000-20000 Hz]
- Facteur K [1000-20000 Hz]
- Facteur de défaut roulement FD

**Indicateurs Spectraux :**
- Amplitude aux fréquences caractéristiques (1×RPM, 2×RPM, etc.)
- Bandes fines autour des fréquences d'intérêt

### D.1.3 Analyse et Diagnostic

#### Détection d'Anomalies
- Comparaison aux **seuils** (alarme / danger)
- Comparaison à la **signature** de référence
- Analyse de **tendance** temporelle

#### Identification du Défaut
- Correspondance des fréquences dominantes avec le tableau de reconnaissance des avaries
- Analyse de la direction des vibrations (radial / axial)
- Analyse des harmoniques et sous-harmoniques

#### Gravité du Défaut
- Évolution dans le temps (courbe de tendance)
- Comparaison avec les normes (ISO 10816)
- Facteur de sévérité

### D.1.4 Prédiction et Décision

#### Estimation de la Durée de Vie Résiduelle (RUL)
- Modèles de dégradation basés sur l'historique
- Régression linéaire / exponentielle sur les indicateurs
- Modèles de Markov ou réseaux de neurones

#### Recommandations
- **Continuer la surveillance** — Niveau normal
- **Planifier une intervention** — Seuil d'alarme dépassé
- **Arrêt immédiat** — Seuil de danger dépassé

## D.2 Formules Essentielles pour le Développement

### D.2.1 Conversion Vitesse de Rotation

> **f (Hz) = N (tr/min) / 60**

### D.2.2 Fréquences Caractéristiques des Défauts

| Défaut | Formule |
|--------|---------|
| Balourd | f = N/60 |
| Désalignement | f = 2 × N/60 |
| Engrenage | Fe = Z × f_rot |
| Passage d'aubes | f_aubes = n × f_rot |
| Excitation électrique | f = 2 × 50 = 100 Hz (pour 50 Hz) |

### D.2.3 Fréquences des Roulements

| Élément | Formule |
|---------|---------|
| BPFO (Bague externe) | Fonction des cotes du roulement |
| BPFI (Bague interne) | Fonction des cotes du roulement |
| FTF (Cage) | ≈ 0,4 × f_rot (bague externe fixe) |
| BSF (Bille) | Fonction des cotes du roulement |

### D.2.4 Indicateurs

> **Niveau Global :** NG = √(a² + b² + c² + d² + …)

> **Facteur de Crête :** FC = Ac / Arms

> **Facteur K :** K = Ac² / Arms

> **Facteur Défaut Roulement :** FD = a·FC + b·ARMS

> **Décibel :** A(dB) = 20·log₁₀(A/Ao)

> **Déplacement max (API) :** Dcc_max = 25,4·(12000/N)^0,5

## D.3 Algorithme de Diagnostic Automatique

```
ALGORITHME Diagnostic_Vibratoire

ENTRÉE :
  - Spectre d'amplitude S(f)
  - Vitesse de rotation N (tr/min)
  - Caractéristiques de la machine (type, puissance, classe ISO)
  - Historique des mesures précédentes

SORTIE :
  - Diagnostic du défaut principal
  - Niveau de gravité
  - Recommandation d'action

DÉBUT

  // Étape 1 : Calcul des fréquences de référence
  f_rot  = N / 60
  f_2x   = 2 * f_rot
  f_3x   = 3 * f_rot
  f_4x   = 4 * f_rot
  f_elec = 100  // Pour réseau 50 Hz

  // Étape 2 : Extraction des pics dominants
  pics = Extraire_Pics_Dominants(S(f))

  // Étape 3 : Identification du défaut
  SI pic_dominant == f_rot ALORS
    défaut = "BALOURD"
    direction = "Radiale"

  SINON SI pic_dominant == f_2x ET pic_2x > pic_1x ALORS
    défaut = "DÉSALIGNEMENT"
    direction = "Axiale et radiale"

  SINON SI pics == f_rot, 2f_rot, 3f_rot, 4f_rot ALORS
    défaut = "DÉFAUT DE FIXATION / JEU"
    direction = "Radiale"

  SINON SI pic_dominant == f_elec ALORS
    défaut = "EXCITATION ÉLECTRIQUE"
    direction = "Radiale"

  SINON SI fréquence_dans_bande_haute_fréquence ALORS
    défaut = "DÉTÉRIORATION DE ROULEMENT"
    direction = "Axiale et radiale"

  SINON SI pics_autour_fréquence_engrènement ALORS
    défaut = "DÉFAUT D'ENGRENAGE"
    direction = "Axiale et radiale"

  FIN SI

  // Étape 4 : Évaluation de la gravité
  SI Niveau_Global < Seuil_Alarme ALORS
    gravité = "NORMAL"
    action = "Continuer surveillance"

  SINON SI Niveau_Global < Seuil_Danger ALORS
    gravité = "ALARME"
    action = "Planifier intervention"

  SINON
    gravité = "DANGER"
    action = "ARRÊT IMMÉDIAT"

  FIN SI

  // Étape 5 : Analyse de tendance
  SI Historique_Disponible ALORS
    tendance = Calculer_Tendance(Historique)
    SI tendance_en_hausse_rapide ALORS
      action = action + " — Tendance critique"
    FIN SI
  FIN SI

  RETOURNER (défaut, gravité, action)

FIN
```

## D.4 Tableau de Bord de Surveillance

### Indicateurs à Suivre par Type de Machine

| Type de Machine | Indicateurs Prioritaires | Fréquence de Relevé |
|-----------------|-------------------------|---------------------|
| **Moteur électrique** | Veff [10-1000 Hz], pic à 2×50 Hz | Mensuel |
| **Pompe centrifuge** | Veff [10-1000 Hz], f_aubes | Mensuel |
| **Réducteur/ Multiplicateur** | Veff, spectre MF/HF, Fe | Mensuel |
| **Compresseur** | Veff, spectre complet, effets d'aube | Mensuel |
| **Ventilateur** | Veff, f_aubes, balourd | Mensuel |
| **Roulement critique** | Acceff HF, FC, K, FD | Hebdomadaire |

### Matrice de Décision

| Indicateur | Normal | Alerte | Danger | Action |
|------------|--------|--------|--------|--------|
| Veff (Classe 2) | < 2,8 mm/s | 2,8 - 7,1 mm/s | > 7,1 mm/s | Voir norme ISO 10816 |
| Acceff HF | < Seuil_ref | 2× Seuil_ref | 10× Seuil_ref | Inspection roulement |
| FC | Stable | Augmentation | Diminution | Analyse détaillée |
| FD | < Seuil | Seuil - 2×Seuil | > 2×Seuil | Graissage test / Remplacement |

## D.5 Intégration dans un Système IoT / Industrie 4.0

### Architecture Proposée

```
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE CAPTEURS                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Accel.  │  │ Accel.  │  │ Tachy.  │  │ Temp.   │        │
│  │ Radial  │  │ Axial   │  │         │  │         │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
└───────┼────────────┼────────────┼────────────┼─────────────┘
        │            │            │            │
        └────────────┴────────────┴────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              COUCHE ACQUISITION & EDGE                      │
│  ┌─────────────────────────────────────────┐               │
│  │  Collecteur de données / Gateway IoT    │               │
│  │  - Prétraitement du signal              │               │
│  │  - Calcul des indicateurs globaux       │               │
│  │  - Détection de seuils critiques        │               │
│  │  - Transmission vers le cloud           │               │
│  └─────────────────────────────────────────┘               │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              COUCHE CLOUD & ANALYSE                         │
│  ┌─────────────────────────────────────────┐               │
│  │  Plateforme d'analyse vibratoire        │               │
│  │  - Stockage historique                  │               │
│  │  - Spectres et tendances                │               │
│  │  - Algorithmes de diagnostic            │               │
│  │  - Prédiction RUL                       │               │
│  └─────────────────────────────────────────┘               │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              COUCHE APPLICATION                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Dashboard  │  │  Alertes    │  │  GMAO       │         │
│  │  Web/Mobile │  │  Email/SMS  │  │  CMMS       │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Fonctionnalités Clés

1. **Visualisation temps réel** des niveaux de vibration
2. **Alertes automatiques** par seuils configurables
3. **Courbes de tendance** avec projection
4. **Diagnostic assisté** par IA / règles expertes
5. **Rapports automatiques** de santé machine
6. **Intégration GMAO** pour planification des interventions
7. **Digital Twin** pour simulation et prédiction

## D.6 Checklist de Mise en Place d'une Solution MPC

### Phase 1 : Préparation (1-2 mois)
- [ ] Inventaire des machines et classement VIS
- [ ] Sélection des machines vitales à surveiller
- [ ] Choix des équipements de mesure
- [ ] Formation du personnel

### Phase 2 : Mise en Route (3-6 mois)
- [ ] Installation des capteurs
- [ ] Définition des points de mesure
- [ ] Première campagne de mesure (signature de référence)
- [ ] Calibration des seuils

### Phase 3 : Optimisation (6-18 mois)
- [ ] Affinement des seuils basé sur l'expérience
- [ ] Détection des fausses alarmes
- [ ] Ajustement des fréquences de relevé
- [ ] Documentation des cas réels

### Phase 4 : Exploitation (en continu)
- [ ] Relevés réguliers
- [ ] Analyse des tendances
- [ ] Interventions planifiées
- [ ] Amélioration continue

---

# GLOSSAIRE

| Terme | Définition |
|-------|------------|
| **Accéléromètre** | Capteur mesurant l'accélération vibratoire |
| **Balourd** | Masse excentrée créant un déséquilibre |
| **BPFI** | Ball Pass Frequency Inner Race |
| **BPFO** | Ball Pass Frequency Outer Race |
| **BSF** | Ball Spin Frequency |
| **CPM** | Cycles Per Minute (tours/min) |
| **Dcc** | Déplacement crête à crête |
| **FD** | Facteur de Défaut Roulement |
| **FC** | Facteur de Crête |
| **FFT** | Fast Fourier Transform |
| **FTF** | Fundamental Train Frequency (fréquence de cage) |
| **HF** | Hautes Fréquences |
| **Lignage** | Alignement des arbres par laser |
| **MPC** | Maintenance Préventive Conditionnelle |
| **NG** | Niveau Global |
| **RMS** | Root Mean Square (valeur efficace) |
| **RPM** | Rotations Per Minute (tours/min) |
| **RUL** | Remaining Useful Life (durée de vie résiduelle) |
| **Spectre** | Représentation amplitude vs fréquence |
| **Veff** | Vitesse efficace |

---

# RÉFÉRENCES

- Norme **ISO 10816** — Évaluation des vibrations des machines par mesurages sur les parties non tournantes
- Norme **NFE 90-001** — Vibrations — Vocabulaire
- **API 670** — Machinery Protection Systems
- **ISO 13373** — État des machines — Diagnostic par analyse vibratoire
- **ISO 17359** — Surveillance des machines et diagnostic d'état — Lignes directrices générales

---

> **Document compilé à partir des supports de formation en Analyse Vibratoire et Maintenance Prédictive.**
> 
> Ce document constitue une référence exhaustive pour les opérateurs, techniciens et ingénieurs en charge de la surveillance vibratoire et de la maintenance prédictive des machines tournantes.





# ORGANISATION DE MAINTENANCE — RÉFÉRENTIEL COMPLET
### BTS Maintenance des Systèmes — Cours Prof. FAIGNER H. — Promotion 2020/2022

> **Objectif de ce document** : Référentiel exhaustif destiné aux opérateurs et ingénieurs en analyse vibratoire et en maintenance industrielle. Couvre l'intégralité du cours : stratégies, FMD, aspects économiques, indicateurs, ordonnancement, gestion des stocks, externalisation, gestion des interventions, gammes, consignation, analyse des défaillances, AMDEC, et tous les **outils de maintenance conditionnelle** (analyse vibratoire, thermographie IR, endoscopie, analyse d'huile).

---

## TABLE DES MATIÈRES

1. [La Fonction Maintenance](#1-la-fonction-maintenance)
2. [Les Formes de Maintenance](#2-les-formes-de-maintenance)
3. [Opérations de Maintenance](#3-opérations-de-maintenance)
4. [Niveaux et Échelons de Maintenance](#4-niveaux-et-échelons-de-maintenance)
5. [Fiabilité, Maintenabilité, Disponibilité (FMD)](#5-fiabilité-maintenabilité-disponibilité-fmd)
6. [La TPM — Totale Productive Maintenance](#6-la-tpm--totale-productive-maintenance)
7. [Aspects Économiques de la Maintenance](#7-aspects-économiques-de-la-maintenance)
8. [Indicateurs et Tableaux de Bord](#8-indicateurs-et-tableaux-de-bord)
9. [Ordonnancement des Activités de Maintenance](#9-ordonnancement-des-activités-de-maintenance)
10. [Gestion des Pièces de Rechange](#10-gestion-des-pièces-de-rechange)
11. [Externalisation des Activités de Maintenance](#11-externalisation-des-activités-de-maintenance)
12. [Gestion des Interventions de Maintenance](#12-gestion-des-interventions-de-maintenance)
13. [Gammes de Démontage / Remontage](#13-gammes-de-démontage--remontage)
14. [Consignation / Déconsignation](#14-consignation--déconsignation)
15. [Outils d'Analyse des Défaillances](#15-outils-danalyse-des-défaillances)
16. [AMDEC — Analyse des Modes de Défaillance, de leurs Effets et de leur Criticité](#16-amdec)
17. [**OUTILS DE LA MAINTENANCE CONDITIONNELLE**](#17-outils-de-la-maintenance-conditionnelle)
    - 17.1 [Analyse Vibratoire (détail exhaustif)](#171-analyse-vibratoire)
    - 17.2 [Thermographie Infrarouge](#172-thermographie-infrarouge)
    - 17.3 [Endoscopie](#173-endoscopie)
    - 17.4 [Analyses d'Huile](#174-analyses-dhuile)
    - 17.5 [Autres Techniques CND](#175-autres-techniques-cnd)

---

## 1. LA FONCTION MAINTENANCE

### 1.1 Définition (NF EN 13306)

> **La maintenance** est l'ensemble de toutes les **actions techniques, administratives et de management** durant le cycle de vie d'un bien, destinées à le **maintenir** ou à le **rétablir** dans un état dans lequel il peut accomplir la **fonction requise**.

La fonction maintenance a pour but de garantir la **disponibilité des équipements de production au coût optimum**.

### 1.2 Domaines d'action

La maintenance couvre un spectre très large d'activités dans une entreprise :

| Domaine | Exemples |
|---------|---------|
| Maintenance préventive et corrective | Révisions, contrôles, dépannages de tous les systèmes |
| Travaux d'installation et mise en route | Équipements neufs |
| Conditions de travail | Sécurité, hygiène, environnement, pollution |
| Amélioration des installations | Reconstruction, modernisation |
| Gestion des pièces de rechange | Outillages, moyens de transport et de manutention |
| Fabrication de pièces détachées | En interne |
| Travaux divers dans les locaux | Agrandissements, déménagements |
| Gestion des énergies | Réseaux de communication |

**L'objectif permanent** : maintenir les matériels dans un état optimal de service, avec priorité à l'outil de production.

### 1.3 Fonctions et tâches associées

#### 1.3.1 Études et Méthodes
- **Études techniques** : améliorations, conception, reconception, analyse des conditions de travail
- **Préparation et ordonnancement** : fiches d'instructions, gammes, plannings d'interventions et d'approvisionnements
- **Études économiques et financières** : gestion des approvisionnements, analyse des coûts (maintenance, défaillance, fonctionnement), cahier des charges, marchés
- **Stratégie et politiques de maintenance** : définition des procédures de maintenance corrective/préventive, procédures de contrôle, déclenchement des interventions, gestion de la sécurité

#### 1.3.2 Exécution / Mise en œuvre
Aspect **pluritechnique** exigeant grande expérience et rigueur.

Principales tâches :
- Gestion de l'intervention de maintenance
- Connaissance comportementale du matériel
- Pilotage des interventions
- Application des consignes d'hygiène, sécurité et conditions de travail
- Installation des machines (réception, contrôle, mise en fonctionnement)
- Diagnostic de défaillance
- Gestion des stocks (pièces de rechange, outillages, appareils de contrôle)

#### 1.3.3 Fonction Documentation et Ressources
**Mémoire de l'activité** sur laquelle s'appuient les études ultérieures.

Principales tâches :
- Élaboration et tenue des inventaires
- Constitution et mise à jour des dossiers techniques et historiques
- Documentation générale, technique et réglementaire
- Documentation fournisseurs

---

## 2. LES FORMES DE MAINTENANCE

### Classification générale

```
MAINTENANCE
├── MAINTENANCE PRÉVENTIVE
│   ├── Systématique (périodicité prédéfinie)
│   ├── Conditionnelle (basée sur surveillance)
│   └── Prévisionnelle (extrapolation de tendances)
└── MAINTENANCE CORRECTIVE
    ├── Palliative (dépannage provisoire)
    └── Curative (réparation définitive)
```

### 2.1 Maintenance Corrective

**Définition (NF EN 13306)** : Maintenance exécutée **après défaillance** et destinée à remettre un bien dans un état dans lequel il peut accomplir une fonction requise.

**Défaillance** : Altération ou cessation de l'aptitude d'un bien à accomplir la fonction requise.

Deux formes de défaillance :
- **Défaillance partielle** : altération de l'aptitude (fonctionnement dégradé)
- **Défaillance complète** : cessation totale de l'aptitude (panne totale)

Deux types d'interventions correctives :

| Type | Description | Caractère |
|------|-------------|-----------|
| **Dépannage (palliative)** | Actions pour permettre au bien en panne d'accomplir sa fonction **pour une durée limitée** | Provisoire — DOIT être suivi d'une réparation |
| **Réparation (curative)** | Actions pour **rétablir définitivement** la fonction requise | Définitif |

### 2.2 Maintenance Préventive

**Définition** : Maintenance exécutée à des **intervalles prédéterminés** ou selon des **critères prescrits**, destinée à **réduire la probabilité de défaillance** ou la dégradation du fonctionnement.

**Buts** :
- Augmenter la durée de vie des matériels
- Diminuer la probabilité des défaillances en service
- Diminuer les temps d'arrêt en cas de révision ou de panne
- Prévenir et éviter les interventions correctives coûteuses
- Éviter les consommations anormales d'énergie, de lubrifiant, etc.
- Améliorer les conditions de travail du personnel de production
- Diminuer le budget de maintenance
- Supprimer les causes d'accidents graves

### 2.3 Maintenance Préventive Systématique

**Définition** : Maintenance préventive exécutée à des **intervalles de temps préétablis** ou selon un **nombre défini d'unités d'usage**, **sans contrôle préalable** de l'état du bien.

Ces intervalles s'appellent **PÉRIODICITÉ**.

**Cas d'application** :
| Contexte | Exemple |
|----------|---------|
| Équipements soumis à législation (sécurité réglementée) | Appareils de levage, extincteurs, ascenseurs |
| Équipements dont la panne risque de provoquer des accidents graves | Matériels de transport en commun |
| Équipement à coût de défaillance élevé | Éléments d'une chaîne de production automatisée, process continus (chimie, métallurgie) |
| Équipements dont les dépenses deviennent anormalement élevées | Consommation excessive d'énergie, éclairage par lampes usagées |

> **Remarque** : De plus en plus, les interventions de la maintenance systématique se font par **échanges standards**.

### 2.4 Maintenance Préventive Conditionnelle

**Définition** : Maintenance préventive basée sur :
- Une **surveillance du fonctionnement** du bien
- Et/ou des **paramètres significatifs** de ce fonctionnement
- Intégrant les actions qui en découlent

La surveillance peut être : calendaire, à la demande, ou **continue**.

**Principe de fonctionnement** :

```
DÉTECTION → DIAGNOSTIC → INTERVENTION

Dépassement seuil d'alarme → Préparation d'une intervention
                           ↓
                    Analyse des organes remplacés → Optimisation du seuil
```

**Outils associés** : Analyse des lubrifiants, Analyse vibratoire, Contrôles non destructifs, Thermographie Infrarouge

### 2.5 Maintenance Préventive Prévisionnelle

**Définition** : Maintenance préventive **conditionnelle** exécutée en suivant les **prévisions extrapolées** de l'analyse et de l'évaluation de paramètres significatifs de la dégradation du bien.

**Principe** :
```
PRÉVISION → DIAGNOSTIC → INTERVENTION

Extrapolation de la courbe d'évolution du défaut
→ Prévision de la date de défaillance
→ Planification du diagnostic et de l'intervention
  (avant que le niveau requis soit dépassé)
```

**Différence clé** entre conditionnelle et prévisionnelle :
- **Conditionnelle** : on réagit au dépassement d'un seuil d'alarme (détection)
- **Prévisionnelle** : on extrapole la tendance pour anticiper la date de défaillance avant qu'elle survienne

**Techniques utilisées** :
- Analyse vibratoire → détection précoce de dégradations mécaniques
- Analyse des lubrifiants → détection des usures et contaminations
- Thermographie Infrarouge → détection d'échauffements anormaux
- Contrôles Non Destructifs (ultrasons, ressuage, magnétoscopie...)

---

## 3. OPÉRATIONS DE MAINTENANCE

### 3.1 Opérations de Maintenance Corrective

| Opération | Définition | Nature |
|-----------|------------|--------|
| **Dépannage** | Actions physiques pour permettre à un bien en panne d'accomplir sa fonction **pour une durée limitée** | Provisoire |
| **Réparation** | Actions physiques pour **rétablir** la fonction requise d'un bien en panne | Définitif |

### 3.2 Opérations de Maintenance Préventive

**Inspections** : Contrôles de conformité réalisés en mesurant, observant, testant ou calibrant les caractéristiques significatives d'un bien. Réalisable avant, pendant ou après d'autres activités de maintenance. **Sans outillage spécifique**, sans arrêt obligatoire de la production.

**Visites** : Opérations de surveillance selon une périodicité déterminée. Comprennent une liste d'opérations définies préalablement qui peuvent entraîner des démontages d'organes et une immobilisation du matériel. Une visite peut entraîner une action corrective.

**Contrôles** : Vérifications de conformité par rapport à des données préétablies, suivies d'un jugement. Peut :
- Comporter une activité d'information
- Inclure une décision : acceptation, rejet, ajournement
- Déboucher sur des opérations de maintenance corrective

### 3.3 Autres Activités Liées à la Maintenance

| Activité | Description |
|----------|-------------|
| **Révision** | Ensemble d'examens, contrôles et interventions pour assurer le bien contre toute défaillance majeure ou critique pendant un temps ou nombre d'unités d'usage donné |
| **Échanges standards** | Reprise d'une pièce usagée, vente au même client d'une pièce identique neuve ou remise en état conformément aux spécifications constructeur (moyennant soulte) |
| **Rénovation** | Inspection complète, reprise dimensionnelle complète, remplacement des pièces déformées, vérification des caractéristiques, conservation des bonnes pièces |
| **Reconstruction** | Remise en l'état défini par le cahier des charges initial, remplacement des pièces vitales par des pièces d'origine ou équivalentes neuves |
| **Modernisation** | Remplacement d'équipements apportant, grâce à des perfectionnements techniques, une amélioration de l'aptitude à l'emploi |
| **Maintenance d'amélioration** | Renforcement de l'état d'un bien pour améliorer sa fiabilité et sa disponibilité |
| **Sécurité** | Méthodes visant à minimiser les conséquences des défaillances sur le personnel, le matériel et l'environnement |

---

## 4. NIVEAUX ET ÉCHELONS DE MAINTENANCE

### 4.1 Niveaux de Maintenance (1 à 5)

| Niveau | Description | Exécutant | Localisation | Outillage |
|--------|-------------|-----------|--------------|-----------|
| **1** | Réglages simples prévus par le constructeur, échange d'éléments accessibles en toute sécurité | Exploitant sur place — Personnel de production | Sur place | Outillage léger défini dans des procédures |
| **2** | Dépannage par échange standard d'éléments prévus à cet effet, opérations mineures de maintenance préventive (rondes) | Technicien habilité, sur place | Sur place | Outillage léger, pièces de rechange à proximité |
| **3** | Identification et diagnostic de panne, réparation par échange de composants fonctionnels, réparations mécaniques mineures | Technicien spécialisé, sur place ou en local de maintenance | Sur place ou local de maintenance | Outillage prévu + appareils de mesure, bancs d'essai |
| **4** | Travaux importants de maintenance corrective ou préventive | Équipe encadrée par technicien spécialisé | Atelier central | Outillage général + spécialisé, matériel d'essai |
| **5** | Travaux de rénovation, reconstruction ou réparations importantes | Équipe complète, polyvalente | Atelier central | Moyens proches de la fabrication par le constructeur |

### 4.2 Échelons de Maintenance (1 à 3)

| Échelon | Lieu de l'intervention |
|---------|----------------------|
| **1** | **Maintenance sur site** : intervention directement sur le matériel en place |
| **2** | **Maintenance en atelier** : matériel transporté dans un endroit approprié sur site |
| **3** | **Maintenance chez le constructeur ou société spécialisée** : transport pour opérations nécessitant des moyens spécifiques |

> **Attention** : Ne pas confondre **niveaux** (complexité de l'intervention) et **échelons** (lieu de l'intervention).

---

## 5. FIABILITÉ, MAINTENABILITÉ, DISPONIBILITÉ (FMD)

### 5.1 Le Concept de Fiabilité

**Définition (NF EN 13306 / NF X 50-500)** :
> Aptitude d'un bien à accomplir une fonction requise dans des conditions données pendant un temps donné. Ou : *"Caractéristique d'un bien exprimée par la probabilité qu'il accomplisse une fonction requise dans des conditions données pendant un temps donné."*

La notion de temps peut prendre la forme d'unités d'usage :
- **Nombre de cycles** → machine automatique
- **Distance parcourue** → matériel roulant
- **Tonnage produit** → équipement de production

La fiabilité s'applique à :
- **Systèmes réparables** : peuvent être remis en état après panne
- **Systèmes non réparables** : mis au rebut dès la panne

**Facteurs influençant la fiabilité** :

```
FIABILITÉ OPÉRATIONNELLE (sur le terrain)
├── Fiabilité prévisionnelle
├── Fiabilité d'exploitation
│   ├── Fiabilité de conduite
│   └── Fiabilité d'entretien
└── ← Alimentée par :
    ├── Fiabilité de conception (solutions retenues, qualité des études)
    ├── Fiabilité des composants (qualité des composants, tests de réception)
    └── Fiabilité de fabrication (qualité des méthodes, montage)
```

### 5.2 La Courbe en Baignoire (Taux de Défaillance)

Pour un équipement **réparable**, le taux de défaillance suit typiquement une **courbe en baignoire** avec **3 époques** :

```
λ (taux de défaillance)
│
│\                                  /
│  \                               /
│    \_____________________________/
│
└──────────────────────────────────── t
    Zone A     Zone B      Zone C
   (Jeunesse) (Maturité) (Vieillesse)
```

| Zone | Époque | Caractéristiques | Type de Maintenance à appliquer |
|------|--------|------------------|---------------------------------|
| **A** | Jeunesse / Mortalité infantile | Défaillances précoces, rodage, pré-usure, déverminage des composants électroniques. Taux de défaillance **décroissant** | **Maintenance Corrective** |
| **B** | Maturité / Vie utile | Période de rendement optimal. Taux de défaillance **constant**, défaillances aléatoires indépendantes du temps, sans dégradations préalables visibles | **Maintenance Préventive Systématique ou Conditionnelle** |
| **C** | Vieillesse / Obsolescence | Mode de défaillance prédominant généralement visible (usure mécanique, fatigue, érosion, corrosion). Taux de défaillance **croissant** | **Maintenance Préventive Conditionnelle ou Maintenance Amélioration** |

### 5.3 Calcul du Taux de Défaillance — MTBF

**Pendant la Zone B (maturité)**, le taux de défaillance est sensiblement constant → fiabilité caractérisée par la **MTBF**.

#### MTBF — Mean Time Between Failures
> Moyenne des temps de bon fonctionnement entre deux défaillances consécutives

$$\text{MTBF} = \frac{\sum TBF_i}{\text{Nombre de défaillances}}$$

**Exemple de calcul** :
Pour une presse, sur 4 ans, 10 pannes avec les TBF suivants (en jours) :
55, 26, 13, 80, 14, 21, 124, 35, 18, 26

$$\text{MTBF} = \frac{55+26+13+80+14+21+124+35+18+26}{10} = \frac{412}{10} = 41,2 \approx 41 \text{ jours}$$

#### Taux de Défaillance Moyen λ

$$\lambda_{moyen} = \frac{1}{\text{MTBF}}$$

Avec le MTBF = 41 jours :
$$\lambda_{moyen} = \frac{1}{41} \approx 0,02 \text{ panne/jour}$$

### 5.4 La Maintenabilité

**Définition (NF X 60-010)** :
> Dans les conditions d'utilisation données, la maintenabilité est l'aptitude d'un bien à être maintenu ou rétabli dans un état dans lequel il peut accomplir une fonction requise, lorsque la maintenance est accomplie dans des conditions données, avec des procédures et des moyens prescrits.

La maintenabilité caractérise la **facilité à remettre ou maintenir un bien en bon état de fonctionnement**.

**Facteurs influençant la maintenabilité** :

| Facteur | Éléments |
|---------|---------|
| **Lié à l'équipement** | Documentation, aptitude au démontage, facilité d'utilisation |
| **Lié au constructeur** | Qualité du SAV, facilité d'obtention des pièces, coût des pièces, conception |
| **Lié à la maintenance** | Préparation et formation du personnel, moyens adéquats, études d'améliorations |

**Amélioration de la maintenabilité** :
- Développer les documents d'aide à l'intervention
- Améliorer l'aptitude de la machine au démontage
- Améliorer l'interchangeabilité des pièces et sous-ensembles

#### MTTR — Mean Time To Repair
> Moyenne des Temps Techniques de Réparation

$$\text{MTTR} = \frac{\sum TTR_i}{\text{Nombre de réparations}}$$

**Exemple de calcul** :
Pour la même presse, TTR (en heures) pour 10 pannes :
2, 3, 1.5, 20, 5, 3, 2.5, 12, 1, 0.5

$$\text{MTTR} = \frac{2+3+1,5+20+5+3+2,5+12+1+0,5}{10} = \frac{50,5}{10} \approx 5 \text{ heures}$$

#### Taux de Réparation μ

$$\mu = \frac{1}{\text{MTTR}} = \frac{1}{5} = 0,2$$

### 5.5 La Disponibilité

**Définition (NF X 60-010)** :
> Aptitude d'un bien, sous les aspects combinés de sa **fiabilité, de sa maintenabilité et de l'organisation de la maintenance**, à être en état d'accomplir une fonction requise dans des conditions de temps déterminées.

Pour augmenter la disponibilité, on peut :
- **Allonger la MTBF** → action sur la **fiabilité**
- **Diminuer la MTTR** → action sur la **maintenabilité**

#### Calcul de la Disponibilité

**Disponibilité moyenne** :
$$D = \frac{\text{MTBF}}{\text{MTBF} + \text{MTTR}}$$

**Disponibilité Intrinsèque Di** (point de vue du concepteur — conditions idéales) :
$$Di = \frac{TBF}{TBF + TTR + TTE}$$

avec :
- TBF = Temps de Bon Fonctionnement
- TTR = Temps d'arrêts Techniques de Réparation
- TTE = Temps d'arrêts Techniques d'Exploitation

**Disponibilité du point de vue maintenance Dm** :
$$Dm = \frac{1}{1 + \frac{3}{1}}$$
(seule la carence des moyens de maintenance est prise en compte)

**Disponibilité Opérationnelle Do** (conditions réelles — point de vue utilisateur) :
$$Do = \frac{1}{1 + \frac{4}{1}}$$
(conditions réelles d'exploitation et de maintenance)

> **Di > Dm > Do** toujours

### 5.6 Décomposition Temporelle des États d'une Entité

Structure hiérarchique des temps (norme FEV 60) :

```
TEMPS TOTAL
├── TEMPS NON REQUIS
│   ├── Temps potentiel de disponibilité
│   └── Temps potentiel d'indisponibilité
└── TEMPS REQUIS
    ├── TEMPS EFFECTIF DE DISPONIBILITÉ
    │   ├── Temps de fonctionnement (bien accomplit la fonction requise)
    │   └── Temps d'attente/standby (apte mais non sollicité)
    └── TEMPS D'INCAPACITÉ
        ├── Temps d'incapacité pour causes extérieures
        │   (manque alimentation, MO, saturation pièces...)
        └── TEMPS D'INDISPONIBILITÉ
            ├── Temps d'indisponibilité après défaillance
            │   ├── Temps de non-détection de la défaillance
            │   ├── Temps d'appel de la maintenance
            │   └── Temps d'indisponibilité pour maintenance corrective
            │       ├── Temps de réparation (localisation, diagnostic, correction, contrôles)
            │       └── Temps annexes (administratifs, logistiques, techniques, préparation)
            ├── Temps d'indisponibilité pour maintenance préventive
            └── Temps d'indisponibilité pour contraintes d'exploitation
                (changement d'outil, contrôle produits, manque approvisionnement...)
```

### 5.7 Indicateurs Opérationnels FMD

| Sigle | Signification | Description |
|-------|--------------|-------------|
| **MTTF** | Mean Time To [First] Failure | Moyenne des temps avant la 1ère défaillance |
| **MTBF** | Mean Time Between Failures | Moyenne des temps entre 2 défaillances consécutives |
| **MTTR** | Mean Time To Repair | Temps moyen de réparation |
| **MDT** | Mean Down Time | Temps moyen d'indisponibilité (= MTI : temps moyen d'arrêt propre) |
| **MUT** | Mean Up Time | Temps moyen de disponibilité |

> **Attention aux approximations** : La MTBF en français correspond en fait au MUT. La MTTR correspond en fait au MDT. Ces approximations ne sont valables que si : MDT ≈ MTTR (temps d'attente très faibles) et MDT << MUT.

### 5.8 Méthodologie d'Étude de la Disponibilité

**Démarche recommandée** :
1. Définir la période d'observation
2. Relever tous les arrêts (nature, durée)
3. Calculer TBF, TTR pour chaque intervalle
4. Calculer MTBF, MTTR sur la période
5. Calculer Di, Dm, Do
6. Identifier les sous-ensembles pénalisants (analyse N/T, Pareto)
7. Définir les actions d'amélioration

---

## 6. LA TPM — TOTALE PRODUCTIVE MAINTENANCE

### 6.1 Objectifs

- Obtenir le **rendement maximal** des équipements
- Mettre en place une maintenance productive pour la **durée de vie totale** des équipements
- Améliorer la **productivité** des systèmes en impliquant l'exploitation ET la maintenance
- Impliquer la **participation de toute la hiérarchie**
- **Réduire les coûts** en augmentant la productivité sans réduire la qualité du produit
- Améliorer les performances de **l'ensemble de l'outil de production**

### 6.2 Les 8 Piliers de la Méthode

| Pilier | Objectif principal |
|--------|--------------------|
| **P1** | Améliorer l'organisation, la fiabilité des processus, méthodes et procédés utilisés |
| **P2** | Retrouver la fiabilité intrinsèque des équipements. Rendre les opérateurs responsables de la qualité de leurs équipements |
| **P3** | Améliorer la fiabilité et la maintenabilité des équipements. Développer la maintenance préventive. Diminuer les coûts de maintenance |
| **P4** | Comprendre le POURQUOI et le COMMENT de son travail. Participer à l'amélioration permanente de la performance |
| **P5** | Concevoir des produits faciles à fabriquer et des équipements faciles à utiliser et à maintenir |
| **P6** | Diminuer la dispersion des processus |
| **P7** | Fournir à la production les informations et supports nécessaires à sa performance. Améliorer l'efficacité interne de chaque service |
| **P8** | Zéro accident — Travail moins pénible, moins salissant, moins dangereux |

### 6.3 Les 6 Pertes — Sources d'Écarts de Performance

1. **Arrêts propres sur pannes** (temps de maintenance)
2. **Changements et arrêts induits** (opérations prévues par la production)
3. **Micro arrêts** (arrêts de quelques minutes)
4. **Ralentissements et marches dégradées**
5. **Défauts de qualité** (production de produits non conformes)
6. **Pertes au démarrage** (temps perdu lors d'un changement de production)

### 6.4 Calculs TRS selon Norme NF E 60-182

#### Décomposition des temps et taux

**Structure de calcul du TRS = A = B × C × D** :

| Variable | Nom | Formule | Description |
|---------|-----|---------|-------------|
| **F** | Temps de charge | F = H − I | Temps de travail normal H moins arrêts programmés I |
| **E** | Temps de marche | E = F − G | Temps de charge moins arrêts non programmés G |
| **B** | Taux de marche calendaire | B = E / F | |
| **J** | Taux d'allure | J = L / M | Temps de cycle théorique L / Temps de cycle réel M |
| **N** | Temps réel de fabrication | N = O × M | Production journalière O × temps de cycle réel M |
| **K** | Taux de marche net | K = N / E | |
| **C** | Taux de marche performante | C = J × K | |
| **S** | Quantité de produits conformes | — | |
| **D** | Taux de produits conformes | D = S / O | |
| **A** | **TRS — Taux de Rendement Synthétique** | **A = B × C × D** | |

#### Avantages du TRS

- Fournit des éléments **objectifs et chiffrés** sur les défaillances
- Permet de porter remède aux causes **sélectionnées** comme particulièrement pénalisantes
- Détecte de **nombreux petits arrêts** négligés car "habituels"
- Mesure l'**efficacité des actions** de maintenance engagées
- Détecte sur un équipement "stabilisé" toute **variation de performance significative** → permet de prévoir la dérive et la défaillance
- Chiffre la **fiabilité et la maintenabilité** → références pour l'installation de machines semblables (durées d'interventions, fréquences d'interventions systématiques, possibilité de maintenance conditionnelle sur les organes fragiles)

---

## 7. ASPECTS ÉCONOMIQUES DE LA MAINTENANCE

### 7.1 Coût de Revient d'un Produit

La maintenance contribue directement au coût de revient. Composantes :
- Salaires
- Charges sociales
- Maintenance
- Matières premières
- Énergies
- Outillages
- Investissement
- Locaux
- Marketing
- Administratif
- Études

**Objectif maintenance** : minimiser sa contribution au coût de revient tout en garantissant la disponibilité.

### 7.2 Les Coûts en Maintenance

**Problématique** : Justifier a priori une politique de maintenance préventive, en répondant à : *"Que coûte la défaillance d'un équipement ?"*

**Optimum de maintenance** : Il existe un optimum qui se situe à environ **94% de préventif et 6% de correctif** (en termes de coûts totaux).

### 7.3 Coûts de la Maintenance Corrective

#### Coûts Directs (Cd)

| Poste | Calcul |
|-------|--------|
| **Main d'œuvre** | Temps relevé (TTR) × Taux horaire maintenance |
| **Frais généraux du service maintenance** | Frais fixes / heures d'activité |
| **Possession des stocks, outillages** | Pertes et dépréciations dues au stockage |
| **Consommation de matières et fournitures** | Coût de factures fournisseurs |
| **Pièces de rechange** | Prix d'achat actualisé + transport + passation commande + magasinage + dépréciation |
| **Contrats de maintenance** | Montant négocié annuellement |
| **Travaux sous-traités** | Factures prestataires + taux de participation du service |

$$C_d = C_{main d'œuvre} + C_{pièces\ et\ consommables}$$

$$C_{main d'œuvre} = Temps \times Taux\ horaire\ de\ maintenance$$

#### Coûts Indirects (Ci) — Coûts d'Indisponibilité

Conséquences économiques d'un arrêt propre :
- **Perte de production** : temps d'indisponibilité × taux horaire de non-production
- **Coûts de la main d'œuvre de production** inoccupée pendant l'arrêt
- **Coûts d'amortissement** (non réalisé) du matériel arrêté
- **Coûts des arrêts induits** (flux tendu : saturation amont, pénurie aval)
- **Coûts des rebuts, non-qualité et délais non tenus**
- **Frais de redémarrage** de production
- **Coûts induits en cas d'accident corporel**

$$C_{indisponibilité} = Temps\ d'arrêt\ \times\ Taux\ horaire\ d'indisponibilité$$

#### Coût Total d'une Défaillance

$$C_D = C_d + C_i = (C_{MO} \times MTTR) + (C_{indisponibilité} \times MDT)$$

**Pour une période avec n interventions** :
$$C_{défaillance\ période} = n \times C_{défaillance\ intervention}$$

### 7.4 Coûts de la Maintenance Préventive Systématique

$$CT_{systématique} = C_M + C_p$$

avec :
- $C_M$ = coûts de maintenance (MO + pièces)
- $C_p$ = coûts de perte de production (souvent = 0 si hors temps requis)

Pour n interventions par période :
$$TM_{période} = n \times TM_{intervention}$$

### 7.5 Coûts de la Maintenance Préventive Conditionnelle

$$CT_{conditionnelle} = C_{surveillance} + C_{remise\ en\ état}$$

$$TM_{période} = m \times T_{surveillance} + n \times TR_{remise\ en\ état}$$

### 7.6 Comparaison et Choix d'un Type de Maintenance

Le choix dépend :
- Du **coût total de la solution** par période
- De la **rentabilité de l'investissement** (achat et installation de matériels de surveillance)

### 7.7 Le Coût du Cycle de Vie (LCC — Life Cycle Cost)

**Définition** : Cumul, par années successives, de **toutes les dépenses relatives à la possession d'un équipement**.

$$LCC = C_{acquisition} + C_{exploitation} + C_{défaillance} + C_{fin\ de\ vie} - V_{revente}$$

avec :
- **C_acquisition** : achat, installation, formation
- **C_exploitation** : personnel, énergie, production
- **C_défaillance** : calculé par le service maintenance
- **C_fin de vie** : démantèlement
- **V_revente** : valeur de revente (en déduction)

> **Fait important** : On considère que **90% des coûts de fonctionnement et de maintenance** générés par l'exploitation d'un équipement sont **prédéterminés lors de sa mise en service**. → La notion de "coût du service rendu" doit se substituer au "coût d'acquisition" lors des choix d'investissement.

**Courbe LCC et date optimale de remplacement** :
- [T, t1] : période d'études et production
- [t1, t2] : exploitation déficitaire
- [t2, t4] : zone d'exploitation rentable
- t3 = date optimale de revente (tangente au LCC passant par l'origine → profit maximum)

**Actualisation des coûts** :
$$C_{actualisé} = \frac{C_{prévu\ dans\ n\ années}}{(1+i)^n}$$

avec i = taux d'inflation annuel.

### 7.8 Rentabilité d'un Investissement — Délai de Retour

Pour tout investissement en maintenance d'amélioration :
$$\text{Délai de retour} = \frac{\text{Coût investissement}}{\text{Gain annuel}}$$

Condition : Délai de retour < délai accepté par l'entreprise (en général 2-3 ans).

---

## 8. INDICATEURS ET TABLEAUX DE BORD

### 8.1 Définitions

- **Indicateur** : Chiffre significatif d'une situation économique pour une période donnée
- **Tableau de bord** : Ensemble d'informations traitées et mises en forme pour caractériser l'état et l'évolution d'une situation donnée

### 8.2 Qualités d'un Indicateur

| Qualité | Description |
|---------|-------------|
| **Pertinence** | Permet l'interprétation facile du phénomène et la prise de décision efficace |
| **Fidélité** | Image sans distorsion du phénomène |
| **Justesse et stabilité** | Image exacte (centrée) et stable (renouvelable) |
| **Précision et sensibilité** | Variations significatives reflétées par des variations lisibles |
| **Consolidation** | Possibilité d'agréger, cumuler ou synthétiser |
| **Aide à la communication** | Facilite le dialogue entre populations de préoccupations différentes |

### 8.3 Ratios Normalisés (NF X 60-020)

#### Indicateurs de Performance Générale

| Ratio | Formule | Interprétation |
|-------|---------|---------------|
| r1 | Coûts maintenance / Valeur du bien | Évaluation des exigences économiques — comparaisons inter-entreprises |
| r2 | Coûts maintenance / Valeur ajoutée produite | Comparaisons inter-entreprises |
| r3 | Coûts maintenance / CA production | Indicateur financier |
| r4 | Coûts maintenance / Quantité produite | Mesure évolution coûts à court terme |
| r5 | (Coûts maint. + Coûts indisponibilité) / CA | Indicateur efficacité économique de la maintenance |
| r6 | Coûts défaillance / (Coûts maint. + Coûts défaillance) | Indicateur efficacité technique de la maintenance |

#### Indicateurs d'Analyse des Coûts

| Ratio | Formule | Interprétation |
|-------|---------|---------------|
| r8 | Coûts maint. sous-traitée / Coûts totaux maint. | |
| r9 | Coûts maint. préventive / (maint. prév. + corrective) | Importance relative des coûts de maintenance préventive |
| r10 | Coût maintenance / Coût remplacement | Indicateur de décision de remplacement |

#### Indicateurs de Suivi des Activités

| Ratio | Formule | Interprétation |
|-------|---------|---------------|
| r15 | Temps actifs maintenance / Temps effectif disponibilité | Anticipation des charges |
| r16 | Temps actifs maint. conditionnelle / Temps actifs maint. préventive | Importance de la maint. conditionnelle |
| r17 | Temps actifs maint. corrective / Temps actifs maintenance | Importance de la maint. corrective |

#### Indicateurs de Performance et Exploitation

| Ratio | Formule | Interprétation |
|-------|---------|---------------|
| r22 | Temps effectif de disponibilité / Temps requis | Disponibilité opérationnelle |
| r23 | Temps de fonctionnement / Temps effectif disponibilité | Taux d'utilisation = TRS |
| r24 | Temps de bon fonctionnement / Temps requis | Comparaison des performances d'exploitation |
| r28 | Σ Temps de bon fonctionnement / Nb de défaillances | **MTBF** |
| r29 | Σ Temps actifs maint. corrective / Nb de défaillances | **MTTR** |

### 8.4 Méthode ABC — Analyse de Pareto (80/20)

**Principe** : Méthode de choix permettant de déceler, entre plusieurs problèmes, ceux qui doivent être abordés en priorité.

**Loi de Pareto** (économiste italien, 1848-1923) : *20% des causes représentent 80% des effets.*

Applications en maintenance :
- 20% des systèmes représentent 80% des pannes
- 20% des interventions représentent 80% des coûts de maintenance
- 20% des composants représentent 80% de la valeur des stocks

**Méthodologie** :
1. Définir l'objectif de l'étude et ses limites
2. Choisir le **critère de classement** (coûts, temps, rebuts...)
3. Trier les données par ordre **décroissant** du critère
4. **Cumuler** le critère et calculer les **% cumulés**
5. Tracer la **courbe ABC**
6. **Déterminer les zones ABC** : Zone A (la plus pénalisante), Zone B, Zone C
7. Interpréter et proposer des solutions

### 8.5 Analyse en N/T

Outil dédié à l'analyse FMD des équipements. Trace **3 graphes** pour les mêmes familles de défaillances :

| Graphe | Ordonnée | Ce qu'il mesure | Ce qu'il permet de déterminer |
|--------|----------|-----------------|-------------------------------|
| **N×T** | N × MTTR = TTR cumulé | **Non disponibilité** | Familles qui pénalisent le plus la disponibilité (classement par criticité décroissante) |
| **N** | Nombre de pannes N | **Non fiabilité** | Familles qui tombent le plus souvent en panne |
| **T = MTTR** | Durée moyenne d'intervention | **Non maintenabilité** | Familles avec la MTTR la plus élevée |

**Les abscisses** sont ordonnées par criticité décroissante sur le 1er graphe (N/T).

---

## 9. ORDONNANCEMENT DES ACTIVITÉS DE MAINTENANCE

### 9.1 Terminologie

| Terme | Définition |
|-------|------------|
| **Capacité de charge** | Nombre d'heures de travail possible pour une équipe sur l'horaire normal |
| **Charge** | Somme des temps alloués pour une période et une équipe |
| **Tâche** | Intervention caractérisée par une durée propre estimée par les méthodes |
| **Projet** | Ensemble de tâches (ex : révision annuelle d'un process) |
| **Chemin critique** | Ensemble des tâches "en série" conditionnant la durée totale du projet |
| **Délai** | Contrainte technique ou commerciale s'appliquant à l'achèvement d'une tâche |

### 9.2 Les 5 Niveaux d'Ordonnancement

| Niveau | Horizon | Objet |
|--------|---------|-------|
| 1 | 1 à 5 ans | Prévisions à long terme — Plan de charge — Direction |
| 2 | 1 à 12 mois | Prévisions à moyen terme — Bureau d'ordonnancement — Planning mensuel |
| 3 | Court terme | Lancement — Mise à disposition des matières et outillages |
| 4 | Futur immédiat | Répartition du travail — Mise en main au chef d'équipe |
| 5 | Continu | Contrôle de l'avancement — Respect des délais |

### 9.3 Planification par Diagramme de GANTT

Outil visualisant la succession des tâches avec une représentation temporelle.

**Construction** :
1. Identifier et structurer la liste des tâches
2. Estimer durées et ressources (même unité de temps)
3. Réaliser le réseau logique (antécédences et successions)
4. Tracer le diagramme (ordonnée : tâches, abscisse : temps)

**Avantages** : Visualisation claire, anticipation des commandes de matériel, gestion des conflits de ressources, outil de communication.

> **Note importante** : Le chemin critique peut évoluer en fonction des avancement/retards — mise à jour régulière indispensable.

### 9.4 Méthode ABACABAD — Maintenance Préventive

Méthode de planification des visites périodiques avec des niveaux de périodicité imbriqués.

**Principe** : La visite la plus importante est affectée de la période P. Les visites intermédiaires sont organisées au terme de périodes sous-multiples P/2, P/4, etc.

**Exemple** :
| Catégorie | Interventions | Périodicité |
|-----------|--------------|-------------|
| A | Liste 1 | 1000 h |
| B | Listes 1+2 | 2000 h |
| C | Listes 1+2+3 | 4000 h |
| D | Listes 1+2+3+4 | 8000 h |

Planification : A - B - A - C - A - B - A - D - A - B - A - C...

### 9.5 Méthode PERT

**P.E.R.T.** = Programme Evaluation and Review Technic (technique d'ordonnancement et de contrôle des programmes).

> Méthode consistant à mettre en ordre sous forme de réseau plusieurs tâches qui, grâce à leur dépendance et à leur chronologie, concourent toutes à l'obtention d'un produit fini.

**Concepts clés** :
- **Date au plus tôt** : date à laquelle on peut commencer les tâches débutant par une étape
- **Date au plus tard** : date à laquelle doivent être finies les tâches menant à une étape
- **Marge** = Date au plus tard − Date au plus tôt
- **Chemin critique** : ensemble des étapes avec **marge nulle** (aucun retard possible)

---

## 10. GESTION DES PIÈCES DE RECHANGE

### 10.1 Constitution du Stock Maintenance

> Ensemble des articles stockés nécessaires à la réalisation optimale de la fonction maintenance dans les meilleures conditions de délais, de coûts et de sécurité (NF X 60-000).

**Classes d'articles** :
- **Consommables** : fusibles, joints, visserie, huiles
- **Pièces de rechange** : capteurs, moteurs, courroies, roulements, vérins
- **Outillages classiques** : outillage courant, équipements de graissage, appareils de mesure
- **Outillages spéciaux** : engins de levage, caméra de thermographie infrarouge, **analyseur vibratoire**

### 10.2 Éléments du Coût de Gestion

| Composante | Description |
|------------|-------------|
| **Coût de passation de commande** (acquisition) | Varie avec le nombre de commandes — génère des coûts dans les services achats, gestion stocks, réception, comptabilité |
| **Coût des matériels achetés** | Quantité commandée/an × coût unitaire |
| **Coût de possession** | Taux de possession × valeur du stock moyen = capital immobilisé + frais de stockage |

### 10.3 Formule de WILSON — Quantité Économique de Commande

**Paramètres** :
- K = consommation annuelle prévisionnelle
- Q = quantité commandée à chaque réapprovisionnement
- Pu = prix d'achat unitaire
- i = taux de possession
- Ca = coût d'acquisition unitaire

**Coût total annuel** :
$$CT = K \cdot Pu + \frac{K}{Q} \cdot Ca + \frac{Q}{2} \cdot Pu \cdot i$$

**Minimisation** (dCT/dQ = 0) → **Formule de WILSON** :

$$Q_e = \sqrt{\frac{2K \cdot Ca}{Pu \cdot i}}$$

**Nombre optimal de commandes** :
$$N = \frac{K}{Q_e}$$

**Durée entre commandes** :
$$T_0 = \frac{12 \cdot Q_e}{K} \text{ (en mois)}$$

### 10.4 Méthodes de Gestion des Stocks

| Mode de gestion | Quantités commandées | Temps entre commandes |
|-----------------|---------------------|----------------------|
| **Point de commande** | Fixes (= Qe) | Variables (selon consommation) |
| **Plan d'approvisionnement** | Variables | Fixes |
| **Programme d'approvisionnement** | Fixes | Fixes |
| **Pièces de sécurité** | Variables | Variables |

#### Point de Commande (méthode la plus courante — 80% des pièces)

$$Sa = Cd + Ss$$

- **Sa** = stock d'alerte
- **Cd** = consommation moyenne pendant le délai d'approvisionnement d
- **Ss** = stock de sécurité

**Sortie normale (loi normale)** :
$$Sa = C \cdot d + k \cdot \sigma \cdot \sqrt{d}$$

avec k = nombre d'écarts types selon le risque de rupture accepté (k = 1,65 pour risque 5%).

**Sortie aléatoire (loi de Poisson)** pour pièces à faible rotation :
$$P(x \leq k) = \sum_{x=0}^{k} \frac{e^{-M} \cdot M^x}{x!}$$

avec M = m × d (consommation moyenne × délai).

---

## 11. EXTERNALISATION DES ACTIVITÉS DE MAINTENANCE

### 11.1 Pourquoi Sous-Traiter ?

| Motivation | Raisons |
|------------|---------|
| **Sociale** | Spécialités difficiles à recruter, plans de carrière complexes à mettre en place |
| **Économique** | Surcharges ponctuelles, entreprises extérieures mieux équipées (thermographie IR, maintenance ponts roulants), travaux très spécialisés difficilement amortissables (rebobinages, soudures spéciales) |
| **Stratégique** | Rentabilité à court et long terme — une apparente rentabilité à court terme peut être désastreuse à long terme |

### 11.2 Ce qu'il Faut Sous-Traiter

**À sous-traiter** :
- Modifications importantes d'équipements (rénovations, maintenance améliorative importante)
- Révisions générales
- Niveaux 4 et 5 de maintenance
- Remises en état par échanges standards dans domaines pointus
- Maintenance des équipements périphériques (ascenseurs, réseaux téléphoniques, climatisation)
- Entretien général (génie civil, bâtiments, plomberie)

**À éviter de sous-traiter** :
- La maintenance corrective, préventive systématique et améliorative de l'outil de production

### 11.3 Combien Sous-Traiter ?

- **Pétrochimie** : 50 à 75% de la maintenance est sous-traitée
- **Industrie classique** : 15 à 35% du budget maintenance

Ratio de suivi : $r8 = \frac{Coûts\ maint.\ sous-traitée}{Coûts\ totaux\ de\ maintenance}$

### 11.4 Le Contrat de Maintenance

**3 parties obligatoires** :
1. **Clauses techniques** : nature des opérations, volumes, qualifications, ou résultats attendus (cadences, disponibilité, taux de panne)
2. **Clauses juridiques** : hygiène et sécurité, législation sociale, protection des travailleurs
3. **Clauses financières** : dépendent du type de contrat

---

## 12. GESTION DES INTERVENTIONS DE MAINTENANCE

### 12.1 Maintenance Corrective — Démarche de l'Intervention

Le technicien arrivé sur le site entreprend une démarche en **4 fonctions** :

```
Localiser → Diagnostiquer → Corriger → Essayer/Tester
```

| Étape | Définition |
|-------|------------|
| **Localiser** | Action conduisant à rechercher précisément la ou les pièces par lesquelles la défaillance se manifeste (= dépistage) |
| **Diagnostiquer** | Action conduisant à identifier la ou les causes probables de la défaillance à l'aide d'un raisonnement logique fondé sur un ensemble d'informations |
| **Corriger** | Application du remède identifié |
| **Essayer/Tester** | Vérification du bon fonctionnement du système après correction |

Après les tests → rédaction d'un **rapport d'intervention** pour compléter l'historique de la machine.

### 12.2 La GMAO — Gestion de Maintenance Assistée par Ordinateur

**Définition** : Logiciel spécialisé facilitant la réalisation des missions d'un service maintenance. Outil de gestion, pilotage, traçabilité, analyse et aide à la décision.

**Objectifs** :

| Objectif | Moyens GMAO |
|----------|-------------|
| Améliorer disponibilité et fiabilité | Analyse des défaillances, historiques, méthodes de travail |
| Optimiser les coûts | Analyse des coûts, automatisation de tâches |
| Optimiser les pièces de rechange | Réduire temps d'attente, optimiser coûts de stockage |
| Piloter la maintenance | Tableaux de bord automatiques |
| Améliorer la sécurité | Consignes attachées à l'équipement, gestion des consignations |
| Répondre à l'assurance qualité | Historique = traçabilité |
| Communiquer avec les autres services | Interfaces Comptabilité, Achats, RH, Production, Qualité |

---

## 13. GAMMES DE DÉMONTAGE / REMONTAGE

### 13.1 Introduction

Deux catégories de démontage :
- **Total** : lors d'une révision complète
- **Partiel/ciblé** : pour remplacer un composant défectueux (objectif = déposer le minimum de pièces)

### 13.2 Méthodologie de Démontage

1. Étudier le **dessin d'ensemble**
2. Localiser l'élément à démonter (démontage partiel)
3. Rechercher les **éléments de liaison** (vis, goupilles...)
4. Repérer les sous-ensembles indépendants
5. Établir la **gamme de démontage**
6. Repérer la position des pièces entre elles si nécessaire
7. Utiliser les **outils appropriés**

### 13.3 Séquence DÉPOSE → DÉSOLIDARISER → DÉMONTAGE

**DÉPOSE** :
1. Identifier les liaisons (fixations, fluidiques, électriques, commandes mécaniques)
2. Déconnecter les liaisons
3. Assujettir aux moyens de manutention
4. Désolidariser le sous-ensemble de son ensemble

**DÉMONTAGE** :
1. Identifier les liaisons
2. Supprimer les liaisons dans l'ordre requis
3. Désassembler dans l'ordre requis

### 13.4 Vocabulaire Clé

| Terme | Signification |
|-------|--------------|
| Vidanger | Vider les produits de lubrification usés |
| Nettoyer | Ôter les impuretés |
| Repérer | Marquer par légers coups de pointeau la position des éléments |
| Dévisser | Libérer un élément fileté sans le déposer |
| Déposer | Retirer et poser sur un support |
| Chasser | Pousser avec outil approprié hors du logement |
| Extraire | Utiliser un extracteur |
| Engager | Replacer un élément sur un arbre ou dans un logement (remontage) |
| Bloquer | Amener l'élément fileté en contact et l'immobiliser au couple de serrage |
| Régler | Mettre au point le fonctionnement |
| Essayer | Faire fonctionner pour parfaire les réglages |
| Contrôler | Vérifier ou mesurer les performances |

> **Règle** : En début de gamme de démontage, écrire la **PROCÉDURE DE CONSIGNATION**. En fin de gamme de remontage, écrire la **PROCÉDURE DE DÉCONSIGNATION**.

---

## 14. CONSIGNATION / DÉCONSIGNATION

### 14.1 Introduction

Des machines mises à l'arrêt pour intervention sont à l'origine d'accidents du travail aux conséquences souvent graves, dus au contact avec :
- Pièces nues sous tension électrique
- Produits chimiques dangereux
- Organes mécaniques effectuant un mouvement imprévu
- Fluides sous pression

**Dans la majorité des cas** : la victime se croyait en sécurité, mais la consignation s'est avérée incomplète.

### 14.2 Définitions

**CONSIGNATION** : Ensemble des dispositions permettant de mettre et de maintenir en sécurité une machine ou installation de façon qu'un changement d'état soit **impossible sans l'action volontaire de tous les intervenants**.

**DÉCONSIGNATION** : Ensemble des dispositions permettant de remettre en état de fonctionnement une installation préalablement consignée, en assurant la sécurité.

### 14.3 Procédure de Consignation — 4 Phases Indissociables

| Phase | Objet | Détail |
|-------|-------|--------|
| **1. SÉPARATION** | Coupure de l'énergie | Pleinement apparente (vue directe ou asservissement fiable) |
| **2. CONDAMNATION** | Verrouillage par dispositif matériel | Cadenas personnalisé par intervenant — clés non spécifiques à proscrire |
| **3. DISSIPATION / RÉTENTION** | Élimination des énergies résiduelles | Décharge condensateurs, vidange, purge, équilibrage mécanique |
| **4. VÉRIFICATION** | S'assurer de l'absence de risque résiduel | Absence de tension (VAT), pression, mouvement |
| **(+ Signalisation)** | Information claire et permanente | Nom du chargé de consignation, date, heure |

### 14.4 Risque Électrique

- Séparation pleinement apparente (vue directe des contacts, ou asservissement fiable)
- Vérification avec VAT normalisé (NFC 18-310 ou 18-311) — jamais voltmètre ou tournevis testeur
- MALT + CCT obligatoires à partir de 500V (fortement recommandés en dessous)
- Condamnation : cadenas — 3 cadenas selon la norme (technicien maintenance, responsable production, directeur du site)

### 14.5 Risque Chimique

- Séparation efficace : 2 vannes fermées + purge intermédiaire ouverte (et condamnée ouverte)
- Alternative : vanne 3 voies, joint plein, bride pleine + manchette démontée
- ⚠️ **Une seule vanne fermée est INSUFFISANTE** (risque de fuite)

### 14.6 Risque Mécanique

Énergies à maîtriser : hydraulique, pneumatique, électrique, cinétique (volant d'inertie), potentielle (pesanteur, câble, ressort).

- Cinétiques : arrêt de toutes les pièces en mouvement
- Potentielles : équilibre stable (point mort bas) ou calage mécanique
- Hydrauliques : mise à la bâche des accumulateurs
- Pneumatiques : mise à l'air libre des accumulateurs

### 14.7 Procédure de Déconsignation

**Ordre inverse de la consignation** :
1. Prévenir l'environnement de la remise en énergie — s'assurer que les zones à risques sont inoccupées et dégagées
2. Libérer les organes de séparation
3. Remettre le système en énergie (progressivement si possible)
4. Vérifier le bon fonctionnement du système

---

## 15. OUTILS D'ANALYSE DES DÉFAILLANCES

### 15.1 Définitions (NF EN 13306)

| Terme | Définition |
|-------|------------|
| **Défaillance** | Altération ou cessation de l'aptitude d'un bien à accomplir la fonction requise |
| **Cause de défaillance** | Circonstances liées à la conception, fabrication, installation, utilisation et maintenance ayant conduit à la défaillance |
| **Mécanisme de défaillance** | Processus physiques, chimiques ou autres ayant conduit à la défaillance |
| **Mode de défaillance** | Effet par lequel une défaillance se manifeste |
| **Panne** | État d'un bien inapte à accomplir une fonction requise |
| **Dégradation** | Évolution irréversible des caractéristiques liée au temps ou à la durée d'utilisation |

### 15.2 Modèles de Défaillance

| Modèle | Caractéristique | Exemples |
|--------|----------------|---------|
| **Défaillance progressive** | Dégradation progressive du niveau de performance — TTF (Time To Failure) connu | Usure de pièces mécaniques |
| **Défaillance catalectique** | Soudaine et brutale | Composants électriques |

### 15.3 Mécanismes d'Usure

L'usure est une conséquence du frottement → émission de débris avec perte de cotes, de formes et de poids.

**Loi d'usure** = f(temps). La connaissance de la loi d'usure permet d'intervenir avant un seuil prédéterminé :
- **Seuil d'alerte** (ta) : antérieur au seuil limite d'un temps équivalent au délai nécessaire avant intervention
- **Seuil limite** (ti) : limite après laquelle la défaillance survient

### 15.4 Diagramme Causes/Effets — ISHIKAWA

**Outil** permettant de visualiser et identifier de façon ordonnée les causes possibles d'un effet constaté.

Aussi appelé : diagramme en arête de poisson, arbre des causes, diagramme d'Ishikawa.

**Construction** :
1. Placer une flèche horizontale pointée vers le problème (EFFET)
2. Regrouper les causes potentielles en familles (C1, C2, C3...)
3. Tracer les flèches secondaires correspondant aux familles
4. Chaque flèche secondaire identifie une famille de causes
5. Inscrire sur des mini-flèches les causes rattachées à chaque famille

**Familles de causes typiques (5M)** : Milieu, Documentation, Organisation, Hommes, Technique.

### 15.5 Tableau Causes / Effets

Aide au diagnostic rapide. Structure :

| Conditions/Symptômes | Causes probables | Remèdes/Préconisations |
|---------------------|-----------------|----------------------|
| La broche chauffe | Mauvaise arrivée d'huile | Nettoyer le filtre |

### 15.6 Arbres de Défaillance

Représentation graphique des **combinaisons possibles d'événements** permettant la réalisation d'un événement indésirable prédéfini.

**Principe** : À partir d'un événement redouté défini a priori, déterminer les enchaînements d'événements ou combinaisons pouvant y conduire, en remontant jusqu'aux événements de base.

**Portes logiques** : ET (les deux événements doivent survenir) / OU (l'un ou l'autre suffit).

---

## 16. AMDEC

### 16.1 Définition

**AMDEC** = **A**nalyse des **M**odes de **D**éfaillance, de leurs **E**ffets et de leur **C**riticité.

Outil d'analyse permettant de construire la qualité des produits/services et de favoriser la maîtrise de la fiabilité. Régi par la norme F 60-510.

**Trois types** :
- **AMDEC Produit** : analyse de la conception → qualité et fiabilité prévisionnelle (BET)
- **AMDEC Processus** : analyse des opérations de production → qualité de production (Bureau des méthodes)
- **AMDEC Machine/Moyen de production** : analyse du fonctionnement du moyen → disponibilité, fiabilité, maintenabilité et sécurité (Service maintenance)

**Objectif principal en maintenance** : Aboutir à l'établissement de **plans de maintenance préventive**.

### 16.2 Démarche de Mise en Œuvre

**Étape 1 — Initialisation** :
1. Définir le système à étudier
2. Définir la phase de fonctionnement
3. Définir les objectifs
4. Constituer le groupe de travail
5. Établir le planning
6. Mettre au point les supports de l'étude

**Étape 2 — Décomposition Fonctionnelle** :
7. Découper le système
8. Identifier les fonctions des sous-ensembles
9. Identifier les fonctions des éléments

**Étape 3 — Analyse AMDEC** :
Phase 3a — Analyse des mécanismes de défaillance :
10. Identifier les modes de défaillance
11. Rechercher les causes
12. Rechercher les effets
13. Recenser les détections

Phase 3b — Évaluation de la criticité :
14. Estimer le temps d'intervention
15. Évaluer les critères F, N, G
16. Calculer la criticité C

Phase 3c — Actions correctives :
17. Rechercher les actions correctives
18. Calculer la nouvelle criticité

**Étape 4 — Synthèse** :
19. Hiérarchiser les défaillances
20. Liste des points critiques
21. Liste des recommandations

### 16.3 Modes de Défaillance

4 façons génériques de ne pas réaliser une fonction :

| Mode | Description |
|------|-------------|
| **Plus de fonction** | La fonction cesse de se réaliser |
| **Pas de fonction** | La fonction ne se réalise pas lorsqu'on la sollicite |
| **Fonction dégradée** | La fonction ne se réalise pas parfaitement |
| **Fonction intempestive** | La fonction se réalise lorsqu'elle n'est pas sollicitée |

**Liste des modes génériques** : 33 modes référencés (rupture structurelle, blocage, vibrations, fuite interne/externe, ne s'ouvre pas, ne se ferme pas, court-circuit, circuit ouvert, fonctionnement intempestif, etc.)

### 16.4 Causes de Défaillance

**3 types** :
- **Causes internes** au matériel (vieillissement, mort subite, colmatage, fuites, états de surface, fatigue...)
- **Causes externes dues à l'environnement/milieu** (température, pollution poussière/huile/eau, vibrations, échauffement local, chocs...)
- **Causes externes dues à la main d'œuvre** (conception, montage, réglages, contrôle, mise en œuvre, utilisation, manque d'énergie...)

### 16.5 Criticité d'une Défaillance

$$C = F \times N \times G$$

**Critères d'évaluation** :

| Critère | Cotation | Valeur |
|---------|---------|--------|
| **F — Fréquence** | 1 | Max 1 défaillance/an |
| | 2 | Max 1 défaillance/trimestre |
| | 3 | Max 1 défaillance/mois |
| | 4 | Max 1 défaillance/semaine |
| **N — Non Détection** | 1 | Visite par opérateur |
| | 2 | Détection aisée par agent de maintenance |
| | 3 | Détection difficile |
| | 4 | Indécelable |
| **G — Gravité** | 1 | Pas d'arrêt de production |
| | 2 | Arrêt ≤ 1 heure |
| | 3 | 1 heure < arrêt ≤ 1 jour |
| | 4 | Arrêt > 1 jour |

**Niveaux de criticité et actions** :

| Criticité C | Niveau | Actions correctives |
|------------|--------|---------------------|
| 1 ≤ C < 10 | Négligeable | Aucune modification — Maintenance corrective |
| 10 ≤ C < 20 | Moyenne | Amélioration des performances — Maintenance préventive systématique |
| 20 ≤ C < 40 | Élevée | Révision conception du sous-ensemble — Surveillance particulière, maintenance préventive conditionnelle/prévisionnelle |
| 40 ≤ C < 64 | Interdite | Remise en cause complète de la conception |

### 16.6 AMDEC et Disponibilité

**Démarche itérative** :
```
Définition des objectifs de disponibilité Dob
→ Calcul de la disponibilité opérationnelle Dop
→ Si Dop < Dob :
   Recherche du matériel critique
   → Constitution du groupe de travail AMDEC
   → AMDEC
   → Hiérarchisation des modes de défaillance
   → Recherche d'actions correctives
   → Mise en œuvre des actions préconisées
   → [retour au début]
```

---

## 17. OUTILS DE LA MAINTENANCE CONDITIONNELLE

### Pourquoi des Outils d'Aide au Diagnostic ?

**Objectif principal** : Permettre, **sans arrêter la production**, de suivre l'état de bon fonctionnement des installations.

**Attentes** :
- Optimiser la maintenance (bonne opération au bon moment)
- Suivre l'évolution d'une anomalie caractérisée
- Garantir la qualité des produits fabriqués

**Précautions nécessaires** :
1. Réaliser préalablement une **analyse de défaillances** fouillée (risques, gravité, criticité)
2. Comparer le **coût de mise en œuvre** avec le **coût des défaillances** évitées
3. Identifier les **symptômes annonçant** une défaillance
4. Envisager l'**approche multi-technique** (plusieurs outils pour un diagnostic fiable)

**Taux d'utilisation** des techniques (industrie) :

| Technique | Utilisation |
|-----------|------------|
| Analyse vibratoire | 72% |
| Analyse des huiles | 75% |
| Thermographie infrarouge | 71% |
| Analyse du courant des moteurs électriques | 68% |
| CND par ultrasons (mesure épaisseur) | 58% |
| CND par ressuage | 48% |

---

### 17.1 ANALYSE VIBRATOIRE

> **Section centrale pour les ingénieurs et opérateurs en analyse vibratoire**

#### 17.1.1 Contexte et Positionnement

L'analyse vibratoire est la technique de maintenance conditionnelle/prévisionnelle la plus utilisée pour les **machines tournantes**. Elle permet de mettre en évidence :
- **Balourds** (déséquilibres de masse)
- **Désalignements** (mauvais alignement des accouplements)
- **Défauts de roulements** (billes, pistes, cages)
- **Tourbillons de fluides** (instabilités hydrodynamiques)
- **Déséquilibres électriques** (moteurs électriques)
- **Résonances** (modes propres des structures)
- Et tout défaut se manifestant par une **modification de la signature vibratoire**

#### 17.1.2 Mise en Place d'une Surveillance Vibratoire — Choix Préalables

**1. Sélection des machines à surveiller**
Critères de sélection (par ordre de priorité) :
- **Criticité** sur la sûreté de fonctionnement (sécurité, disponibilité)
- Absence de **redondance** (pas de machine de remplacement)
- Considérations **économiques** (coûts directs et indirects de défaillance)
- Retour d'expérience (historiques de pannes)

**2. Sélection des composants et défaillances potentielles**
- Évaluation des risques par retour d'expérience (historiques)
- Identification de la gravité des défaillances potentielles

**3. Identification des symptômes annonçant la défaillance**
- Quels paramètres vibratoires varient avant la défaillance ?
- À quelle fréquence les signatures apparaissent-elles ?

**4. Choix de la méthode de surveillance**
- **Suivi périodique (off-line)** : mesures ponctuelles lors de tournées
- **Suivi continu (on-line)** : capteurs fixes, acquisition permanente

**5. Sélection des capteurs**
Principalement les **accéléromètres**.

**6. Sélection de l'instrumentation associée**

#### 17.1.3 Suivi Périodique (off-line) — Matériels Portatifs

| Type d'appareil | Fonctions | Utilisateurs | Coût indicatif |
|----------------|-----------|-------------|---------------|
| **Contrôleurs de roulements** | Surveillance état mécanique des roulements à billes et à rouleaux. Mesures ponctuelles | Opérateurs mécaniciens non-spécialistes | < 1,5 k€ |
| **Contrôleurs de roulements et de vibrations** | + mesure amplitude globale des vibrations. Certains avec lecture directe, d'autres raccordables à un PC (suivi des tendances, alarmes) | Opérateurs mécaniciens avec formation de base sur les vibrations | 2,3 à 3,8 k€ |
| **Collecteurs contrôleurs** | + mémorisation des données + programmation de séries de relevés (routes/tournées). Déchargement dans PC avec logiciel de suivi d'état et seuils d'alarme | Opérateurs mécaniciens avec formation sérieuse sur les vibrations | 3,8 à 5,34 k€ (+logiciel optionnel 1,52 à 2,29 k€) |
| **Collecteurs-analyseurs monovoie** | + fonctions d'analyses des signaux vibratoires + logiciel PC complet (nombreuses fonctions de présentation, aide au diagnostic). Équilibrage in situ possible | Solide formation vibrations + expérience plusieurs années | 9,15 à 15,24 k€ (logiciel inclus) |
| **Collecteurs-analyseurs bivoies** | Véritables analyseurs portatifs — gammes d'analyses très détaillées, nombreuses procédures de traitement des signaux. Aide aux diagnostics avancés | Solide formation vibrations + traitement signaux + expérience | 7,62 à 10,67 k€ |

> **Periiodicité des relevés** : Variable selon importance et coût des machines — entre **2 semaines et 6 mois**. La fréquence peut être accélérée si les symptômes précoces le justifient.

#### 17.1.4 Suivi Continu (on-line) — Systèmes à Poste Fixe

**Principe** : Capteurs montés à poste fixe sur les machines. Indicateurs et alarmes dans local technique ou salle de contrôle.

| Système | Fonctions | Utilisation | Coût par voie |
|---------|-----------|------------|--------------|
| **Moniteurs monovoie** | Mesure du niveau global des vibrations ou surveillance du "bruit" des roulements. Plusieurs niveaux d'alarme et de déclenchement réglables | Machines simples à fonctions critiques. Utilisable par opérateurs non-spécialistes | 0,3 à 0,43 k€ (acoustique roulements) / 0,9 à 2,3 k€ (mono/multivoie) |
| **Moniteurs multivoies** | Mêmes fonctions que monovoie sur plusieurs points et machines (simultanément ou en multiplexage) | Machines simples critiques | 0,9 à 2,3 k€/voie |
| **Systèmes surveillance multivoies et multifonctions** | Suivi niveaux globaux + analyses spectrales. Surveillance évolution nombreux paramètres vibratoires. Logiciels d'aide au diagnostic. En option : logiciels avec retour d'expérience | Experts vibrations pour exploitation optimale | 0,46 à 15 k€/voie |
| **Systèmes complets** | Pour machines complexes (multi-arbres), de prix élevé, sans redondance, sur paliers fluides + capteurs déplacement relatif | Opérateurs compétents en mécanique des vibrations | > 0,3 M€ (coût total installation) |

> **Remarque clé** : Le coût des matériels de surveillance **ne représente qu'une faible part** du coût total de la surveillance. La **part de la main d'œuvre** (constitution des données de base, définition des routes, collecte des données, exploitation des résultats) est **prépondérante : 80 à 90%** du coût total.

#### 17.1.5 Paramètres de Mesure Vibratoire

| Paramètre | Unité | Plage fréquentielle typique | Détection |
|-----------|-------|--------------------------|-----------|
| **Déplacement** | mm, μm | Basses fréquences (< 10 Hz) | Grands déplacements (balourd, désalignement) |
| **Vitesse** | mm/s | 10 à 1000 Hz | Défauts courants des machines tournantes |
| **Accélération** | m/s², g | 2 à 20 kHz | Défauts de roulements (haute fréquence) |

**Exemple de surveillance** (extrait du cours) :
- Mesure du niveau de vibrations broche (tour CN) :
  - Vitesse : 10–1000 Hz
  - Accélération : 2–20 kHz

#### 17.1.6 Logiciels de Surveillance Vibratoire — Tendance Actuelle

> Une tendance nouvelle se dessine dans le domaine des logiciels de surveillance vibratoire qui tendent à proposer des **solutions globales** intégrant :
> - L'analyse des huiles
> - La thermographie infrarouge
> - D'autres techniques de maintenance prévisionnelle

→ Approche **multi-technique intégrée** dans une plateforme unique.

#### 17.1.7 Rentabilité de la Surveillance Vibratoire

> *"Si le coût de la surveillance périodique paraît élevé en premier lieu, il s'avère après quelques années d'exploitation que les **économies réalisées dépassent largement deux fois ce coût en 2 à 5 ans** suivant les cas."*

---

### 17.2 THERMOGRAPHIE INFRAROUGE

#### 17.2.1 Principe

La thermographie infrarouge est une technique permettant de **mesurer à distance et sans contact** la température d'une scène observée.

#### 17.2.2 Applications en Maintenance

**Installations électriques** :
- Vérification des connexions électriques (points chauds, résistances anormales)
- Détection des déphasages
- Surveillance des roulements (échauffements anormaux)

**Installations mécaniques** :
- Détection des surchauffes mécaniques
- Surveillance des roulements

**Installations isolées** :
- Contrôle des calorifuges et réfractaires
- Détection des ponts thermiques

**Composants** :
- Détection des défauts internes de certains composants

#### 17.2.3 Mise en Place

**Démarche** :
1. Sélection des équipements à surveiller
2. Sélection des composants et défaillances potentielles (retour d'expérience)
3. Connaissance des symptômes annonçant la défaillance
4. Choix de la méthode : "imageur" ou mesureur thermique
5. Mode de collecte : enregistrement ponctuel ou continu
6. Sélection du logiciel de traitement (généralement spécifique au fabricant)

> **Note** : Un contrôle par thermographie infrarouge est quasiment toujours mis en œuvre dans le cadre de **suivis périodiques**.

**Paramètre à fixer** : La **périodicité** (très variable selon le type et la vitesse de dégradation de l'équipement).

#### 17.2.4 Appareillages

| Appareil | Fonctions | Utilisateurs |
|---------|-----------|-------------|
| **Thermomètres IR sans contact** | Mesure à distance de la température d'une cible. Fonctions optionnelles : variation émissivité, températures min/max, enregistrement | Opérateurs non-spécialistes |
| **"Imageurs" thermiques** | Visualisation de la température d'une scène (sans mesure de température) | |
| **Caméras IR de mesure thermique** | Visualisation ET mesure de la température. Images enregistrables et traitables sur PC | |

**Tendances** des appareillages :
- Toujours plus précises et fiables
- Plus conviviales (numérisation de l'image, logiciels performants)
- Plus maniables et de faible encombrement

#### 17.2.5 Coût

**Maintenance annuelle** (étalonnage) : 0,6 à 1 k€

Formation des opérateurs : indispensable, ne pas négliger.

---

### 17.3 ENDOSCOPIE

#### 17.3.1 Principe

Technique permettant de **visualiser à distance toute zone d'un équipement a priori non accessible sans démontage**, par l'introduction d'un appareillage adapté.

#### 17.3.2 Applications

**Machines tournantes** : moteurs, turbines, compresseurs
**Cavités** : ballons, échangeurs, réducteurs

**Contrôle de l'état** de zones inaccessibles (sauf démontage important) :
- Inspection périodique ou ponctuelle
- Suivi de l'évolution d'une dégradation

> **Important** : La plupart des contrôles endoscopiques nécessitent l'**arrêt de l'équipement**.

#### 17.3.3 Appareillages

| Type | Caractéristiques | Coût indicatif |
|------|-----------------|---------------|
| **Endoscopes rigides** | Plusieurs diamètres, angle de visualisation jusqu'à 110°, objectifs interchangeables | 1,22 à 4,57 k€ |
| **Endoscopes souples (fibroscopes)** | Pour zones non accessibles en ligne droite | 1,52 à 30 k€ |
| **Vidéoendoscopes** | Images enregistrables, traitement informatique | 7,7 à 61 k€ |

**Critères de choix** :
- Caractéristiques géométriques (diamètre, longueur)
- Direction et angle de visualisation
- Milieu dans lequel l'endoscope doit être plongé
- Domaine de visualisation (objectifs interchangeables)

À ajouter : coût du générateur de lumière + coût de formation (succincte — fournie par le fournisseur).

---

### 17.4 ANALYSES D'HUILE

#### 17.4.1 Principe

Tous les mécanismes lubrifiés (graissage non à fond perdu) peuvent être surveillés par **analyse du lubrifiant en service**.

**Ce que l'analyse permet de déceler** :
- Contamination par des particules internes à l'équipement
- Évolution comparative des résultats (suivi tendance)
- Type d'usure
- Pollution par des agents extérieurs

#### 17.4.2 Équipements Concernés

- Transport (personnes, marchandises, ferroviaire)
- Industries (moteurs, réducteurs, compresseurs, systèmes hydrauliques)
- Matériel agricole
- Marine, aviation

#### 17.4.3 Défaillances Détectables

| Équipement | Défaillances |
|------------|-------------|
| **Moteur thermique** | Problèmes d'étanchéité filtration d'air, infiltration liquide de refroidissement |
| **Multiplicateurs, réducteurs, engrenages** | Mauvais état roulement ou palier, engrenages endommagés |
| **Systèmes hydrauliques** | Contamination interne (cavitation), défaut d'étanchéité, défaut de filtration |

#### 17.4.4 Mise en Place

**Sur site industriel** :
- Prélèvement d'échantillons et examens visuels (transparence, couleur, dépôts)
- Suivi continu des paramètres : schémas, température, débit, pression, historiques des vidanges, appoints, maintenance corrective, anomalies

**En laboratoire** :
- Analyses physico-chimiques
- Analyses spectrométriques
- Analyses ferrographiques
- Comptage de particules

#### 17.4.5 Méthodes d'Analyse Détaillées

##### A. Analyses Physico-Chimiques

| Paramètre | Méthode | Ce qu'il révèle |
|-----------|---------|----------------|
| **Viscosité** | Temps d'écoulement à travers capillaire à T donnée (NF T 60-100) | Propriétés d'écoulement, éventuelle dilution par carburant |
| **Indice de viscosité (VI)** | Comparaison avec huiles de référence à différentes T° | Comportement de la viscosité en fonction de la température |
| **Teneur en eau** | Quatest, réactif Karl Fischer (ASTM D-1744-64), ou CPG | % d'eau dans le volume d'huile |
| **Point éclair** | Vase clos, appareil Pensky Martens (NF T 60-...) | Niveau de dilution par le combustible |
| **Essai à la tache** | Analyse photométrique | Pouvoir dispersant résiduel, concentration résidus insolubles |
| **Indice d'Acide Total (TAC ou TAN)** | NF T 60-112 et ASTM D664 | Niveau d'acidité, oxydation de l'huile, présence contaminants, dépréciation additifs |
| **Indice de Base Total (TBN)** | ASTM D96 | Réserve d'alcalinité — aptitude à neutraliser l'acidité |

##### B. Analyses Spectrométriques

| Méthode | Principe | Ce qu'elle mesure |
|---------|---------|------------------|
| **Spectrométrie à émission optique** | Détermination rapide des concentrations en ppm en masse des éléments présents | Additifs (Ca, Mg), particules d'usure métalliques (Fe, Ni, Cr, Sn, Cu, Al), contaminants solides (poussières, silicone) |
| **Spectrométrie à absorption (IR)** | Structure chimique générale d'un corps ou mélange par rayonnement IR | Nature des hydrocarbures, nature et état des additifs (analyse différentielle huile neuve/usée) |

##### C. Pollution Gravimétrique

Utilisée pour fluides à contamination particulaire élevée. Renseigne sur le **niveau de contamination globale** du fluide (propreté du circuit).

##### D. Comptage de Particules

Surveillance des dimensions et quantités de particules contaminantes solides dans les huiles hydrauliques.

Niveau de propreté selon **code ISO 4406**.

> Si l'échantillon contient plus de 500 ppm d'eau (0,05%), ce test ne peut pas être effectué adéquatement.

Méthodes : comptage au microscope et automatique.

##### E. Analyses Ferrographiques

| Type | Détection | Utilisation |
|------|-----------|------------|
| **Ferrographie quantitative (lecture directe)** | Quantités relatives de petites et grosses particules ferreuses — changements dans le taux et la sévérité de l'usure dans les roulements et réducteurs | Surveillance courante |
| **Ferrographie analytique** | Détection grosses particules jusqu'à 100 μm — examen microscopique (mode d'usure, contaminants, produits d'oxydation) | Étude approfondie quand la ferrographie quantitative indique usure importante ou anormale. Systèmes hydrauliques complexes |

#### 17.4.6 Coûts d'Analyse

| Type d'analyse | Coût indicatif |
|----------------|---------------|
| Paramètres de base (viscosité, % eau, métaux, usure) | 30 € |
| Programme d'analyse complet industriels (dégressivité possible) | 45 à 75 € |
| Analyses spécifiques en laboratoire | 75 à 150 € |

---

### 17.5 AUTRES TECHNIQUES CND

#### Ultrasons

Permettent de détecter :
- **Défauts volumiques** : soufflures, inclusions de laitier
- **Défauts plans** perpendiculaires au faisceau : fissures, manques de fusion

#### Gammagraphie

Mise en évidence des **défauts inclus** (défauts internes non accessibles aux ultrasons).

#### Magnétoscopie

Décèle des **défauts affleurant la surface** — uniquement sur les **matériaux ferromagnétiques**.

#### Ressuage

Recherche de **micro-défauts en surface** sur tout type de matériau.

#### Détection de Fuite

Mise en évidence de **défauts microscopiques** dans des enceintes ou circuits.

---

## SYNTHÈSE — GUIDE DE DÉVELOPPEMENT D'UNE SOLUTION DE MAINTENANCE PRÉDICTIVE

### Architecture Technique Recommandée

```
ACQUISITION DES DONNÉES
├── Capteurs vibratoires (accéléromètres) sur machines critiques
├── Capteurs de température (thermocouples, IR)
├── Capteurs de pression, débit (systèmes hydrauliques)
└── Prélèvements d'huile périodiques

COLLECTE ET TRANSMISSION
├── Collecteurs-analyseurs portatifs (off-line) → routes
├── Moniteurs monovoie/multivoie (on-line) → alertes automatiques
└── Systèmes IoT → transmission temps réel

TRAITEMENT ET ANALYSE
├── Analyse spectrale (FFT) → identification fréquences caractéristiques
├── Tendances et enveloppes → détection dérive
├── Modèles de dégradation → extrapolation (prévisionnelle)
└── Algorithmes ML → diagnostic automatisé (émergent)

DÉCISION ET PLANIFICATION (GMAO)
├── Alertes et alarmes seuils
├── Déclenchement automatique d'ordre de travail
├── Planification de l'intervention (GANTT, PERT)
└── Historique et retour d'expérience → amélioration continue
```

### Indicateurs Clés pour la Maintenance Prédictive

| Indicateur | Source | Usage |
|------------|--------|-------|
| MTBF | Historique GMAO | Seuil d'alerte vibratoire |
| MTTR | Historique GMAO | Planification des ressources |
| Taux de défaillance λ | Calcul sur historique | Probabilité de défaillance à un instant T |
| Criticité C = F×N×G | AMDEC | Priorisation des équipements à surveiller |
| TRS | Mesures production | Impact économique des dégradations |
| Coût de défaillance | Comptabilité maintenance | Justification ROI de la surveillance |

### Sélection des Techniques selon le Type de Défaillance

| Défaillance cible | Technique(s) privilégiée(s) |
|-------------------|--------------------------|
| Déséquilibre, balourd | Analyse vibratoire (fréquence = vitesse rotation) |
| Désalignement accouplement | Analyse vibratoire (harmoniques) |
| Défaut de roulement | Analyse vibratoire hautes fréquences + analyse huile (ferrographie) |
| Usure engrènements | Analyse vibratoire (fréquence d'engrènement) + analyse huile |
| Cavitation | Analyse vibratoire + analyse huile |
| Point chaud électrique | Thermographie IR |
| Défaut d'isolation thermique | Thermographie IR |
| Défaut interne de cavité | Endoscopie + ultrasons |
| Contamination lubrifiant | Analyse d'huile (spectrométrie, comptage particules) |
| Dégradation lubrifiant | Analyse d'huile (physico-chimique : viscosité, TAN, TBN) |
| Fissure de surface | Ressuage + magnétoscopie |
| Défaut volumique (soudure) | Ultrasons + gammagraphie |

### Liens Fondamentaux entre les Concepts

```
FIABILITÉ (MTBF long)
      ↕ amélioration par AMDEC + Analyse des défaillances
DISPONIBILITÉ = MTBF / (MTBF + MTTR)
      ↕ mesurée par TRS
MAINTENABILITÉ (MTTR court)
      ↕ améliorée par gammes, GMAO, formation

MAINTENANCE PRÉVISIONNELLE
  → Mesures vibratoires + analyses huile + thermographie
  → Détection précoce de la dégradation
  → Extrapolation tendance → date prévisionnelle de défaillance
  → Planification de l'intervention (PERT/GANTT)
  → Ordonnancement des ressources
  → Optimisation du coût (LCC)
```

---

*Document compilé à partir du cours BTS MS — Organisation de Maintenance — FAIGNER H. — Promotion 2020/2022*

*Complété par analyse visuelle des pages contenant des schémas, tableaux et diagrammes intégrés au document original.*