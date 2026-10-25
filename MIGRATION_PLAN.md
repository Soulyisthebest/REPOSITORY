# 📋 Plan de Migration : Transformation de Rentia

> **Vision Cible** : Faire évoluer Rentia d'un simple registre d'historique locatif vers une **plateforme de matching immobilier bilatéral (façon Tinder/Bumble)** propulsée par le **Rentia Passport vérifié par IA** et le **respect strict de la confidentialité (RGPD)**.

---

## 🔍 1. État des Lieux : Ce qui existe actuellement (OLD RENTIA)

### 🖥️ Architecture Technique Actuelle
* **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Système i18n multilingue (ES, EN, FR, DE, IT, PT, AR).
* **Backend Custom** : Serveur Node.js / Express (`server.ts`) avec double connectivité :
  * Base SQLite locale (`src/server/db.ts`) avec tables `tenants`, `leases`, `confirmations`, `payments`, `audit_logs`.
  * Client Supabase (`src/server/supabase.ts`) connecté au projet `https://eysdligqudgeegtpkgsd.supabase.co`.
* **Base PostgreSQL Supabase** : Schéma SQL avancé (`src/server/schema.sql`) contenant `profiles`, `leases`, `contracts`, `extracted_contract_data`, `verifications`, `payments`, `reputation_events`, `audit_logs`, avec fonctions de recherche par code et triggers WORM.

### 📊 Inventaire & Statut Réel des Fonctionnalités Existantes

| Composant / Fonctionnalité | Description Actuelle | Statut Réel |
| :--- | :--- | :--- |
| **`PassportCard.tsx`** | Affiche le passeport de réputation avec score de confiance (98/100), grade A+, badge MRZ, drapeaux et années de location. | **MOCK DATA** (Carlos Mendoza par défaut dans `mockData.ts`) / Prêt pour liaison backend. |
| **`RentalHistoryList.tsx`** | Liste chronologique des baux précédents avec tampons "Vérifié", avis du propriétaire et empreinte SHA-256. | **MOCK DATA** + **BACKEND REQUIRED** (connecté partiellement à `/api/leases`). |
| **`AddLeaseModal.tsx`** | Formulaire d'ajout de bail avec upload de contrat et extraction de données. | **GEMINI REQUIRED** (l'IA analyse le bail) + **STORAGE REQUIRED** (Supabase Storage). |
| **`PublicLandlordInspection.tsx`** | Page publique pour un propriétaire voulant consulter le passeport d'un locataire via son code. | **BACKEND REQUIRED** (`/api/public/inspection/:code`). |
| **`LandlordFastVerification.tsx`** | Interface de validation rapide par OTP pour qu'un ancien propriétaire atteste d'un bail. | **BACKEND REQUIRED** (Fonctions Supabase RPC). |
| **`RentalPowerSimulator.tsx`** | Simulateur de budget et de pouvoir locatif basé sur le salaire. | **MOCK DATA** (calcul client-side pur). |
| **`PaymentHistoryModal.tsx`** | Visualiseur de l'historique des quittances et régularité des paiements. | **MOCK DATA** + **BACKEND REQUIRED**. |
| **`PrivacyPolicyModal.tsx`** | Centre de confidentialité RGPD avec export JSON (`/api/tenant/export-data`) et droit à l'effacement (`DELETE /api/tenant/me`). | **OPÉRATIONNEL** (connecté à l'API Supabase et conforme aux principes RGPD). |
| **`AuthModal.tsx`** | Authentification locataire avec consentement RGPD explicite. | **OPÉRATIONNEL** (connecté à Supabase Auth / `/api/auth`). |

---

## 🎯 2. Comparatif : OLD RENTIA vs NEW RENTIA

| Dimension | OLD RENTIA (Actuel) | NEW RENTIA (Cible) |
| :--- | :--- | :--- |
| **Cœur de proposition** | Carnet d'adresses et de recommandations d'anciens propriétaires. | **Matching bilatéral logement/locataire** (Tinder/Bumble) boosté par un **Rentia Passport vérifié**. |
| **Parcours Utilisateur** | Statique : Le locataire génère un lien / QR code et l'envoie manuellement. | **Dynamique** : Découverte mutuelle de logements (côté locataire) et de candidats (côté propriétaire) avec système de Like / Pass. |
| **Rôle de l'IA (Gemini)** | Simple OCR d'extraction de données contractuelles. | **Gouvernance & Comparaison d'objectifs** : analyse sécurisée de documents (nóminas, contrats, identité), **calcul de compatibilité explicable**, et **masquage des données sensibles**. |
| **Confidentialité / RGPD** | Présentation complète des baux passés. | **Minimisation stricte** : Pastilles de certification (🟢 Vérifié / 🟢 Compatible) sans révéler les salaires exacts ni les pièces brutes aux inconnus. |
| **Communication** | Pas de messagerie. | **Messagerie déverrouillée uniquement après Match bilatéral** (premier message initié par le propriétaire). |
| **Profil Propriétaire** | Limité à la validation externe de baux passés. | **Espace Propriétaire dédié** : Création d'annonces, paramétrage de critères stricts, consultation des profils anonymisés/vérifiés, swipe et match. |

---

## 📦 3. Matrice de Traitement du Code

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MATRICE DE MIGRATION                             │
├─────────────────┬─────────────────┬───────────────────┬─────────────────────┤
│      KEEP       │     MODIFY      │      REMOVE       │         ADD         │
│  (À Conserver)  │ (À Transformer) │ (À Supprimer/Dep) │    (À Développer)   │
├─────────────────┼─────────────────┼───────────────────┼─────────────────────┤
│ • Supabase Auth │ • PassportCard  │ • Simulator       │ • Match Deck Swipe  │
│ • Tables baux   │ • App Layout    │ • Inspection      │ • Annonces Logement │
│ • Storage Doc   │ • AddLeaseModal │   publique brute  │ • Algorithme Match  │
│ • Centre RGPD   │ • Header & Nav  │ • MRZ archaïque   │ • Messagerie Match  │
│ • i18n 7 lang   │ • Types TS      │ • Stats v1        │ • Analyseur Nómina  │
└─────────────────┴─────────────────┴───────────────────┴─────────────────────┘
```

### ✅ KEEP (Ce que nous conservons)
1. **Infrastructure Supabase & Auth** (`/src/server/supabase.ts`, `/src/server/routes/authRoutes.ts`) : L'authentification, les sessions, les tables PostgreSQL et le stockage sécurisé.
2. **Centre de Confidentialité & RGPD** (`/src/components/PrivacyPolicyModal.tsx`) : Export JSON des données, droit à l'effacement, logs d'audit.
3. **Moteur i18n** (`/src/i18n/translations.ts`) : Système complet multilingue (7 langues).
4. **Système de certification cryptographique des baux** : Conserver la table `verifications` et le trigger WORM anti-fraude pour alimenter le volet "Historique locatif vérifié".

### 🔄 MODIFY (Ce que nous transformons)
1. **`PassportCard.tsx` ➔ Nouveau Rentia Passport à Niveaux de Confidentialité** :
   - Remplacer l'affichage brut de données par des pastilles de statut vérifiées par l'IA :
     - 🟢 **Identité** : Vérifiée
     - 🟢 **Situation professionnelle & Contrat** : CDI / Fonctionnaire / Indépendant vérifié
     - 🟢 **Revenus & Compatibilité financière** : Taux d'effort calculé sans exposer le montant net
     - 🟢 **Historique locatif** : X baux vérifiés avec 0 incident
     - ⭐ **Recommandations** : Note moyenne issue de vraies confirmations
   - Intégrer les réglages de visibilité (l'utilisateur choisit ce qu'il divulgue).
2. **`AddLeaseModal.tsx` ➔ Hub de Vérification de Documents Passport** :
   - Élargir au-delà des baux pour permettre le dépôt de :
     - Fiches de paie (*nóminas*)
     - Contrat de travail / DNI
     - Baux précédents
   - Connecter l'analyse Gemini pour extraire les métadonnées et alimenter les pastilles 🟢 sans stocker de données superflues.
3. **`Header.tsx`** :
   - Permettre de basculer facilement entre le **Mode Locataire** (Recherche de logements, mon Passport) et le **Mode Propriétaire** (Mes annonces, Candidats à swiper, Matchs).
4. **Schéma de base de données (`schema.sql`)** :
   - Ajouter les tables pour les **Logements** (`listings`), les **Critères** (`listing_criteria`), les **Candidatures / Swipes** (`interactions`), les **Matchs** (`matches`) et les **Messages post-match** (`messages`).

### 🗑️ REMOVE (Ce que nous retirons ou déprécions)
1. **`RentalPowerSimulator.tsx`** :
   - *Raison* : Outil secondaire déconnecté du flux de matching qui encombre l'interface. Remplacé nativement par le calcul automatique de compatibilité financière lors du matching.
2. **`PublicLandlordInspection.tsx` (dans sa forme actuelle)** :
   - *Raison* : L'ancien concept exposait l'ensemble du profil à n'importe qui disposant d'un code. Dans le nouveau concept, l'accès est subordonné au matching et aux permissions accordées.
3. **MRZ Code & Données cosmétiques superflues** :
   - *Raison* : La chaîne MRZ façon passeport aéroportuaire est remplacée par un design d'accréditation numérique moderne et lisible.

### ➕ ADD (Ce que nous créons)
1. **Module de Découverte & Swiping façon Tinder/Bumble** (`PropertyDeck.tsx` / `CandidateDeck.tsx`) :
   - Vue cartes épurées avec photos, localisation, loyer, équipements et **Badge de Compatibilité (%)**.
   - Boutons d'action clairs : **Passer (❌)** et **Intéressé (❤️)**.
2. **Moteur d'Explication de la Compatibilité IA** (`CompatibilityBadge.tsx`) :
   - Score transparent (ex: `94% compatible`) avec décomposition explicable :
     - Budget vs Loyer (35%)
     - Animaux acceptés (25%)
     - Date d'entrée (20%)
     - Localisation / Zone (20%)
3. **Espace Propriétaire : Gestion d'Annonces & Critères** (`LandlordListingModal.tsx`) :
   - Formulaire de création de logement : adresse, loyer, charges, date de disponibilité, pièces, animaux autorisés, revenus minimums recommandés.
4. **Centre de Matchs & Messagerie Post-Match** (`MatchCenter.tsx` / `ChatModal.tsx`) :
   - Écran de célébration "IT'S A MATCH ! ❤️".
   - Liste des matchs actifs.
   - Règle stricte : Le propriétaire initie le premier contact, le locataire répond.

---

## 🏗️ 4. Architecture Finale Proposée

```
                               ┌────────────────────────────────┐
                               │   RENTIA FRONTEND (React+TS)   │
                               └───────────────┬────────────────┘
                                               │
             ┌─────────────────────────────────┼─────────────────────────────────┐
             ▼                                 ▼                                 ▼
   [ Mode Locataire ]                 [ Mode Propriétaire ]               [ Hub Confidentialité ]
  - Mon Rentia Passport             - Mes Annonces / Critères             - Contrôle des partages
  - Upload Documents (Nómina, DNI)  - Deck Candidats Vérifiés             - Droit à l'effacement
  - Deck Logements & Score IA       - Matchs & 1er Message               - Export JSON RGPD
  - Mes Matchs & Discussions        - Filtres de compatibilité
             │                                 │                                 │
             └─────────────────────────────────┼─────────────────────────────────┘
                                               │ (API REST Sécurisée)
                                               ▼
                               ┌────────────────────────────────┐
                               │   SERVEUR EXPRESS (Node.js)    │
                               └───────────────┬────────────────┘
                                               │
             ┌─────────────────────────────────┴─────────────────────────────────┐
             ▼                                                                   ▼
┌───────────────────────────────┐                               ┌────────────────────────────────┐
│       SUPABASE SERVICE        │                               │       GEMINI 3.7 FLASH         │
├───────────────────────────────┤                               ├────────────────────────────────┤
│ • Auth (Sessions & JWT)       │                               │ • Extraction Nómina / Baux     │
│ • DB: profiles, listings,     │                               │ • Vérification d'intégrité     │
│   matches, messages, leases   │                               │ • Calcul compatibilité (0-100) │
│ • Storage: Bucket 'contracts' │                               │ • Justification explicable     │
└───────────────────────────────┘                               └────────────────────────────────┘
```

---

## 🗺️ 5. Plan de Migration Étape par Étape

### 📍 Étape 1 : Extension du Schéma Supabase (Sans casser l'existant)
- Définir les nouvelles tables :
  - `listings` (annonces de logements créées par les propriétaires).
  - `tenant_preferences` (critères de recherche du locataire).
  - `swipes` (likes et passes des locataires et propriétaires).
  - `matches` (croisement des likes mutuels).
  - `messages` (échanges post-match).
- Mettre à jour `src/types.ts` pour inclure les nouveaux types de données.

### 📍 Étape 2 : Évolution du Rentia Passport & Analyseur IA Gemini
- Modifier `PassportCard.tsx` pour afficher les 4 piliers vérifiés (Identité, Emploi, Revenus, Historique).
- Créer la route d'analyse Gemini (`/api/ai/verify-document`) pour qualifier automatiquement les fiches de paie et documents sans stocker le salaire brut.

### 📍 Étape 3 : Module de Logements & Moteur de Matching Explicable
- Créer le service de calcul de compatibilité multicritère (Loyer/Budget, Date, Animaux, Emplacement).
- Développer la route `/api/matching/compatibility` qui retourne le score et le détail objectif.

### 📍 Étape 4 : Interface Utilisateur Découverte & Swiping (Tinder/Bumble UI)
- Construire le composant `DiscoveryDeck.tsx` permettant au locataire de swiper les logements et au propriétaire de swiper les candidats compatibles.
- Ajouter l'écran dynamique de notification "MATCH ! ❤️".

### 📍 Étape 5 : Messagerie Post-Match Sécurisée
- Intégrer le système de messagerie restreinte (le propriétaire écrit en premier, le locataire accepte/répond).

### 📍 Étape 6 : Nettoyage & Polissage Visuel
- Retirer le simulateur obsolète et les vues d'inspection brute.
- Vérifier la conformité RGPD, l'absence de fuite de clés API et tester les flux multilingues.
