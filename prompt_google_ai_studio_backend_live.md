# Prompt Google AI Studio — Backend MHM SOLUTIONS aligné sur l’extension live

Tu es un architecte full-stack senior spécialisé dans React/Vite/TypeScript, Supabase PostgreSQL, Supabase Edge Functions, Realtime et extensions Chrome Manifest V3. Tu dois transformer le projet MHMbac en plateforme live cohérente avec l’extension Chrome **MHM SOLUTIONS — Après Mon Bac**, créée par **Hilarus Gbagoule**.

## Règle prioritaire

Inspecte d’abord le dépôt existant et conserve les fonctionnalités déjà opérationnelles. Le site utilise React, Vite, Tailwind CSS et Supabase. L’extension collecte des données dans la session active de `https://apresmonbac.bj/Home/choice` en appelant les modes de lecture autorisés de `POST /Home/GetListChoice`, notamment `ecoleByUniversity`, `FiliereByEcole` et `filiereJauge`.

Ne contourne jamais CAPTCHA, authentification ou mécanisme anti-abus. Ne simule aucune donnée dans les écrans live. Ne soumets jamais automatiquement les choix universitaires. L’utilisateur doit valider manuellement sur le site officiel.

Ne place jamais dans le frontend ou l’extension : `SUPABASE_SERVICE_ROLE_KEY`, URI PostgreSQL, mot de passe serveur ou secret d’administration. Les clés privilégiées restent uniquement dans les secrets Supabase Edge Functions.

## Contrat JSON envoyé par l’extension

L’extension envoie une requête `POST` à :

`/functions/v1/mhmbac-sync`

Le corps suit ce format :

```json
{
  "schemaVersion": "mhm-extension.v1",
  "batchId": "identifiant-unique-du-scan",
  "source": "chrome_extension",
  "extensionVersion": "0.2.0",
  "scoreVersion": "v1",
  "series": "D",
  "criteria": {
    "mention": "Passable",
    "goal": "competition",
    "careerKeywords": "agriculture, environnement"
  },
  "observedAt": "2026-08-14T12:00:00.000Z",
  "items": [
    {
      "universityId": 1,
      "university": "Nom observé",
      "schoolId": 2,
      "school": "Établissement observé",
      "programmeId": 3,
      "programme": "Filière observée",
      "scholarships": 0,
      "aid": 0,
      "tb": 0,
      "b": 0,
      "ab": 0,
      "passable": 0,
      "total": 0,
      "rank": null,
      "capacity": null,
      "applicants": null,
      "rawGauge": null,
      "observedAt": "2026-08-14T12:00:00.000Z"
    }
  ]
}
```

Les sept jauges de base sont `scholarships`, `aid`, `tb`, `b`, `ab`, `passable` et `total`. Les champs `rank`, `capacity` et `applicants` ne doivent être remplis que si la réponse officielle les fournit réellement. Les données absentes restent `null` ou absentes.

La fonction serveur doit ignorer ou refuser les champs inattendus selon une stratégie documentée, limiter un batch à 500 items par requête, supprimer les doublons par `programmeId` dans le batch et rendre l’écriture idempotente grâce à une empreinte de snapshot.

## Base de données Supabase à configurer

Utilise une migration additive et idempotente. Ne supprime pas les tables MVP1 existantes. Vérifie les tables déjà présentes avant de créer les nouvelles.

### Table `live_programmes`

Cette table représente le dernier état connu par filière :

- `id BIGSERIAL PRIMARY KEY` ;
- `university_id BIGINT NOT NULL` ;
- `university TEXT NOT NULL` ;
- `school_id BIGINT NOT NULL` ;
- `school TEXT NOT NULL` ;
- `programme_id BIGINT NOT NULL UNIQUE` ;
- `programme TEXT NOT NULL` ;
- `scholarships INTEGER NOT NULL DEFAULT 0 CHECK (scholarships >= 0)` ;
- `aid INTEGER NOT NULL DEFAULT 0 CHECK (aid >= 0)` ;
- `tb INTEGER NOT NULL DEFAULT 0 CHECK (tb >= 0)` ;
- `b INTEGER NOT NULL DEFAULT 0 CHECK (b >= 0)` ;
- `ab INTEGER NOT NULL DEFAULT 0 CHECK (ab >= 0)` ;
- `passable INTEGER NOT NULL DEFAULT 0 CHECK (passable >= 0)` ;
- `total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0)` ;
- `rank INTEGER NULL CHECK (rank IS NULL OR rank >= 0)` ;
- `capacity INTEGER NULL CHECK (capacity IS NULL OR capacity >= 0)` ;
- `applicants INTEGER NULL CHECK (applicants IS NULL OR applicants >= 0)` ;
- `score_version TEXT NULL` ;
- `score_opportunity INTEGER NULL CHECK (score_opportunity IS NULL OR score_opportunity BETWEEN 0 AND 100)` ;
- `score_confidence TEXT NULL` ;
- `observed_at TIMESTAMPTZ NOT NULL` ;
- `source TEXT NOT NULL DEFAULT 'chrome_extension'` ;
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`.

Ajoute des index sur `updated_at`, `university_id`, `school_id`, `score_opportunity`, `total` et `observed_at`.

### Table `gauge_observations`

Conserve l’historique brut et dédupliqué :

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` ;
- `programme_id BIGINT NOT NULL` ;
- `batch_id TEXT NULL` ;
- `snapshot_hash TEXT NOT NULL` ;
- `payload JSONB NOT NULL` ;
- `observed_at TIMESTAMPTZ NOT NULL` ;
- `source TEXT NOT NULL` ;
- `extension_version TEXT NULL` ;
- `score_version TEXT NULL` ;
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())` ;
- contrainte unique `(programme_id, snapshot_hash)`.

Ajoute des index sur `programme_id`, `observed_at`, `batch_id` et `created_at`.

### Table `gauge_alerts`

Conserve les variations détectées :

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` ;
- `programme_id BIGINT NOT NULL` ;
- `programme TEXT NOT NULL` ;
- `university TEXT NOT NULL` ;
- `school TEXT NOT NULL` ;
- `field_name TEXT NOT NULL` ;
- `before_value INTEGER NOT NULL` ;
- `after_value INTEGER NOT NULL` ;
- `delta INTEGER NOT NULL` ;
- `observed_at TIMESTAMPTZ NOT NULL` ;
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())` ;
- éventuellement `batch_id`, `severity` et `message` si cela reste compatible avec le schéma existant.

### Table `sync_batches`

Crée une table de suivi des collectes : `batch_id`, `source`, `extension_version`, `series`, `criteria JSONB`, `received_count`, `updated_count`, `alert_count`, `status`, `error_message`, `observed_at`, `created_at`. Elle doit permettre d’afficher la fraîcheur et le statut de la dernière collecte sans exposer de données sensibles.

## RLS et sécurité

Active RLS sur les tables live. Autorise la lecture publique uniquement des données nécessaires à l’exploration, des statistiques agrégées et des alertes non sensibles. Interdis toute écriture directe par `anon` et `authenticated`. Les écritures passent par l’Edge Function avec la clé serveur stockée dans les secrets.

Ne rends jamais public le payload brut s’il peut contenir des informations de session ou des données sensibles. Sépare les colonnes publiques des métadonnées internes si nécessaire.

Le jeton `MHM_SYNC_TOKEN` présent dans une extension n’est pas un secret fort, car une extension installée peut être inspectée. Utilise-le uniquement comme garde-fou complémentaire. Ajoute des contrôles serveur : taille maximale, validation stricte, limitation par IP ou batch si disponible, déduplication, journalisation et possibilité de rotation. Ne tente pas de cacher une clé privilégiée dans l’extension.

## Edge Function `mhmbac-sync`

Crée ou mets à jour une fonction Edge nommée `mhmbac-sync` avec :

1. CORS strictement configuré pour les origines nécessaires ;
2. support de `OPTIONS` et `POST` ;
3. validation du JSON et du contrat ;
4. validation des identifiants, textes, dates et entiers non négatifs ;
5. refus de plus de 500 items ;
6. déduplication par `programmeId` dans un batch ;
7. calcul d’une empreinte SHA-256 sur les valeurs observées ;
8. lecture de l’ancien état dans `live_programmes` ;
9. détection des variations sur les jauges, le rang, la capacité et les postulants lorsqu’ils existent ;
10. recalcul serveur du score v1 ;
11. upsert idempotent de `live_programmes` ;
12. insertion dédupliquée dans `gauge_observations` ;
13. insertion des changements dans `gauge_alerts` ;
14. enregistrement du résultat dans `sync_batches` ;
15. réponse JSON concise : `ok`, `batchId`, `received`, `updated`, `alerts`, `scoreVersion`, `observedAt`, `freshnessSeconds`.

## Score serveur v1

Le score ne doit pas être une probabilité d’admission. C’est un indicateur d’opportunité pour comparer des filières à partir de données observées.

Calcule au minimum :

- `scholarshipScore` à partir du ratio `scholarships / total` lorsque `total > 0` ;
- `competitionScore` à partir de la pression observée et des compteurs disponibles ;
- `admissionObservedScore` comme indicateur inverse de pression, sans le nommer « chance garantie » ;
- `careerScore` uniquement si le catalogue contient une correspondance vérifiable ;
- `opportunityScore` avec des pondérations dépendant de l’objectif ;
- `confidence` selon la fraîcheur, la complétude et la qualité de la collecte ;
- `factors` et `explanation` pour l’interface « Pourquoi ce score ? ».

Le score doit comporter une version, par exemple `v1`, être calculé par une fonction pure testable et être reproductible. Si les données sont insuffisantes, renvoie `null` ou une confiance limitée plutôt qu’une fausse précision.

## Temps réel Supabase

Configure Supabase Realtime sur `live_programmes`, `gauge_alerts` et, si pertinent, `sync_batches`. Dans le frontend MHMbac :

- charge l’état initial avec pagination et filtres ;
- s’abonne aux `INSERT` et `UPDATE` utiles ;
- met à jour les cartes et tableaux sans rechargement ;
- affiche la dernière mise à jour, l’âge de la donnée et un indicateur « données en direct » ;
- gère déconnexion, reconnexion, état vide et erreur ;
- évite les doublons lors de la réception d’un événement Realtime.

## Frontend MHMbac à mettre à jour

Remplace progressivement l’usage de `DEMO_PROGRAMMES` dans l’écran public par une vue live clairement identifiée. Le parcours doit être :

1. exploration publique des universités, écoles, filières, jauges et statistiques ;
2. explication de ce qu’est une jauge et de la date de collecte ;
3. personnalisation après clic sur « Analyser pour mon profil » ;
4. résultats classés avec score global, sous-scores, confiance et explication ;
5. sélection d’une shortlist ;
6. proposition de compte uniquement pour conserver la shortlist ou recevoir des alertes ;
7. rappel de validation manuelle sur `apresmonbac.bj`.

Crée des types TypeScript correspondant exactement aux tables et au contrat JSON. Ne mélange pas `DemoProgramme` avec `LiveProgramme`. Si les exemples restent affichés, marque-les explicitement comme démonstration.

Ajoute une couche de requêtes Supabase typées et testables. Les statistiques peuvent inclure : nombre de filières observées, universités couvertes, dernière collecte, variations récentes, distribution par score et répartition par jauge, à condition d’utiliser des données réellement présentes.

## Extension Chrome à maintenir

Ne supprime pas les comportements suivants : lecture dans la session officielle, stockage local, export JSON, panneau superposé, critères personnalisables, actualisation optionnelle, import des trois premiers choix sans soumission et alerte locale.

Améliorations attendues :

- timeout et retry contrôlés pour les appels de lecture ;
- limite de scan configurable sans dépasser les contraintes raisonnables du site ;
- normalisation des réponses tableau ou objet ;
- conservation de `rank`, `capacity`, `applicants` et du payload brut seulement lorsqu’ils existent ;
- batchId, schemaVersion, scoreVersion et métadonnées de fraîcheur ;
- score lisible avec facteurs ;
- filtre université dynamique ;
- export JSON enveloppé avec métadonnées ;
- affichage de « données absentes » au lieu d’estimations ;
- messages d’erreur compréhensibles ;
- validation syntaxique et tests de fonctions pures.

## Vérifications obligatoires avant livraison

Vérifie le typecheck, le lint, les tests unitaires du score, la migration idempotente, les politiques RLS, les réponses 400/401/413 de l’Edge Function, la déduplication, les alertes, la lecture publique, le temps réel, les états sans données et les performances desktop/mobile.

Teste avec un vrai batch obtenu de l’extension lorsque l’utilisateur le fournit. N’insère pas de données fictives dans Supabase pour faire passer un test. Ne valide jamais automatiquement un choix officiel.

À la fin, fournis :

- la liste des fichiers modifiés ;
- la migration SQL ;
- la fonction Edge ;
- les types et requêtes frontend ;
- la formule du score v1 ;
- les variables d’environnement nécessaires, sans leurs valeurs secrètes ;
- les commandes et étapes de déploiement ;
- les limites connues, notamment la nécessité d’une session officielle active pour la collecte par extension.

Réponds et implémente en français. Marque explicitement toute donnée simulée, toute donnée observée et toute donnée manquante.
