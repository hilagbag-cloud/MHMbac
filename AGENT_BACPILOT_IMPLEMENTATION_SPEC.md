# Spécification d’intégration — `orientation-assistant`

Cette spécification traduit l’architecture BacPilot en un contrat technique directement implémentable dans une Supabase Edge Function. Elle ne donne jamais à l’agent une connexion SQL générale.

## 1. Endpoint unique

`POST /functions/v1/orientation-assistant`

Le navigateur transmet le JWT Supabase dans l’en-tête `Authorization: Bearer <access_token>`. La fonction valide ce JWT et déduit `currentUserId` **exclusivement** de ce jeton. Aucun champ `user_id` envoyé par le navigateur ou l’IA ne doit être utilisé pour choisir une ligne à lire ou à écrire.

### Requête du navigateur

```json
{
  "action": "answer|recommend|explain|programme_details",
  "message": "texte saisi par le candidat",
  "profile_patch": {
    "first_name": "...",
    "series": "D",
    "mention": "Passable"
  },
  "preference_patch": {
    "objective": "bourse|carriere|equilibre",
    "career_keywords": ["..."]
  },
  "programme_id": "optionnel et validé"
}
```

Le serveur ignore les champs non autorisés. Il accepte uniquement les clés présentes dans les listes blanches correspondantes et impose limites de taille, énumérations, nombre de mots-clés et nettoyage des chaînes.

### Réponse du serveur

```json
{
  "conversation": {
    "message": "réponse destinée au candidat",
    "mode": "deterministic|ai_rephrased|fallback",
    "next_question": "optionnelle"
  },
  "data_freshness": {
    "last_collection_at": "2026-08-15T12:00:00Z",
    "age_minutes": 12,
    "status": "fresh|aging|stale",
    "coverage": 159
  },
  "recommendations": [
    {
      "rank": 1,
      "programme_id": "...",
      "name": "...",
      "score": 0,
      "confidence": "low|medium|high",
      "factors": ["..."],
      "observed_at": "..."
    }
  ],
  "limits": {
    "manual_validation_required": true,
    "ai_explanations_remaining_today": 2
  }
}
```

L’interface affiche les étapes de calcul à partir de champs réels : « lecture des dernières observations », « comparaison de X filières compatibles », « calcul du score », « vérification de la fraîcheur ». Elle ne simule pas une réflexion interne du modèle ni des opérations qui n’ont pas eu lieu.

## 2. Outils internes, sans SQL libre

| Outil interne | Autorisation | Contrôles essentiels |
|---|---|---|
| `readFreshness()` | Lecture globale limitée | Répond avec un résumé, jamais les secrets de collecte. |
| `readOwnProfile(currentUserId)` | Ligne appartenant au JWT | `eq('id', currentUserId)` ou RLS équivalente. |
| `readTopRecommendations(input)` | Lecture catalogue via RPC | Série, mention et objectif issus de valeurs validées. |
| `readProgrammeDetails(programmeId)` | Lecture filtrée | `programmeId` doit être alphanumérique/UUID autorisé et résider dans le Top 3 ou la liste publique. |
| `writeOwnProfile(currentUserId, patch)` | Écriture auto-limitée | Colonnes autorisées seulement, `user_id` jamais fourni par le client. |
| `writeOwnPreferences(currentUserId, patch)` | Écriture auto-limitée | Même règle, RLS `auth.uid()` obligatoire. |
| `appendOwnSession(currentUserId, event)` | Écriture auto-limitée | Taille de messages limitée ; pas de contenu système ni clé stockée. |
| `consumeAiQuota(currentUserId)` | Écriture technique auto-limitée | Transaction atomique avant l’appel fournisseur. |

## 3. Tables supplémentaires minimales

```sql
create table if not exists orientation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  step smallint not null default 0 check (step between 0 and 20),
  messages jsonb not null default '[]'::jsonb,
  profile_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table orientation_sessions enable row level security;

create policy "read own orientation sessions"
  on orientation_sessions for select to authenticated
  using (auth.uid() = user_id);

create policy "insert own orientation sessions"
  on orientation_sessions for insert to authenticated
  with check (auth.uid() = user_id);

create policy "update own orientation sessions"
  on orientation_sessions for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  successful_calls smallint not null default 0 check (successful_calls >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table ai_usage_daily enable row level security;
```

Les politiques d’écriture de `ai_usage_daily` doivent être réservées à la fonction serveur ; le candidat n’a aucun droit direct sur cette table. Une RPC transactionnelle doit incrémenter le compteur si, et seulement si, le plafond est encore disponible.

## 4. Moteur de décision et rôle de l’IA

Le calcul des trois recommandations est entièrement déterministe. Il utilise uniquement les observations réellement synchronisées, l’horodatage et les paramètres explicitement saisis par le candidat. L’IA ne reçoit pas un accès Supabase ; elle reçoit un objet JSON issu des outils internes.

```text
Profil et préférences validés
  → RPC de scoring déterministe
  → Top 3 + facteurs + fraîcheur + limites
  → réponse structurée locale
  → [seulement sur demande] reformulation via fournisseur IA
```

Le prompt du fournisseur impose ces règles : ne pas modifier les scores ; ne jamais dire qu’une admission ou une bourse est garantie ; citer la date d’observation ; rappeler la validation manuelle sur le portail officiel ; ne pas inventer de filière, de jauge, de taux ou de source.

## 5. Routage fournisseur et quotas

| Étape | Fournisseur | Règle |
|---|---|---|
| Réponses de base, onboarding, Top 3 | Aucun | Réponses par gabarits et moteur de scoring. Fonctionne toujours. |
| Explication libre volontaire | Gemini Free | Appel si le quota par utilisateur et le plafond global le permettent. |
| Échec temporaire Gemini (`429`, `5xx`, timeout) | Groq Free | Une seule tentative de fallback avec le même contexte minimisé. |
| Échec/quotas dépassés | Aucun | Réponse déterministe riche ; aucune boucle ni nouvelle clé. |
| Recherche du guide officielle future | Aucun modèle au lancement | Recherche par extraits validés et citations. |

Un plafond conservateur de lancement est de **3 explications IA réussies par candidat et par jour**, une requête à la fois par session, avec une sortie courte. Un deuxième plafond global est configuré dans les secrets serveur, par exemple `AI_GLOBAL_DAILY_LIMIT`. Une réponse IA n’est jamais réessayée en boucle.

## 6. Secrets, traces et confidentialité

| Élément | Emplacement autorisé | Interdit |
|---|---|---|
| `GEMINI_API_KEY`, `GROQ_API_KEY` | Secrets de l’Edge Function | Frontend Vite, dépôt Git, extension Chrome, logs bruts. |
| `SUPABASE_SERVICE_ROLE_KEY` | Seulement `mhmbac-sync` et fonctions administratives isolées | `orientation-assistant`, navigateur, IA externe. |
| Jeton utilisateur | En-tête éphémère de requête | Enregistrement dans `orientation_sessions` ou prompt fournisseur. |
| Conversations | Sessions appartenant au candidat avec RLS | Données de tiers, clés ou prompts système. |

Les journaux de l’agent ne conservent que les métadonnées nécessaires : identifiant pseudonymisé, fournisseur, modèle, résultat, latence, nombre de tokens si disponible, motif de fallback et horodatage. Les messages complets ne doivent être journalisés que si une politique de conservation et le consentement l’autorisent.

## 7. Critères de recette indispensables

| Test | Résultat attendu |
|---|---|
| Un utilisateur A tente de lire le profil de B | Refus RLS ou réponse vide. |
| Un navigateur falsifie `user_id: B` dans une requête | La fonction utilise l’identité JWT de A. |
| Un prompt demande « modifie toutes les recommandations » | Aucun outil d’écriture catalogue n’existe ; aucune modification. |
| Gemini répond `429` | Une tentative Groq maximum, puis réponse déterministe. |
| Les observations datent trop | L’agent l’indique ; il ne présente pas le résultat comme actuel. |
| L’extension est arrêtée | Le site conserve le dernier état et expose clairement son âge. |
| L’utilisateur demande de valider une option officielle | L’agent explique la procédure mais n’envoie aucune action au portail officiel. |

## 8. Décision à prendre avant le code

La configuration recommandée est : **Gemini Free comme fournisseur principal de reformulation, Groq Free comme secours unique, et mode déterministe comme capacité permanente**. Cette décision est réversible car les fournisseurs sont encapsulés dans un routeur serveur unique.

La prochaine étape de développement est donc sans risque de verrouillage : créer la migration des sessions et du quota, développer la RPC de scoring, puis connecter l’interface conversationnelle. L’ajout des clés API n’intervient qu’après ces étapes et uniquement dans les secrets côté serveur.
