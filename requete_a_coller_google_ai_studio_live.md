# Mission d’implémentation — MHM SOLUTIONS / Après mon Bac

Tu es l’agent de développement principal du projet **MHMbac**, créé par **Hilarus Gbagoule** pour l’initiative **MHM SOLUTIONS**. Tu dois inspecter le projet existant, modifier directement le code et configurer le backend jusqu’à obtenir une intégration fonctionnelle entre l’extension Chrome, Supabase et le site public.

Ne te contente pas de proposer du code ou une explication : **inspecte d’abord le projet, implémente les changements, exécute les vérifications disponibles et corrige les erreurs jusqu’à obtenir un résultat propre**. Ne supprime aucune fonctionnalité existante sans raison documentée.

## 1. Contexte réel

Le site public est déployé à cette adresse :

`https://mhmbac.vercel.app`

Le projet utilise React, Vite, TypeScript, Tailwind CSS, Supabase et une base PostgreSQL Supabase dont le projet est :

`uxdfrnogiuefoqjpobpf`

L’extension Chrome **MHM SOLUTIONS — Après Mon Bac** fonctionne sur :

`https://apresmonbac.bj/Home/choice`

Elle lit les données visibles dans la session officielle connectée en appelant les modes de lecture de `POST /Home/GetListChoice`, notamment :

- `ecoleByUniversity` ;

- `FiliereByEcole` ;

- `filiereJauge`.

Elle ne doit jamais contourner CAPTCHA ou authentification et ne doit jamais soumettre automatiquement les choix officiels. L’import des choix reste manuel : l’extension remplit les champs, puis l’utilisateur vérifie et clique lui-même sur le bouton officiel.

## 2. Problème actuel à corriger

Le site public affiche encore `DEMO_PROGRAMMES` dans `HomePage.tsx` et `DashboardPage.tsx`. Son interface donne l’impression d’afficher des données en temps réel, mais le frontend ne lit pas encore `live_programmes` et ne possède pas de souscription Supabase Realtime.

La migration live et la fonction `mhmbac-sync` existent déjà dans le projet ou doivent être vérifiées. La table `live_programmes` contient notamment les jauges suivantes :

`scholarships`, `aid`, `tb`, `b`, `ab`, `passable`, `total`.

Elle peut également contenir :

`rank`, `capacity`, `applicants`, `score_version`, `score_opportunity`, `score_confidence`, `observed_at`, `updated_at`.

## 3. Contrat envoyé par l’extension

La fonction Edge doit accepter un `POST` JSON à :

`/functions/v1/mhmbac-sync`

Le payload a cette structure :

```json
{
  "schemaVersion": "mhm-extension.v1",
  "batchId": "identifiant-unique-du-scan",
  "source": "chrome_extension",
  "extensionVersion": "0.3.0",
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
      "university": "Nom de l’université",
      "schoolId": 2,
      "school": "Nom de l’établissement",
      "programmeId": 3,
      "programme": "Nom de la filière",
      "scholarships": 16,
      "aid": 4,
      "tb": 0,
      "b": 1,
      "ab": 7,
      "passable": 9,
      "total": 17,
      "rank": null,
      "capacity": null,
      "applicants": null,
      "rawGauge": null,
      "observedAt": "2026-08-14T12:00:00.000Z"
    }
  ]
}
```

Les champs `rank`, `capacity`, `applicants` et `rawGauge` doivent rester absents ou `null` lorsqu’ils ne sont pas fournis réellement par le site officiel. Il est interdit d’inventer une capacité, un rang, un nombre de postulants ou une probabilité d’admission.

## 4. Base Supabase à mettre en place ou vérifier

Inspecte les migrations existantes avant d’agir. Utilise des migrations additives et idempotentes. Ne supprime pas les tables MVP1.

Vérifie ou crée les tables suivantes :

### `live_programmes`

Elle contient le dernier état connu par filière, avec :

`programme_id UNIQUE`, `university_id`, `university`, `school_id`, `school`, `programme`, les sept jauges, `rank`, `capacity`, `applicants`, `score_version`, `score_opportunity`, `score_confidence`, `observed_at`, `source`, `updated_at`.

Ajoute les index utiles sur `programme_id`, `university_id`, `school_id`, `score_opportunity`, `observed_at` et `updated_at`.

### `gauge_observations`

Elle conserve les snapshots historiques avec :

`programme_id`, `batch_id`, `snapshot_hash UNIQUE PAR PROGRAMME`, `payload JSONB`, `observed_at`, `source`, `extension_version`, `score_version`, `created_at`.

### `gauge_alerts`

Elle conserve chaque variation réelle de jauge, de rang, de capacité ou de postulants avec les valeurs avant/après, le delta, la filière, l’université, l’établissement, la date et le batch.

### `sync_batches`

Elle conserve le statut de chaque collecte : `batch_id`, `source`, `extension_version`, `series`, `criteria JSONB`, `received_count`, `updated_count`, `alert_count`, `status`, `error_message`, `observed_at`, `created_at`.

Active RLS. Autorise la lecture publique uniquement des informations non sensibles nécessaires à l’exploration et aux statistiques. Interdis les écritures directes de `anon` et `authenticated`. Les écritures passent par la fonction Edge avec la clé serveur.

Ne mets jamais dans le frontend, dans Vercel ou dans l’extension :

- `SUPABASE_SERVICE_ROLE_KEY` ;

- URI PostgreSQL ;

- mot de passe de base de données ;

- secret d’administration.

## 5. Fonction Edge `mhmbac-sync`

Crée ou corrige cette fonction avec les exigences suivantes :

1. gérer `OPTIONS` et `POST` avec CORS ;

1. valider strictement le JSON ;

1. refuser les batchs vides ou supérieurs à 500 filières ;

1. valider les identifiants, textes, dates et entiers non négatifs ;

1. dédupliquer les `programmeId` dans un batch ;

1. calculer une empreinte SHA-256 du snapshot ;

1. lire l’ancien état de chaque filière ;

1. recalculer le score côté serveur ;

1. faire un upsert idempotent dans `live_programmes` ;

1. conserver l’historique dans `gauge_observations` ;

1. créer les variations dans `gauge_alerts` ;

1. enregistrer le batch dans `sync_batches` ;

1. retourner `ok`, `batchId`, `received`, `updated`, `alerts`, `scoreVersion`, `observedAt` et la fraîcheur.

Le jeton éventuellement présent dans l’extension est un garde-fou complémentaire, pas un secret fort. Une extension installée peut être inspectée. Ajoute donc également validation stricte, limitation de taille, déduplication, logs et rotation possible du jeton.

## 6. Score v1

Le score est un indicateur de comparaison, jamais une garantie d’admission ou de bourse.

Calcule, lorsque les données sont présentes :

- un score bourse à partir de `scholarships / total` ;

- un indicateur de pression à partir de la catégorie de mention ciblée et du total ;

- un score d’admission observée comme indicateur inverse de pression ;

- une correspondance carrière uniquement à partir de données de catalogue vérifiables ;

- un score global sur 100 ;

- `scoreVersion`, `scoreConfidence`, `factors` et `explanation`.

Pour l’objectif bourse, privilégie le score bourse. Pour l’objectif carrière, privilégie la correspondance carrière. Pour la faible concurrence, privilégie l’indicateur de pression. Les facteurs indisponibles doivent diminuer la confiance, pas être remplacés par une estimation.

Le calcul doit être une fonction pure, testable et reproductible.

## 7. Frontend live MHMbac

Remplace progressivement les lectures de `DEMO_PROGRAMMES` par une couche de données live, sans casser le mode démonstration. Le site doit afficher clairement :

- « Données observées » pour les données Supabase réellement reçues ;

- « Démonstration » pour les exemples statiques ;

- la date de dernière collecte ;

- l’âge de la donnée en minutes ;

- le statut de connexion Realtime ;

- les valeurs absentes comme « non disponible » ;

- le score global, les sous-scores, la confiance et « Pourquoi ce score ? » ;

- les variations récentes ;

- le nombre de filières observées, d’universités et d’établissements couverts.

Le parcours public doit être :

1. voir les classements et jauges sans compte ;

1. comprendre ce que signifie chaque jauge ;

1. cliquer sur « Analyser pour mon profil » ;

1. renseigner série, mention et objectif ;

1. voir les résultats personnalisés ;

1. choisir les filières à suivre ;

1. créer un compte seulement pour conserver la shortlist ou recevoir des alertes ;

1. valider manuellement ses choix sur apresmonbac.bj.

Crée des types TypeScript exacts pour `LiveProgramme`, `GaugeObservation`, `GaugeAlert`, `SyncBatch` et `LiveScore`. N’utilise pas `DemoProgramme` pour représenter une donnée live.

## 8. Supabase Realtime

Active Realtime pour `live_programmes`, `gauge_alerts` et `sync_batches` si compatible avec le projet. Dans le frontend :

- charger les données initiales avec pagination ;

- écouter les `INSERT` et `UPDATE` ;

- fusionner les événements sans doublons ;

- rafraîchir les cartes, scores et statistiques sans rechargement ;

- gérer reconnexion, erreur, état vide et données périmées ;

- afficher une indication claire lorsque la dernière collecte est trop ancienne.

## 9. Tests obligatoires

Avant de considérer la mission terminée :

- exécute le typecheck, le lint et les tests unitaires ;

- teste la migration plusieurs fois pour vérifier son idempotence ;

- teste les réponses 400, 401, 413 et 500 de l’Edge Function ;

- teste la déduplication et la création d’alertes ;

- teste la lecture publique RLS ;

- teste le temps réel avec une vraie mise à jour Supabase ;

- vérifie que le frontend ne consomme plus silencieusement `DEMO_PROGRAMMES` lorsque des données live existent ;

- vérifie qu’aucun secret privilégié n’est dans le bundle frontend ;

- vérifie que l’import des choix ne clique jamais automatiquement sur Soumettre.

N’insère pas de données fictives dans Supabase pour faire passer les tests. Si aucune donnée réelle n’est encore disponible, indique-le clairement et fournis un protocole de test avec un batch réel envoyé depuis l’extension.

## 10. Résultat attendu

Implémente réellement les modifications. À la fin, donne-moi :

1. la liste des fichiers modifiés ;

1. les migrations exécutées ;

1. les fonctions Edge créées ou corrigées ;

1. les variables d’environnement nécessaires, sans leurs valeurs secrètes ;

1. le contrat frontend/backend final ;

1. la formule exacte du score ;

1. les tests passés et leurs résultats ;

1. les limites restantes ;

1. les étapes exactes pour déployer et vérifier en production.

Réponds en français. Ne présente aucune donnée simulée comme une donnée live. Ne demande pas d’inscription avant de permettre l’exploration publique. Ne supprime pas les choix ou données existants sans confirmation explicite.

